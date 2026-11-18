import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { requireVerifiedUser } from "@/lib/verificationGuard";
import { SafetyService } from "@/server/safety/safetyService";

export const dynamic = "force-dynamic";

/**
 * POST /api/safety/close
 * Closes safety session when activity is completed or cancelled.
 */
export async function POST(req: NextRequest) {
  try {
    const guard = await requireVerifiedUser();
    if (guard.errorResponse) {
      return guard.errorResponse;
    }
    const user = guard.user;

    const body = await req.json();
    const { sessionId, status } = body;

    if (!sessionId || !["COMPLETED", "CANCELLED"].includes(status)) {
      return NextResponse.json(
        { error: "sessionId and status (COMPLETED | CANCELLED) are required." },
        { status: 400 }
      );
    }

    const updated = await SafetyService.closeSession(user.id, sessionId, status);

    return NextResponse.json({
      success: true,
      session: updated,
      message: `Safety session marked as ${status.toLowerCase()}. Location sharing and check-ins stopped.`,
    });
  } catch (error: any) {
    console.error("POST /api/safety/close error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to close safety session." },
      { status: 400 }
    );
  }
}

