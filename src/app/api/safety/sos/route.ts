import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { requireVerifiedUser } from "@/lib/verificationGuard";
import { SafetyService } from "@/server/safety/safetyService";

export const dynamic = "force-dynamic";

/**
 * POST /api/safety/sos
 * Triggers SOS Emergency activation.
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

    const result = await SafetyService.triggerSOS(user.id, sessionId, coordinates);

    return NextResponse.json({
      success: true,
      sosStatus: result.session.sosStatus,
      session: result.session,
      incident: result.incident,
      dispatched: result.dispatched,
      emergencyNumber: "112",
      message: "Emergency SOS activated. Emergency contact and safety desk notified.",
    });
  } catch (error: any) {
    console.error("POST /api/safety/sos error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to trigger SOS emergency." },
      { status: 400 }
    );
  }
}

