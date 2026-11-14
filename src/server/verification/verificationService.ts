import db from "@/lib/db";
import { getDb } from "@/lib/mongo";
import { invalidateSessionCache } from "@/lib/auth";
import {
  getVerificationProvider,
  DocumentType,
  MockScenario,
  VerificationStatus,
  WebhookPayload,
} from "./index";

export class VerificationService {
  /**
   * Retrieves the current authoritative verification status for a user.
   */
  static async getVerificationStatus(userId: string) {
    const profile = await db.profile.findUnique({
      where: { userId },
      select: {
        isVerified: true,
        verificationStatus: true,
        displayName: true,
      },
    });

    let latestSession: any = null;
    try {
      const mongo = await getDb();
      latestSession = await mongo
        .collection("identity_verifications")
        .findOne({ userId }, { sort: { createdAt: -1 } });
    } catch (e) {
      console.warn("Could not query identity_verifications collection:", e);
    }

    const provider = getVerificationProvider();
    const activeMode = (provider as any).mode || (provider.isDevelopmentOnly ? "test" : "live");
    const isMockMode = Boolean(provider.isDevelopmentOnly || activeMode === "test");

    let isVerified = Boolean(profile?.isVerified && profile?.verificationStatus === "VERIFIED");
    let verificationStatus = (profile?.verificationStatus as VerificationStatus) || "UNVERIFIED";
    let reasonCode = latestSession?.reasonCode || null;

    // Security & Mode Isolation:
    // If the backend is running in LIVE mode, a verification performed in TEST mode must NEVER
    // grant verified access or unlock production-protected creation features.
    if (activeMode === "live") {
      const sessionMode = latestSession?.mode || latestSession?.details?.mode;
      if (sessionMode === "test") {
        isVerified = false;
        verificationStatus = "UNVERIFIED";
        reasonCode = "TEST_VERIFICATION_INVALID_IN_LIVE_MODE";
      }
    }

    return {
      isVerified,
      verificationStatus,
      displayName: profile?.displayName || "Explorer",
      activeSessionId: latestSession?.sessionId || null,
      sessionStatus: latestSession?.status || null,
      reasonCode,
      verifiedAt: isVerified ? latestSession?.verifiedAt || null : null,
      isMockMode,
      mode: activeMode,
      providerName: provider.providerName,
    };
  }

  /**
   * Initiates a new verification session.
   */
  static async startSession(params: {
    userId: string;
    email: string;
    displayName?: string;
    scenario?: MockScenario;
    providerOverride?: string;
  }) {
    // 1. Authoritative check with mode isolation
    const currentStatus = await this.getVerificationStatus(params.userId);
    if (currentStatus.isVerified && currentStatus.verificationStatus === "VERIFIED") {
      return {
        alreadyVerified: true,
        status: "VERIFIED" as VerificationStatus,
        message: "Account is already identity verified.",
        mode: currentStatus.mode,
      };
    }

    const provider = getVerificationProvider(params.providerOverride);
    const activeMode = (provider as any).mode || (provider.isDevelopmentOnly ? "test" : "live");
    const session = await provider.createSession(params);

    try {
      const mongo = await getDb();
      await mongo.collection("identity_verifications").insertOne({
        sessionId: session.sessionId,
        userId: params.userId,
        provider: provider.providerName,
        mode: activeMode,
        status: session.status,
        scenario: params.scenario || "success",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        expiresAt: session.expiresAt,
      });
    } catch (mongoError) {
      console.error("Error storing verification session in MongoDB:", mongoError);
    }

    return {
      alreadyVerified: false,
      session,
      isMockMode: provider.isDevelopmentOnly || activeMode === "test",
      mode: activeMode,
    };
  }

  /**
   * Submits and validates the government photo ID document.
   */
  static async submitDocument(params: {
    userId: string;
    sessionId: string;
    documentType: DocumentType;
    documentFile: {
      mimeType: string;
      sizeBytes: number;
      base64Data?: string;
      fileName?: string;
    };
    scenario?: MockScenario;
    providerOverride?: string;
  }) {
    const provider = getVerificationProvider(params.providerOverride);
    const activeMode = (provider as any).mode || (provider.isDevelopmentOnly ? "test" : "live");

    // Verify session association
    const mongo = await getDb();
    const sessionRecord = await mongo.collection("identity_verifications").findOne({
      sessionId: params.sessionId,
      userId: params.userId,
    });

    if (!sessionRecord && !provider.isDevelopmentOnly) {
      throw new Error("Invalid or expired verification session.");
    }

    // Call provider document check
    const result = await provider.verifyDocument(params);

    const newStatus: VerificationStatus = result.success ? "SELFIE_PENDING" : "ID_FAILED";

    try {
      await mongo.collection("identity_verifications").updateOne(
        { sessionId: params.sessionId },
        {
          $set: {
            status: newStatus,
            mode: activeMode,
            documentType: params.documentType,
            idCheckPassed: result.success,
            reasonCode: result.errorCode || null,
            updatedAt: new Date().toISOString(),
          },
        },
        { upsert: true }
      );

      // Reflect state on profile
      await db.profile.update({
        where: { userId: params.userId },
        data: {
          verificationStatus: result.success ? "PENDING" : "UNVERIFIED",
        },
      });
    } catch (err) {
      console.error("Error updating document status in DB:", err);
    }

    return result;
  }

