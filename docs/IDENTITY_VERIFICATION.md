# Travally — Identity Verification Architecture & Provider Integration Guide

## 1. Overview & Category Gating Rules

Travally enforces an **account-level, one-time identity verification** system combining government photo ID authenticity checks and live camera 3D selfie liveness & facial biometric matching.

### Category Protection Matrix

| Creation Category | Subcategories | Verification Required? | Server-Enforced Route |
| :--- | :--- | :--- | :--- |
| **Post** | Community Moment / Photo | ❌ **EXEMPT** | `POST /api/home/instants` (Unrestricted) |
| **Activity & Travel** | Companion Activity, Travel Trip | ✅ **PROTECTED** | `POST /api/activities`, `POST /api/travel` (403 `IDENTITY_VERIFICATION_REQUIRED`) |
| **Nature & Humanity** | Grow Cause / Eco Initiative | ✅ **PROTECTED** | `POST /api/home/grow` (403 `IDENTITY_VERIFICATION_REQUIRED`) |
| **Treasure & Clue** | Treasure Quest, Find Me Clue | ✅ **PROTECTED** | `POST /api/home/treasure`, `POST /api/home/find-me` (403 `IDENTITY_VERIFICATION_REQUIRED`) |

### Key Guarantees
1. **One-Time Account Gating**: Verifying identity once permanently unlocks all 3 protected categories (`Activity & Travel`, `Nature & Humanity`, and `Treasure & Clue`) and all 5 subcategories (`Companion Activity`, `Travel Trip`, `Grow Cause`, `Treasure Quest`, `Find Me Clue`).
2. **Never Repeated**: Users are not asked to verify again when switching between categories, refreshing, or starting a new session.
3. **Server-Side Enforcement**: Even if a malicious client attempts a direct POST to any protected backend creation endpoint, the server boundary rejects it with `403 Forbidden` (`code: IDENTITY_VERIFICATION_REQUIRED`).
4. **Data Minimization & Privacy**: Raw ID document images and raw live selfie biometrics are not permanently retained in the database.

---

## 2. Clean Provider-Adapter Architecture

The system is decoupled from specific vendor implementations through the `IIdentityVerificationProvider` interface located at `src/server/verification/types.ts`:

```typescript
export interface IIdentityVerificationProvider {
  readonly providerName: string;
  readonly isDevelopmentOnly: boolean;

  createSession(params: VerificationSessionInitParams): Promise<VerificationSession>;
  verifyDocument(params: DocumentVerificationParams): Promise<DocumentVerificationResult>;
  verifySelfieAndMatch(params: SelfieVerificationParams): Promise<SelfieVerificationResult>;
  processWebhook(payload: WebhookPayload): Promise<WebhookProcessingResult>;
}
```

## 2. Clean Provider-Adapter Architecture

The system is decoupled from specific vendor implementations through the `IIdentityVerificationProvider` interface located at `src/server/verification/types.ts`:

```typescript
export interface IIdentityVerificationProvider {
  readonly providerName: string;
  readonly isDevelopmentOnly: boolean;

  createSession(params: VerificationSessionInitParams): Promise<VerificationSession>;
  verifyDocument(params: DocumentVerificationParams): Promise<DocumentVerificationResult>;
  verifySelfieAndMatch(params: SelfieVerificationParams): Promise<SelfieVerificationResult>;
  processWebhook(payload: WebhookPayload): Promise<WebhookProcessingResult>;
}
```

### Factory Resolver (`src/server/verification/index.ts`)
- Resolves to `NeetixVerificationProvider` by default (`IDENTITY_VERIFICATION_PROVIDER=neetix`).
- Enforces strict fail-closed security and test key validation (`lv_test_...`).
- Raw ID document images and raw selfie biometrics are purged after verification for data minimization.

---

## 3. Active Provider: Neetix Liveliness (Automatic Test & Live Mode Support)

Travally integrates **Neetix Liveliness** (`https://liveliness.neetix.in`) supporting both the free unmetered test environment and the metered live production environment.

### Automatic Key Detection & Single-Variable Switching
Switching between **Test Mode** and **Live Mode** requires modifying **only `NEETIX_API_KEY` in `.env`** and restarting the backend. No code modifications, manual provider changes, or extra flags (such as `IDENTITY_VERIFICATION_MODE`) are required.

- **Test Key Format**: Begins with `lv_test_` (regex: `/^lv_test_[a-zA-Z0-9_-]{8,}$/`). Unmetered test sandbox, isolated client ID.
- **Live Key Format**: Begins with `lv_` followed by alphanumeric key body, excluding `lv_test_` (regex: `/^lv_(?!test_)[a-zA-Z0-9_-]{8,}$/`). Metered production balance, executes full passive liveness model.
- **Fail-Closed Security**: Missing, empty, or keys with unrecognized prefixes are rejected safely and fail-closed.
- **Dynamic Invalidation**: `getVerificationProvider()` detects whenever `NEETIX_API_KEY` changes and reinitializes the provider instance automatically.

