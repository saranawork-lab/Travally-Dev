import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { requireVerifiedUser } from "@/lib/verificationGuard";
import { SafetyService } from "@/server/safety/safetyService";

export const dynamic = "force-dynamic";

/**
 * POST /api/safety/checkin
 * Records a safety check-in ("I'm okay ✓").
 */
export async function POST(req: NextRequest) {
  try {
    const guard = await requireVerifiedUser();
    if (guard.errorResponse) {
      return guard.errorResponse;
    }
    const user = guard.user;

    const body = await req.json();
    const { sessionId, coordinates } = body;

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required." }, { status: 400 });
    }

    const updatedSession = await SafetyService.recordCheckIn(user.id, sessionId, coordinates);

    return NextResponse.json({
      success: true,
      message: "Safety confirmed. Next check-in scheduled.",
      session: updatedSession,
    });
  } catch (error: any) {
    console.error("POST /api/safety/checkin error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to confirm safety check-in." },
      { status: 400 }
    );
  }
}