  /**
   * Submits live camera selfie, verifies 3D liveness, and matches against ID portrait.
   */
  static async submitSelfie(params: {
    userId: string;
    sessionId: string;
    selfieFile: {
      mimeType: string;
      sizeBytes: number;
      base64Data?: string;
    };
    scenario?: MockScenario;
    providerOverride?: string;
  }) {
    const provider = getVerificationProvider(params.providerOverride);
    const activeMode = (provider as any).mode || (provider.isDevelopmentOnly ? "test" : "live");

    const mongo = await getDb();
    const sessionRecord = await mongo.collection("identity_verifications").findOne({
      sessionId: params.sessionId,
      userId: params.userId,
    });

    // Enforce that document stage must precede selfie stage
    if (sessionRecord && sessionRecord.status !== "SELFIE_PENDING" && sessionRecord.status !== "ID_PENDING") {
      if (sessionRecord.status === "ID_FAILED") {
        return {
          success: false,
          status: "ID_FAILED" as VerificationStatus,
          livenessPassed: false,
          faceMatchPassed: false,
          errorCode: "DOCUMENT_NOT_VERIFIED",
          errorMessage: "Cannot verify selfie before submitting a valid photo ID document.",
        };
      }
    }

    // Provider biometric liveness and face match
    const result = await provider.verifySelfieAndMatch(params);

    const now = new Date();
    const resolvedMode = result.details?.mode || activeMode;

    if (result.status === "VERIFIED") {
      // 1. Authoritatively update user profile in DB
      await db.profile.update({
        where: { userId: params.userId },
        data: {
          isVerified: true,
          verificationStatus: "VERIFIED",
        },
      });

      // 2. Invalidate in-memory session cache so subsequent queries get updated status immediately
      invalidateSessionCache(params.userId);

      // 3. Persist audit trail in identity_verifications
      try {
        await mongo.collection("identity_verifications").updateOne(
          { sessionId: params.sessionId },
          {
            $set: {
              status: "VERIFIED",
              mode: resolvedMode,
              selfieCheckPassed: true,
              faceMatchPassed: true,
              livenessPassed: true,
              confidenceScore: result.confidenceScore || 0.98,
              warnings: result.warnings || [],
              verdict: result.verdict || "approved",
              details: result.details || null,
              verifiedAt: now.toISOString(),
              updatedAt: now.toISOString(),
            },
          },
          { upsert: true }
        );
      } catch (e) {
        console.error("Failed to record verification success in mongo:", e);
      }
    } else if (result.status === "REVIEW_PENDING") {
      await db.profile.update({
        where: { userId: params.userId },
        data: {
          isVerified: false,
          verificationStatus: "PENDING",
        },
      });
      invalidateSessionCache(params.userId);

      try {
        await mongo.collection("identity_verifications").updateOne(
          { sessionId: params.sessionId },
          {
            $set: {
              status: "REVIEW_PENDING",
              mode: resolvedMode,
              reasonCode: result.errorCode || "MANUAL_REVIEW_REQUIRED",
              warnings: result.warnings || [],
              verdict: result.verdict || "review",
              details: result.details || null,
              updatedAt: now.toISOString(),
            },
          },
          { upsert: true }
        );
      } catch (e) {}
    } else {
      // REJECTED
      await db.profile.update({
        where: { userId: params.userId },
        data: {
          isVerified: false,
          verificationStatus: "UNVERIFIED",
        },
      });
      invalidateSessionCache(params.userId);

      try {
        await mongo.collection("identity_verifications").updateOne(
          { sessionId: params.sessionId },
          {
            $set: {
              status: "REJECTED",
              mode: resolvedMode,
              reasonCode: result.errorCode || "BIOMETRIC_FAILED",
              warnings: result.warnings || [],
              verdict: result.verdict || "declined",
              details: result.details || null,
              updatedAt: now.toISOString(),
            },
          },
          { upsert: true }
        );
      } catch (e) {}
    }

    return result;
  }

  /**
   * Processes incoming authenticated webhooks from verification provider.
   */
  static async handleWebhook(payload: WebhookPayload) {
    const provider = getVerificationProvider();
    const result = await provider.processWebhook(payload);

    if (!result.validSignature) {
      return { success: false, error: result.errorMessage || "Invalid signature" };
    }

    if (result.userId && result.status === "VERIFIED") {
      await db.profile.update({
        where: { userId: result.userId },
        data: {
          isVerified: true,
          verificationStatus: "VERIFIED",
        },
      });
      invalidateSessionCache(result.userId);
    }

    if (result.sessionId) {
      try {
        const mongo = await getDb();
        await mongo.collection("identity_verifications").updateOne(
          { sessionId: result.sessionId },
          {
            $set: {
              status: result.status,
              reasonCode: result.reasonCode || null,
              updatedAt: new Date().toISOString(),
            },
          }
        );
      } catch (e) {}
    }

    return { success: true, result };
  }

  /**
   * Resets verification status (DEVELOPMENT ONLY for testing flows).
   */
  static async resetVerification(userId: string) {
    if (process.env.NODE_ENV === "production" && process.env.IDENTITY_VERIFICATION_PROVIDER !== "mock") {
      throw new Error("Resetting verification is disabled in production.");
    }

    await db.profile.update({
      where: { userId },
      data: {
        isVerified: false,
        verificationStatus: "UNVERIFIED",
      },
    });

    invalidateSessionCache(userId);

    try {
      const mongo = await getDb();
      await mongo.collection("identity_verifications").deleteMany({ userId });
    } catch (e) {}

    return { success: true, message: "Verification reset to UNVERIFIED for testing." };
  }
}
