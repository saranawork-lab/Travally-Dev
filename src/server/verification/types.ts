export type VerificationStatus =
  | "UNVERIFIED"
  | "NOT_STARTED"
  | "ID_PENDING"
  | "ID_FAILED"
  | "SELFIE_PENDING"
  | "REVIEW_PENDING"
  | "VERIFIED"
  | "REJECTED";

export type DocumentType =
  | "PASSPORT"
  | "DRIVING_LICENSE"
  | "PAN_CARD"
  | "VOTER_ID"
  | "NATIONAL_ID";

export type MockScenario =
  | "success"
  | "id_failed"
  | "liveness_failed"
  | "face_mismatch"
  | "review_pending";

export interface VerificationSessionInitParams {
  userId: string;
  email: string;
  displayName?: string;
  scenario?: MockScenario;
}

export interface VerificationSession {
  sessionId: string;
  userId: string;
  provider: string;
  status: VerificationStatus;
  documentType?: DocumentType;
  idCheckPassed?: boolean;
  selfieCheckPassed?: boolean;
  faceMatchPassed?: boolean;
  reasonCode?: string;
  createdAt: string;
  updatedAt: string;
  verifiedAt?: string;
  expiresAt: string;
}

export interface DocumentVerificationParams {
  sessionId: string;
  userId: string;
  documentType: DocumentType;
  documentFile: {
    mimeType: string;
    sizeBytes: number;
    base64Data?: string;
    fileName?: string;
  };
  scenario?: MockScenario;
}

export interface DocumentVerificationResult {
  success: boolean;
  documentValid: boolean;
  errorCode?: string;
  errorMessage?: string;
  documentType: DocumentType;
  extractedPortraitAvailable?: boolean;
}

export interface SelfieVerificationParams {
  sessionId: string;
  userId: string;
  selfieFile: {
    mimeType: string;
    sizeBytes: number;
    base64Data?: string;
  };
  scenario?: MockScenario;
}

export interface SelfieVerificationResult {
  success: boolean;
  status: VerificationStatus;
  livenessPassed: boolean;
  faceMatchPassed: boolean;
  confidenceScore?: number;
  errorCode?: string;
  errorMessage?: string;
  warnings?: Array<{
    code: string;
    severity: string;
    description: string;
  }>;
  verdict?: string;
  details?: any;
}


export interface WebhookPayload {
  headers: Record<string, string>;
  rawBody: string;
}

export interface WebhookProcessingResult {
  validSignature: boolean;
  userId?: string;
  sessionId?: string;
  status: VerificationStatus;
  reasonCode?: string;
  errorMessage?: string;
}

export interface IIdentityVerificationProvider {
  readonly providerName: string;
  readonly isDevelopmentOnly: boolean;

  createSession(params: VerificationSessionInitParams): Promise<VerificationSession>;
  verifyDocument(params: DocumentVerificationParams): Promise<DocumentVerificationResult>;
  verifySelfieAndMatch(params: SelfieVerificationParams): Promise<SelfieVerificationResult>;
  processWebhook(payload: WebhookPayload): Promise<WebhookProcessingResult>;
}
