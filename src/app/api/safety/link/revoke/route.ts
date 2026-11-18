import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { requireVerifiedUser } from "@/lib/verificationGuard";
import { SafetyService } from "@/server/safety/safetyService";

export const dynamic = "force-dynamic";

/**
 * POST /api/safety/link/revoke
 * Explicitly revokes a public emergency tracking link.
 */
export async function POST(req: NextRequest) {
  try {
    const guard = await requireVerifiedUser();
    if (guard.errorResponse) {
      return guard.errorResponse;
    }
    const user = guard.user;

    const body = await req.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required." }, { status: 400 });
    }

    const updated = await SafetyService.revokeShareToken(user.id, sessionId);

    return NextResponse.json({
      success: true,
      message: "Safety tracking link revoked. Public tracking access disabled.",
      session: updated,
    });
  } catch (error: any) {
    console.error("POST /api/safety/link/revoke error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to revoke safety link." },
      { status: 400 }
    );
  }
}

