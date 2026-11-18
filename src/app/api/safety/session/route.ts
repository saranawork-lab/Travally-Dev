import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { requireVerifiedUser } from "@/lib/verificationGuard";
import { SafetyService, SafetySetupInput } from "@/server/safety/safetyService";

export const dynamic = "force-dynamic";

/**
 * GET /api/safety/session?targetType=ACTIVITY&targetId=xxx
 * Retrieves safety eligibility and active session for the authenticated, verified user.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required", code: "UNAUTHORIZED" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const targetType = searchParams.get("targetType") as "ACTIVITY" | "TRAVEL";
    const targetId = searchParams.get("targetId");

    if (!targetType || !targetId || !["ACTIVITY", "TRAVEL"].includes(targetType)) {
      return NextResponse.json(
        { error: "targetType (ACTIVITY | TRAVEL) and targetId are required." },
        { status: 400 }
      );
    }

    // Check eligibility and identity verification
    const eligibility = await SafetyService.checkEligibility(user.id, targetType, targetId);

    // Retrieve active session if eligible
    let session = null;
    if (eligibility.eligible) {
      session = await SafetyService.getSession(user.id, targetType, targetId);
    }

    return NextResponse.json({
      eligibility,
      session,
    });
  } catch (error: any) {
    console.error("GET /api/safety/session error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to retrieve safety session." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/safety/session
 * Configures or activates safety protection for an activity or travel plan.
 * Strictly requires verified identity.
 */
export async function POST(req: NextRequest) {
  try {
    const guard = await requireVerifiedUser();
    if (guard.errorResponse) {
      return guard.errorResponse;
    }
    const user = guard.user;

    const body: SafetySetupInput = await req.json();

    if (!body.targetType || !body.targetId || !["ACTIVITY", "TRAVEL"].includes(body.targetType)) {
      return NextResponse.json(
        { error: "Valid targetType and targetId are required." },
        { status: 400 }
      );
    }

    const session = await SafetyService.createOrUpdateSession(user.id, body);

    return NextResponse.json({
      success: true,
      session,
      message: "Safety protection activated successfully.",
    });
  } catch (error: any) {
    console.error("POST /api/safety/session error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to configure safety session." },
      { status: 400 }
    );
  }
}

