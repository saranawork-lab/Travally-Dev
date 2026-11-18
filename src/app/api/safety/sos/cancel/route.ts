import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { requireVerifiedUser } from "@/lib/verificationGuard";
import { SafetyService } from "@/server/safety/safetyService";

export const dynamic = "force-dynamic";

/**
 * POST /api/safety/sos/cancel
 * Cancels active SOS emergency ("I'm Safe - Cancel SOS").
 */
export async function POST(req: NextRequest) {
  try {
    const guard = await requireVerifiedUser();
    if (guard.errorResponse) {
      return guard.errorResponse;
    }
    const user = guard.user;

    const body = await req.json();
    const { sessionId, reason } = body;

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required." }, { status: 400 });
    }

    const result = await SafetyService.cancelSOS(user.id, sessionId, reason);

    return NextResponse.json({
      success: true,
      sosStatus: result.session.sosStatus,
      session: result.session,
      incident: result.incident,
      dispatched: result.dispatched,
      message: "Emergency SOS cancelled. Emergency contact notified that you are safe.",
    });
  } catch (error: any) {
    console.error("POST /api/safety/sos/cancel error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to cancel SOS emergency." },
      { status: 400 }
    );
  }
}

