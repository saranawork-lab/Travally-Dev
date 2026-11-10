import { NextResponse } from "next/server";
import { getCurrentUser, SessionUser } from "@/lib/auth";
import { VerificationService } from "@/server/verification/verificationService";

export type VerificationGuardResult =
  | { user: SessionUser; errorResponse: null }
  | { user: null; errorResponse: NextResponse };

/**
 * Server-side authorization guard for protected creation endpoints.
 * Authoritatively inspects user verification status via VerificationService,
 * strictly enforcing active mode isolation (rejecting test verifications in live mode).
 * Returns 401 if unauthenticated, 403 IDENTITY_VERIFICATION_REQUIRED if unverified.
 */
export async function requireVerifiedUser(): Promise<VerificationGuardResult> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        {
          error: "Authentication required to perform this action.",
          code: "UNAUTHORIZED",
        },
        { status: 401 }
      ),
    };
  }

  // Authoritative check via VerificationService (enforces test vs live mode isolation)
  const status = await VerificationService.getVerificationStatus(user.id);

  if (!status.isVerified) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        {
          error:
            status.reasonCode === "TEST_VERIFICATION_INVALID_IN_LIVE_MODE"
              ? "Your identity was verified under Test Mode. Live verification is required before accessing production features."
              : "One-time identity verification (Government ID + Live Selfie) is required before creating protected content.",
          code: "IDENTITY_VERIFICATION_REQUIRED",
          verificationStatus: status.verificationStatus || "UNVERIFIED",
          reasonCode: status.reasonCode || undefined,
          mode: status.mode,
        },
        { status: 403 }
      ),
    };
  }

  return {
    user,
    errorResponse: null,
  };
}
