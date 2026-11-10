import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { VerificationService } from "@/server/verification/verificationService";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const result = await VerificationService.resetVerification(user.id);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to reset verification" },
      { status: 400 }
    );
  }
}
