import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { requireVerifiedUser } from "@/lib/verificationGuard";
import { SafetyService } from "@/server/safety/safetyService";

export const dynamic = "force-dynamic";

/**
 * POST /api/safety/link/regenerate
 * Generates a fresh, unguessable emergency tracking link, revoking the previous one.
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

    const updated = await SafetyService.regenerateShareToken(user.id, sessionId);

    return NextResponse.json({
      success: true,
      message: "New safety tracking link generated. Previous link has been revoked.",
      shareToken: updated.shareToken,
      shareExpiresAt: updated.shareExpiresAt,
      session: updated,
    });
  } catch (error: any) {
    console.error("POST /api/safety/link/regenerate error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to regenerate safety link." },
      { status: 400 }
    );
  }
}

