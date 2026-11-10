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

    const body = await req.json().catch(() => ({}));
    const scenario = body.scenario || req.headers.get("x-mock-scenario") || undefined;
    const providerOverride = body.providerOverride || req.headers.get("x-verification-provider") || undefined;

    const result = await VerificationService.startSession({
      userId: user.id,
      email: user.email,
      displayName: user.displayName,
      scenario,
      providerOverride,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error("POST /api/verification/session error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to initiate verification session" },
      { status: 500 }
    );
  }
}
