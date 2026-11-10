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
  VerificationStatus,
} from "../types";
import { getDb } from "@/lib/mongo";

export type NeetixMode = "test" | "live";

export interface NeetixKeyDetectionResult {
  valid: boolean;
  mode: NeetixMode | null;
  error?: string;
}

/**
 * Validates and detects the Neetix API key mode according to official vendor formats:
 * - Test key: starts with 'lv_test_' (e.g. lv_test_L0s9pIdsuJVlVtDAwxWw30C8DeDFuYZmMId9XVwe)
 * - Live key: starts with 'lv_' followed by key body, excluding 'lv_test_' (e.g. lv_9f2c4e8a1b2c3d4e...)
 *
 * Never infers an unknown prefix as a live key. Rejects malformed or unrecognized formats safely.
 */
export function detectNeetixKeyMode(apiKey?: string): NeetixKeyDetectionResult {
  if (!apiKey || typeof apiKey !== "string" || !apiKey.trim()) {
    return {
      valid: false,
      mode: null,
      error: "Missing NEETIX_API_KEY environment variable. Verification provider is unconfigured.",
    };
  }

  const cleanKey = apiKey.trim();

  // Test key format: starts with 'lv_test_' followed by alphanumeric/underscore/dash, minimum total length 16
  const testKeyRegex = /^lv_test_[a-zA-Z0-9_-]{8,}$/;
  if (testKeyRegex.test(cleanKey)) {
    return {
      valid: true,
      mode: "test",
    };
  }

  // Live key format: starts with 'lv_' (and NOT 'lv_test_') followed by alphanumeric/underscore/dash, minimum total length 12
  const liveKeyRegex = /^lv_(?!test_)[a-zA-Z0-9_-]{8,}$/;
  if (liveKeyRegex.test(cleanKey)) {
    return {
      valid: true,
      mode: "live",
    };
  }

  return {
    valid: false,
    mode: null,
    error: "Invalid or unrecognized NEETIX_API_KEY format. Key must start with 'lv_test_' (test mode) or 'lv_' (live mode).",
  };
}

interface CachedCardImage {
  mimeType: string;
  sizeBytes: number;
  base64Data: string;
  fileName?: string;
  cachedAt: number;
}

export class NeetixVerificationProvider implements IIdentityVerificationProvider {
  public readonly providerName = "neetix";
  public readonly isDevelopmentOnly = false;
  public readonly mode: NeetixMode | null = null;
  public readonly keyValidationError: string | null = null;

  private apiKey: string | undefined;
  private baseUrl: string;
  private webhookSecret: string | undefined;
  private signingPublicKey: string | null = null;
  private signingChecked = false;

  // In-memory session store for temporary card image retention between step 2 and step 3
  private sessionCardCache = new Map<string, CachedCardImage>();