### Mode Isolation & Security Guarantees
1. **Mode-Isolated Verification**: Verifications performed in Test Mode are tagged with `mode: "test"` in the audit record. When the backend runs in Live Mode, any account verified under Test Mode is strictly considered `UNVERIFIED` (`reasonCode: "TEST_VERIFICATION_INVALID_IN_LIVE_MODE"`).
2. **Server-Side Enforcement**: `requireVerifiedUser()` calls `VerificationService.getVerificationStatus()`, automatically returning `403 Forbidden` for test-verified accounts when the server is in live mode.
3. **Strict Live Liveness Decisioning**:
   - In **Live Mode**: Genuine liveness is strictly required (`liveness_status === "genuine"`, `spoof_detected === false`). If the engine reports `LIVENESS_UNAVAILABLE` or missing liveness, the result is NOT approved and is routed to `REVIEW_PENDING`.
   - In **Test Mode**: The provider accommodates the sandbox cluster's expected `LIVENESS_UNAVAILABLE` warning while validating 1:1 facial biometric match, spoof status, and image clarity.
4. **No Fallback**: Live API failures, insufficient credit balances, or network issues NEVER fall back to test mode.

### Application Status Mapping
1. **`VERIFIED`**:
   - `decision === "APPROVED"`
   - `is_same_face === true`
   - `same_face_confidence >= 70`
   - `spoof_detected === false`
   - In **Live Mode**: `liveness_status === "genuine"` and no review/decline warnings
   - In **Test Mode**: `verdict === "approved"` or expected sandbox warning `LIVENESS_UNAVAILABLE`
2. **`REVIEW_PENDING`**:
   - `verdict === "review"` or review-severity warnings (e.g. `LOW_FACE_QUALITY`, `MULTIPLE_FACES`)
   - In **Live Mode**: Any response where liveness status is unconfirmed (`LIVENESS_UNAVAILABLE`)
3. **`REJECTED` / `ID_FAILED`**:
   - `verdict === "declined"` OR `is_same_face === false` OR `decision === "REJECTED"`
   - `spoof_detected === true` OR `liveness_status === "spoof"`
   - HTTP 422: No face detected in ID card or selfie

---

## 4. Important Verification Limitations & Authenticity Distinction

Travally explicitly distinguishes between verification levels:

| Verification Stage | What Is Genuinely Checked | What Limitations Apply |
| :--- | :--- | :--- |
| **1. ID Format / Field Validation** | File integrity, dimensions, image clarity (blur, glare, sharpness). | Neetix validates format and checksums. **Does NOT represent authoritative verification that a government ID is genuine.** |
| **2. Selfie Liveness** | Passive anti-spoofing and spectral forensics. | In Neetix test-key mode, test servers return `LIVENESS_UNAVAILABLE` as the heavy anti-spoof model is simulated in sandbox. In live mode, genuine liveness is required. |
| **3. Face Matching** | Genuine 1:1 facial cross-match between live camera selfie and ID card portrait with confidence score. | Matching confirms the selfie matches the portrait on the card; it does not confirm the card owner's identity with the government. |
| **4. Authoritative Verification** | Direct UIDAI/NSDL/DigiLocker/Vahan government API check. | **NOT implemented/available** in this tier. Travally does not claim authoritative government ID authenticity. |

---

## 5. Security & Cryptographic Verifications

1. **Detached Ed25519 Response Signatures**:
   - Neetix signs face match responses using Ed25519 when enabled.
   - Detached signature in `X-Neetix-Signature`.
   - Provider queries `GET /v1/verification-key` and verifies payload integrity.
2. **Signed Webhooks**:
   - Delivered with `X-Signature-V2: sha256=<hex>`
   - Verified using constant-time HMAC-SHA256 comparison against `NEETIX_WEBHOOK_SECRET`.
3. **Data Minimization & Privacy**:
   - Raw ID card images and live camera selfies are purged from temporary session storage upon verification completion.
   - Audit trail stores hashes, confidence scores, mode (`test` or `live`), and verdicts in MongoDB.

---

## 6. Environment Variables Configuration

Add the following to `.env`:

```ini
# Provider Selection
IDENTITY_VERIFICATION_PROVIDER="neetix"

# Neetix Liveliness Key (Automatic Mode Switching)
# For Test Mode:
NEETIX_API_KEY="lv_test_your_test_key_here"

# For Live Mode:
# NEETIX_API_KEY="lv_your_live_key_here"

NEETIX_BASE_URL="https://liveliness.neetix.in"

# Webhook HMAC Secret (Optional)
NEETIX_WEBHOOK_SECRET="your-webhook-secret"
```

