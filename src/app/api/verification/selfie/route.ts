import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { VerificationService } from "@/server/verification/verificationService";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { sessionId, selfieFile, scenario: bodyScenario, providerOverride: bodyProvider } = body;

    const scenario = bodyScenario || req.headers.get("x-mock-scenario") || undefined;
    const providerOverride = bodyProvider || req.headers.get("x-verification-provider") || undefined;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Verification session ID is required" },
        { status: 400 }
      );
    }

    if (!selfieFile || !selfieFile.mimeType || !selfieFile.sizeBytes) {
      return NextResponse.json(
        { error: "Live selfie camera image is required" },
        { status: 400 }
      );
    }

    const result = await VerificationService.submitSelfie({
      userId: user.id,
      sessionId,
      selfieFile,
      scenario,
      providerOverride,
    });

    if (!result.success && result.status !== "REVIEW_PENDING") {
      return NextResponse.json(
        {
          success: false,
          status: result.status,
          error: result.errorMessage || "Live selfie verification failed",
          errorCode: result.errorCode || "SELFIE_FAILED",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      status: result.status,
      confidenceScore: result.confidenceScore,
      livenessPassed: result.livenessPassed,
      faceMatchPassed: result.faceMatchPassed,
      warnings: result.warnings,
      verdict: result.verdict,
      details: result.details,
      message:
        result.status === "VERIFIED"
          ? "Identity successfully verified! All creation categories are unlocked."
          : "Verification pending manual review.",
    });
  } catch (error: any) {
    console.error("POST /api/verification/selfie error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process live selfie verification" },
      { status: 500 }
    );
  }
}