  constructor(customApiKey?: string) {
    this.apiKey = (customApiKey !== undefined ? customApiKey : (process.env.NEETIX_API_KEY || "")).trim();
    this.baseUrl = (process.env.NEETIX_BASE_URL || "https://liveliness.neetix.in").replace(/\/$/, "");
    this.webhookSecret = (
      process.env.NEETIX_WEBHOOK_SECRET ||
      process.env.VERIFICATION_WEBHOOK_SECRET ||
      ""
    ).trim();

    const detection = detectNeetixKeyMode(this.apiKey);
    if (detection.valid && detection.mode) {
      this.mode = detection.mode;
      this.keyValidationError = null;
    } else {
      this.mode = null;
      this.keyValidationError = detection.error || "Invalid NEETIX_API_KEY";
    }
  }

  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.mode !== null);
  }

  public getMode(): NeetixMode {
    if (!this.mode) {
      throw new Error(this.keyValidationError || "Neetix provider is not configured with a valid API key.");
    }
    return this.mode;
  }

  /**
   * Lazily fetches and caches the Ed25519 response verification key from Neetix
   */
  private async getSigningPublicKey(): Promise<string | null> {
    if (this.signingChecked) return this.signingPublicKey;
    try {
      const res = await fetch(`${this.baseUrl}/v1/verification-key`, {
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.enabled !== false && data.public_key_base64) {
          this.signingPublicKey = data.public_key_base64;
        }
      }
    } catch (e) {
      console.warn("[NeetixVerificationProvider] Could not query /v1/verification-key:", e);
    } finally {
      this.signingChecked = true;
    }
    return this.signingPublicKey;
  }

  /**
   * Verifies Ed25519 signature on response if signature header is provided
   */
  private async verifyResponseSignature(
    rawBody: string,
    signatureHeader: string | null
  ): Promise<boolean> {
    if (!signatureHeader) return true; // Signature not sent by vendor
    const pubKeyBase64 = await this.getSigningPublicKey();
    if (!pubKeyBase64) return true; // Signing not enabled on vendor deployment

    try {
      // Signature header format: "ed25519=<base64>" or raw base64
      const sigClean = signatureHeader.replace(/^ed25519=/, "").trim();
      const sigBuf = Buffer.from(sigClean, "base64");
      const pubKeyBuf = Buffer.from(pubKeyBase64, "base64");

      // Wrap raw public key into DER SubjectPublicKeyInfo format for Ed25519 if 32 bytes
      let publicKeyObj: crypto.KeyObject;
      if (pubKeyBuf.length === 32) {
        // ASN.1 prefix for Ed25519 public key (12 bytes)
        const ed25519Prefix = Buffer.from("302a300506032b6570032100", "hex");
        const derBuf = Buffer.concat([ed25519Prefix, pubKeyBuf]);
        publicKeyObj = crypto.createPublicKey({ key: derBuf, format: "der", type: "spki" });
      } else {
        publicKeyObj = crypto.createPublicKey({ key: pubKeyBuf, format: "der", type: "spki" });
      }

      return crypto.verify(null, Buffer.from(rawBody, "utf8"), publicKeyObj, sigBuf);
    } catch (err) {
      console.error("[NeetixVerificationProvider] Signature verification error:", err);
      return false;
    }
  }

  /**
   * Cleans up expired cache items older than 15 minutes
   */
  private pruneCardCache() {
    const now = Date.now();
    this.sessionCardCache.forEach((val, key) => {
      if (now - val.cachedAt > 15 * 60 * 1000) {
        this.sessionCardCache.delete(key);
      }
    });
  }

  async createSession(params: VerificationSessionInitParams): Promise<VerificationSession> {
    if (!this.isConfigured()) {
      throw new Error(
        this.keyValidationError ||
          "Neetix provider credentials are not configured. Set NEETIX_API_KEY with a valid 'lv_test_...' or 'lv_...' key."
      );
    }

    const sessionId = `ntx_sess_${crypto.randomUUID().replace(/-/g, "")}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour TTL

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

  /**
   * Step 2: Validates document image, ensures accepted formats, and caches card image for selfie face match.
   */
  async verifyDocument(params: DocumentVerificationParams): Promise<DocumentVerificationResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        documentValid: false,
        errorCode: "PROVIDER_NOT_CONFIGURED",
        errorMessage: this.keyValidationError || "Neetix identity verification provider is pending configuration.",
        documentType: params.documentType,
      };
    }

    // 1. File Type & Size Validation
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
    const mime = (params.documentFile.mimeType || "").toLowerCase();
    if (!allowedMimeTypes.includes(mime)) {
      return {
        success: false,
        documentValid: false,
        errorCode: "INVALID_MIME_TYPE",
        errorMessage: "Accepted document formats: JPEG, PNG, or WebP.",
        documentType: params.documentType,
      };
    }

    if (params.documentFile.sizeBytes > 5 * 1024 * 1024) {
      return {
        success: false,
        documentValid: false,
        errorCode: "FILE_TOO_LARGE",
        errorMessage: "Document file size exceeds the 5MB maximum limit.",
        documentType: params.documentType,
      };
    }

    if (!params.documentFile.base64Data) {
      return {
        success: false,
        documentValid: false,
        errorCode: "MISSING_IMAGE_DATA",
        errorMessage: "Document image data is missing.",
        documentType: params.documentType,
      };
    }

    // 2. Cache document card image in-memory for step 3 face-match call
    this.pruneCardCache();
    this.sessionCardCache.set(params.sessionId, {
      mimeType: mime,
      sizeBytes: params.documentFile.sizeBytes,
      base64Data: params.documentFile.base64Data,
      fileName: params.documentFile.fileName || "id_card.jpg",
      cachedAt: Date.now(),
    });

    // Also persist card image reference into Mongo session record for resilience across restarts
    try {
      const mongo = await getDb();
      await mongo.collection("identity_verifications").updateOne(
        { sessionId: params.sessionId },
        {
          $set: {
            "tempStorage.cardImage": {
              mimeType: mime,
              sizeBytes: params.documentFile.sizeBytes,
              base64Data: params.documentFile.base64Data,
              fileName: params.documentFile.fileName || "id_card.jpg",
            },
            documentType: params.documentType,
            mode: this.mode,
            updatedAt: new Date().toISOString(),
          },
        },
        { upsert: true }
      );
    } catch (mongoErr) {
      console.warn("[NeetixVerificationProvider] Could not update tempStorage in Mongo:", mongoErr);
    }

    return {
      success: true,
      documentValid: true,
      documentType: params.documentType,
      extractedPortraitAvailable: true,
    };
  }

  /**
   * Helper to retrieve card image for session from cache or MongoDB
   */
  private async getCardImageForSession(sessionId: string): Promise<CachedCardImage | null> {
    // 1. Check in-memory cache
    const mem = this.sessionCardCache.get(sessionId);
    if (mem && mem.base64Data) return mem;

    // 2. Fallback to MongoDB session tempStorage
    try {
      const mongo = await getDb();
      const session = await mongo.collection("identity_verifications").findOne({ sessionId });
      if (session?.tempStorage?.cardImage?.base64Data) {
        const card = session.tempStorage.cardImage;
        return {
          mimeType: card.mimeType || "image/jpeg",
          sizeBytes: card.sizeBytes || 0,
          base64Data: card.base64Data,
          fileName: card.fileName || "id_card.jpg",
          cachedAt: Date.now(),
        };
      }
    } catch (e) {
      console.warn("[NeetixVerificationProvider] Failed to read Mongo tempStorage for card:", e);
    }

    return null;
  }

  /**
   * Helper to clean up temporary raw image data after verification for data minimization
   */
  private async cleanUpCardStorage(sessionId: string): Promise<void> {
    this.sessionCardCache.delete(sessionId);
    try {
      const mongo = await getDb();
      await mongo.collection("identity_verifications").updateOne(
        { sessionId },
        {
          $unset: { tempStorage: "" },
        }
      );
    } catch (e) {
      // Non-blocking cleanup
    }
  }

  /**
   * Step 3: Submits selfie + reference card image to Neetix /v1/face/face-match using multipart/form-data.
   * Differentiates evaluation rules between LIVE mode and TEST mode.
   */
  async verifySelfieAndMatch(params: SelfieVerificationParams): Promise<SelfieVerificationResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        status: "REVIEW_PENDING",
        livenessPassed: false,
        faceMatchPassed: false,
        errorCode: "PROVIDER_NOT_CONFIGURED",
        errorMessage: this.keyValidationError || "Neetix identity verification provider is pending configuration.",
      };
    }

    const currentMode: NeetixMode = this.mode || "test";

    // 1. Validate Selfie File
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
    const selfieMime = (params.selfieFile.mimeType || "image/jpeg").toLowerCase();
    if (!allowedMimeTypes.includes(selfieMime)) {
      return {
        success: false,
        status: "REJECTED",
        livenessPassed: false,
        faceMatchPassed: false,
        errorCode: "INVALID_MIME_TYPE",
        errorMessage: "Invalid camera capture format. Please recapture your live selfie.",
      };
    }

    if (params.selfieFile.sizeBytes > 5 * 1024 * 1024) {
      return {
        success: false,
        status: "REJECTED",
        livenessPassed: false,
        faceMatchPassed: false,
        errorCode: "FILE_TOO_LARGE",
        errorMessage: "Selfie file size exceeds 5MB limit.",
      };
    }

    if (!params.selfieFile.base64Data) {
      return {
        success: false,
        status: "REJECTED",
        livenessPassed: false,
        faceMatchPassed: false,
        errorCode: "MISSING_SELFIE_DATA",
        errorMessage: "Live camera selfie data was not received.",
      };
    }

    // 2. Retrieve the associated ID card image from session
    const cardImage = await this.getCardImageForSession(params.sessionId);
    if (!cardImage || !cardImage.base64Data) {
      return {
        success: false,
        status: "ID_FAILED",
        livenessPassed: false,
        faceMatchPassed: false,
        errorCode: "DOCUMENT_NOT_FOUND",
        errorMessage: "Reference ID document not found for this session. Please re-upload your photo ID.",
      };
    }

    // 3. Prepare binary buffers from base64 strings
    let selfieBuffer: Buffer;
    let cardBuffer: Buffer;
    try {
      const cleanSelfie = params.selfieFile.base64Data.replace(/^data:image\/\w+;base64,/, "");
      selfieBuffer = Buffer.from(cleanSelfie, "base64");

      const cleanCard = cardImage.base64Data.replace(/^data:image\/\w+;base64,/, "");
      cardBuffer = Buffer.from(cleanCard, "base64");
    } catch (decErr) {
      return {
        success: false,
        status: "REJECTED",
        livenessPassed: false,
        faceMatchPassed: false,
        errorCode: "IMAGE_DECODE_FAILED",
        errorMessage: "Failed to decode submitted images.",
      };
    }

    // 4. Construct multipart/form-data payload for Neetix POST /v1/face/face-match
    // IMPORTANT: Do NOT manually set multipart boundary; runtime/FormData manages it automatically.
    const formData = new FormData();
    const selfieBlob = new Blob([new Uint8Array(selfieBuffer)], { type: selfieMime });
    const cardBlob = new Blob([new Uint8Array(cardBuffer)], { type: cardImage.mimeType });

    formData.append("person", selfieBlob, "selfie.jpg");
    formData.append("card", cardBlob, cardImage.fileName || "id_card.jpg");
    formData.append("clientRefId", params.sessionId);
    formData.append("customer_id", params.userId);

    let endpoint = `${this.baseUrl}/v1/face/face-match`;
    let response: Response | undefined;
    let responseText = "";

    try {
      let attempts = 0;
      while (attempts < 2) {
        attempts++;
        try {
          response = await fetch(endpoint, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
            },
            body: formData,
            signal: AbortSignal.timeout(30000), // 30s timeout
          });

          responseText = await response.text();
          break;
        } catch (callErr: any) {
          const isConnectTimeout =
            callErr.code === "UND_ERR_CONNECT_TIMEOUT" ||
            callErr.cause?.code === "UND_ERR_CONNECT_TIMEOUT" ||
            callErr.message?.includes("Connect Timeout");

          if (attempts < 2 && isConnectTimeout) {
            console.warn("[NeetixVerificationProvider] Transient connection timeout, retrying once...");
            await new Promise((r) => setTimeout(r, 1000));
            continue;
          }
          throw callErr;
        }
      }

      if (!response) {
        throw new Error("No response received from verification provider.");
      }
    } catch (netErr: any) {
      console.error("[NeetixVerificationProvider] Network/Timeout error contacting Neetix:", netErr);
      const isTimeout = netErr.name === "TimeoutError" || netErr.name === "AbortError";
      return {
        success: false,
        status: "REVIEW_PENDING",
        livenessPassed: false,
        faceMatchPassed: false,
        errorCode: isTimeout ? "TIMEOUT" : "NETWORK_ERROR",
        errorMessage: isTimeout
          ? "Verification request timed out. Please try again."
          : "Unable to connect to verification engine. Please try again shortly.",
      };
    } finally {
      // Data Minimization: immediately purge raw ID card data from temporary storage
      await this.cleanUpCardStorage(params.sessionId);
    }

    // 5. Verify detached response signature if present
    const sigHeader = response.headers.get("x-neetix-signature");
    const sigValid = await this.verifyResponseSignature(responseText, sigHeader);
    if (!sigValid) {
      console.error("[NeetixVerificationProvider] X-Neetix-Signature mismatch on response!");
      return {
        success: false,
        status: "REVIEW_PENDING",
        livenessPassed: false,
        faceMatchPassed: false,
        errorCode: "SIGNATURE_VERIFICATION_FAILED",
        errorMessage: "Response cryptographic signature verification failed.",
      };
    }

    // 6. Handle HTTP Error Responses
    let responseData: any = {};
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = {};
    }

    // HTTP 422: Face not found or undecodable image
    if (response.status === 422) {
      const errMsg =
        responseData.error ||
        "No face found in one or both of the submitted images. Please ensure clear frontal lighting.";
      return {
        success: false,
        status: "REJECTED",
        livenessPassed: false,
        faceMatchPassed: false,
        errorCode: "NO_FACE_DETECTED",
        errorMessage: errMsg,
      };
    }

    // HTTP 401: Unauthorized
    if (response.status === 401) {
      console.error("[NeetixVerificationProvider] 401 Unauthorized from Neetix API");
      return {
        success: false,
        status: "REVIEW_PENDING",
        livenessPassed: false,
        faceMatchPassed: false,
        errorCode: "PROVIDER_AUTH_ERROR",
        errorMessage: "Verification service authentication failed. Please verify NEETIX_API_KEY.",
      };
    }

    // HTTP 402: Insufficient credits
    if (response.status === 402) {
      console.error("[NeetixVerificationProvider] 402 Insufficient credits on Neetix account");
      return {
        success: false,
        status: "REVIEW_PENDING",
        livenessPassed: false,
        faceMatchPassed: false,
        errorCode: "INSUFFICIENT_CREDITS",
        errorMessage: "Verification credit balance exhausted. Please top up your account.",
      };
    }

    // HTTP 413: Payload too large
    if (response.status === 413) {
      return {
        success: false,
        status: "REJECTED",
        livenessPassed: false,
        faceMatchPassed: false,
        errorCode: "PAYLOAD_TOO_LARGE",
        errorMessage: "Image file size exceeds Neetix 5MB limit.",
      };
    }

    // HTTP 429: Rate limited
    if (response.status === 429) {
      return {
        success: false,
        status: "REVIEW_PENDING",
        livenessPassed: false,
        faceMatchPassed: false,
        errorCode: "RATE_LIMITED",
        errorMessage: "Verification rate limit exceeded. Please retry in 30 seconds.",
      };
    }

    if (!response.ok) {
      return {
        success: false,
        status: "REVIEW_PENDING",
        livenessPassed: false,
        faceMatchPassed: false,
        errorCode: responseData.message_code || "PROVIDER_ERROR",
        errorMessage: responseData.message || `Provider returned HTTP ${response.status}`,
      };
    }

    // 7. Parse HTTP 200 FaceMatchResponse
    const verdict = (responseData.verdict || "declined").toLowerCase();
    const warnings = Array.isArray(responseData.warnings) ? responseData.warnings : [];
    const result = responseData.result || {};
    const mode = responseData.mode || currentMode;

    const isSameFace = Boolean(result.is_same_face);
    const sameFaceConfidence = typeof result.same_face_confidence === "number" ? result.same_face_confidence : 0;
    const livenessStatus = (result.liveness_status || "unknown").toLowerCase();
    const spoofDetected = Boolean(result.spoof_detected);
    const decision = (result.decision || "").toUpperCase();

    // Check for decline-severity warnings
    const hasDeclineWarning = warnings.some(
      (w: any) => (w.severity || "").toLowerCase() === "decline"
    );

    // Check for review-severity warnings
    const reviewWarnings = warnings.filter(
      (w: any) => (w.severity || "").toLowerCase() === "review"
    );

    const isLivenessUnavailable = warnings.some((w: any) => w.code === "LIVENESS_UNAVAILABLE");

    // Normalized confidence score (0.00 - 1.00)
    const normalizedConfidence = Math.min(1, Math.max(0, sameFaceConfidence / 100));

    let livenessPassed = false;
    let faceMatchPassed = false;
    let finalStatus: VerificationStatus = "REJECTED";
    let isSuccess = false;
    let finalError: string | undefined = undefined;

    if (currentMode === "live") {
      // ═══════════════════════════════════════════════════════════════════
      // LIVE MODE RULES (STRICT PRODUCTION SECURITY)
      // ═══════════════════════════════════════════════════════════════════
      // 1. Missing or unavailable liveness must NOT be treated as successful production liveness.
      // 2. Live verification must NOT be approved merely because API returned HTTP 200.
      // 3. Must be genuinely live: genuine liveness_status AND spoof_detected === false AND NOT unavailable.
      // 4. Must be genuinely same face: is_same_face === true AND decision === "APPROVED" AND confidence >= 70.
      // 5. Verdict must be "approved", no decline warnings, and no review warnings.
      // 6. Live failures NEVER fall back to test mode or mock results.

      livenessPassed = !spoofDetected && livenessStatus === "genuine" && !isLivenessUnavailable;
      faceMatchPassed = isSameFace && decision === "APPROVED" && sameFaceConfidence >= 70;

      if (!faceMatchPassed || !livenessPassed || hasDeclineWarning || verdict === "declined") {
        finalStatus = "REJECTED";
        isSuccess = false;
        if (!faceMatchPassed) {
          finalError = "The live selfie does not match the portrait on the submitted ID document.";
        } else if (spoofDetected || livenessStatus === "spoof") {
          finalError = "Live facial anti-spoofing check failed. Live presence could not be confirmed.";
        } else if (isLivenessUnavailable) {
          finalStatus = "REVIEW_PENDING";
          isSuccess = false;
          finalError = "Live facial anti-spoofing analysis was unavailable. Pending manual review.";
        } else {
          const primaryWarning = warnings.find((w: any) => w.severity === "decline");
          finalError = primaryWarning?.description || "Biometric verification declined.";
        }
      } else if (reviewWarnings.length > 0 || verdict === "review") {
        finalStatus = "REVIEW_PENDING";
        isSuccess = true;
        const primaryWarning = reviewWarnings[0] || warnings[0];
        finalError =
          primaryWarning?.description ||
          "Your verification is undergoing standard manual review by our Trust & Safety team.";
      } else {
        // Genuine live approval
        finalStatus = "VERIFIED";
        isSuccess = true;
      }
    } else {
      // ═══════════════════════════════════════════════════════════════════
      // TEST MODE RULES (DEVELOPMENT & TEST KEY SANDBOX)
      // ═══════════════════════════════════════════════════════════════════
      // In test mode:
      // Test cluster returns LIVENESS_UNAVAILABLE as expected sandbox signal.
      livenessPassed = !spoofDetected && livenessStatus !== "spoof";
      faceMatchPassed = isSameFace && decision === "APPROVED";

      const nonLivenessReviewWarnings = reviewWarnings.filter(
        (w: any) => w.code !== "LIVENESS_UNAVAILABLE"
      );

      if (!faceMatchPassed || !livenessPassed || hasDeclineWarning || verdict === "declined") {
        finalStatus = "REJECTED";
        isSuccess = false;
        if (!faceMatchPassed) {
          finalError = "The live selfie does not match the portrait on the submitted ID document.";
        } else if (!livenessPassed) {
          finalError = "Live facial anti-spoofing check failed. Live presence could not be confirmed.";
        } else {
          const primaryWarning = warnings.find((w: any) => w.severity === "decline");
          finalError = primaryWarning?.description || "Biometric verification declined.";
        }
      } else if (nonLivenessReviewWarnings.length > 0) {
        finalStatus = "REVIEW_PENDING";
        isSuccess = true;
        const primaryWarning = nonLivenessReviewWarnings[0];
        finalError =
          primaryWarning?.description ||
          "Your verification is undergoing standard manual review by our Trust & Safety team.";
      } else {
        // Approved in test mode
        finalStatus = "VERIFIED";
        isSuccess = true;
      }
    }

    return {
      success: isSuccess,
      status: finalStatus,
      livenessPassed,
      faceMatchPassed,
      confidenceScore: normalizedConfidence,
      errorCode: isSuccess ? undefined : "VERIFICATION_DECLINED",
      errorMessage: finalError,
      warnings,
      verdict,
      details: {
        mode: currentMode,
        requestId: responseData.requestId,
        clientRefId: responseData.clientRefId,
        decision,
        sameFaceConfidence,
        livenessStatus,
        spoofDetected,
        personQuality: result.person_quality,
        cardQuality: result.card_quality,
        model_version: result.model_version,
      },
    };
  }

  /**
   * Processes incoming authenticated webhooks from Neetix.
   * Neetix delivers results signed with X-Signature-V2: sha256=<hex>
   */
  async processWebhook(payload: WebhookPayload): Promise<WebhookProcessingResult> {
    if (!this.webhookSecret) {
      console.warn("[NeetixVerificationProvider] NEETIX_WEBHOOK_SECRET is not configured on server.");
      return {
        validSignature: false,
        status: "REJECTED",
        errorMessage: "Webhook secret is not configured on server.",
      };
    }

    const signatureHeader =
      payload.headers["x-signature-v2"] ||
      payload.headers["X-Signature-V2"] ||
      payload.headers["x-signature"] ||
      "";

    if (!signatureHeader) {
      return {
        validSignature: false,
        status: "REJECTED",
        errorMessage: "Missing X-Signature-V2 header on webhook.",
      };
    }

    const expectedSignature = crypto
      .createHmac("sha256", this.webhookSecret)
      .update(payload.rawBody)
      .digest("hex");

    const receivedSig = signatureHeader.replace(/^sha256=/, "").trim();

    try {
      const expectedBuf = Buffer.from(expectedSignature, "utf8");
      const receivedBuf = Buffer.from(receivedSig, "utf8");

      if (expectedBuf.length !== receivedBuf.length || !crypto.timingSafeEqual(expectedBuf, receivedBuf)) {
        return {
          validSignature: false,
          status: "REJECTED",
          errorMessage: "Invalid webhook HMAC signature.",
        };
      }
    } catch {
      return {
        validSignature: false,
        status: "REJECTED",
        errorMessage: "Signature comparison error.",
      };
    }

    try {
      const data = JSON.parse(payload.rawBody);
      const { clientRefId, verdict, result, warnings } = data;

      const isSameFace = Boolean(result?.is_same_face);
      const spoofDetected = Boolean(result?.spoof_detected);
      const livenessStatus = (result?.liveness_status || "unknown").toLowerCase();
      const hasDeclineWarning = Array.isArray(warnings) && warnings.some((w: any) => w.severity === "decline");

      let mappedStatus: VerificationStatus = "REJECTED";
      if (verdict === "approved" || (result?.decision === "APPROVED" && isSameFace && !spoofDetected && !hasDeclineWarning)) {
        mappedStatus = "VERIFIED";
      } else if (verdict === "review") {
        mappedStatus = "REVIEW_PENDING";
      } else {
        mappedStatus = "REJECTED";
      }

      return {
        validSignature: true,
        sessionId: clientRefId,
        status: mappedStatus,
        reasonCode: verdict || "WEBHOOK_EVENT",
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
