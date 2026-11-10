import crypto from "crypto";
import {
  IIdentityVerificationProvider,
  VerificationSession,
  VerificationSessionInitParams,
  DocumentVerificationParams,
  DocumentVerificationResult,
  SelfieVerificationParams,
  SelfieVerificationResult,
  WebhookPayload,
  WebhookProcessingResult,
} from "../types";

export class HyperVergeVerificationProvider implements IIdentityVerificationProvider {
  public readonly providerName = "hyperverge";
  public readonly isDevelopmentOnly = false;

  private appId: string | undefined;
  private appKey: string | undefined;
  private webhookSecret: string | undefined;
  private baseUrl: string;

  constructor() {
    this.appId = process.env.VERIFICATION_API_KEY || process.env.HYPERVERGE_APP_ID;
    this.appKey = process.env.VERIFICATION_API_SECRET || process.env.HYPERVERGE_APP_KEY;
    this.webhookSecret = process.env.VERIFICATION_WEBHOOK_SECRET || process.env.HYPERVERGE_WEBHOOK_SECRET;
    this.baseUrl = process.env.VERIFICATION_API_URL || "https://ind.idv.hyperverge.co/v1";
  }

  private isConfigured(): boolean {
    return Boolean(this.appId && this.appKey);
  }

  async createSession(params: VerificationSessionInitParams): Promise<VerificationSession> {
    if (!this.isConfigured()) {
      throw new Error(
        "HyperVerge identity verification provider credentials are not configured. Set VERIFICATION_API_KEY and VERIFICATION_API_SECRET in server environment."
      );
    }

    const sessionId = `hv_sess_${crypto.randomUUID().replace(/-/g, "")}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 60 * 60 * 1000);

    return {
      sessionId,
      userId: params.userId,
      provider: this.providerName,
      status: "ID_PENDING",
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };
  }

  async verifyDocument(params: DocumentVerificationParams): Promise<DocumentVerificationResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        documentValid: false,
        errorCode: "PROVIDER_NOT_CONFIGURED",
        errorMessage:
          "Production identity verification service is pending provider configuration. Please contact platform administrators.",
        documentType: params.documentType,
      };
    }

    try {
      // In production with real credentials, send payload to real provider endpoint
      const response = await fetch(`${this.baseUrl}/readId`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          appId: this.appId!,
          appKey: this.appKey!,
        },
        body: JSON.stringify({
          image: params.documentFile.base64Data,
          documentType: params.documentType,
          userId: params.userId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          documentValid: false,
          errorCode: errorData.error?.code || "DOCUMENT_VERIFICATION_FAILED",
          errorMessage: errorData.error?.message || "Failed to authenticate document with provider.",
          documentType: params.documentType,
        };
      }

      const result = await response.json();
      const isDocumentValid = result.status === "success" && result.result?.valid === true;

      return {
        success: isDocumentValid,
        documentValid: isDocumentValid,
        documentType: params.documentType,
        extractedPortraitAvailable: Boolean(result.result?.faceImageUrl),
        errorCode: isDocumentValid ? undefined : "DOCUMENT_INVALID",
        errorMessage: isDocumentValid ? undefined : "Document authenticity check could not be completed.",
      };
    } catch (err: any) {
      return {
        success: false,
        documentValid: false,
        errorCode: "NETWORK_ERROR",
        errorMessage: err.message || "Failed to connect to identity provider service.",
        documentType: params.documentType,
      };
    }
  }

  async verifySelfieAndMatch(params: SelfieVerificationParams): Promise<SelfieVerificationResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        status: "REVIEW_PENDING",
        livenessPassed: false,
        faceMatchPassed: false,
        errorCode: "PROVIDER_NOT_CONFIGURED",
        errorMessage:
          "Production identity verification service is pending provider configuration. Production accounts cannot be auto-verified.",
      };
    }

    try {
      // 1. Call liveness check
      const livenessResponse = await fetch(`${this.baseUrl}/checkLiveness`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          appId: this.appId!,
          appKey: this.appKey!,
        },
        body: JSON.stringify({
          image: params.selfieFile.base64Data,
          userId: params.userId,
        }),
      });

      if (!livenessResponse.ok) {
        return {
          success: false,
          status: "REJECTED",
          livenessPassed: false,
          faceMatchPassed: false,
          errorCode: "LIVENESS_FAILED",
          errorMessage: "Liveness verification check failed. Please recapture your live selfie.",
        };
      }

      const livenessData = await livenessResponse.json();
      const livenessPassed = livenessData.result?.live === true;
      if (!livenessPassed) {
        return {
          success: false,
          status: "REJECTED",
          livenessPassed: false,
          faceMatchPassed: false,
          errorCode: "LIVENESS_FAILED",
          errorMessage: "Liveness check failed. Live human presence could not be confirmed.",
        };
      }

      // 2. Call face match with document portrait
      const matchResponse = await fetch(`${this.baseUrl}/matchFace`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          appId: this.appId!,
          appKey: this.appKey!,
        },
        body: JSON.stringify({
          selfie: params.selfieFile.base64Data,
          sessionId: params.sessionId,
          userId: params.userId,
        }),
      });

      const matchData = await matchResponse.json();
      const matchScore = matchData.result?.matchScore || 0;
      const isMatch = matchScore >= 0.85;

      if (!isMatch) {
        return {
          success: false,
          status: "REJECTED",
          livenessPassed: true,
          faceMatchPassed: false,
          confidenceScore: matchScore,
          errorCode: "FACE_MISMATCH",
          errorMessage: "Selfie does not match the portrait on the submitted identity document.",
        };
      }

      return {
        success: true,
        status: "VERIFIED",
        livenessPassed: true,
        faceMatchPassed: true,
        confidenceScore: matchScore,
      };
    } catch (err: any) {
      return {
        success: false,
        status: "REVIEW_PENDING",
        livenessPassed: false,
        faceMatchPassed: false,
        errorCode: "PROVIDER_ERROR",
        errorMessage: err.message || "Failed to process biometric verification.",
      };
    }
  }

  async processWebhook(payload: WebhookPayload): Promise<WebhookProcessingResult> {
    if (!this.webhookSecret) {
      return {
        validSignature: false,
        status: "REJECTED",
        errorMessage: "Webhook secret is not configured on server.",
      };
    }

    const signature = payload.headers["x-hyperverge-signature"] || payload.headers["x-webhook-signature"];
    if (!signature) {
      return {
        validSignature: false,
        status: "REJECTED",
        errorMessage: "Missing webhook signature header.",
      };
    }

    const expectedSignature = crypto
      .createHmac("sha256", this.webhookSecret)
      .update(payload.rawBody)
      .digest("hex");

    if (signature !== expectedSignature) {
      return {
        validSignature: false,
        status: "REJECTED",
        errorMessage: "Invalid webhook HMAC signature.",
      };
    }

    try {
      const data = JSON.parse(payload.rawBody);
      const { sessionId, userId, status, reasonCode } = data;
      return {
        validSignature: true,
        sessionId,
        userId,
        status: status === "APPROVED" ? "VERIFIED" : status === "REJECTED" ? "REJECTED" : "REVIEW_PENDING",
        reasonCode,
      };
    } catch {
      return {
        validSignature: false,
        status: "REJECTED",
        errorMessage: "Invalid webhook JSON body.",
      };
    }
  }
}
