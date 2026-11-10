import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { VerificationService } from "@/server/verification/verificationService";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const status = await VerificationService.getVerificationStatus(user.id);
    return NextResponse.json({ success: true, ...status });
  } catch (error: any) {
    console.error("GET /api/verification/status error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch verification status" },
      { status: 500 }
    );
  }
}
