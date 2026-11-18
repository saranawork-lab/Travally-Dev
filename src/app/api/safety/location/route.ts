import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { requireVerifiedUser } from "@/lib/verificationGuard";
import { SafetyService } from "@/server/safety/safetyService";

export const dynamic = "force-dynamic";

/**
 * POST /api/safety/location
 * Updates live coordinates or toggles location sharing.
 */
export async function POST(req: NextRequest) {
  try {
    const guard = await requireVerifiedUser();
    if (guard.errorResponse) {
      return guard.errorResponse;
    }
    const user = guard.user;

    const body = await req.json();
    const { sessionId, action, location, enabled } = body;

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required." }, { status: 400 });
    }

    if (action === "TOGGLE") {
      const updated = await SafetyService.setLocationSharing(user.id, sessionId, Boolean(enabled));
      return NextResponse.json({
        success: true,
        locationSharingEnabled: updated.locationSharingEnabled,
      });
    }

    if (!location || typeof location.latitude !== "number" || typeof location.longitude !== "number") {
      return NextResponse.json({ error: "Valid latitude and longitude are required." }, { status: 400 });
    }

    const updated = await SafetyService.updateLocation(user.id, sessionId, {
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy,
      address: location.address,
    });

    return NextResponse.json({
      success: true,
      lastLocationTimestamp: updated.lastLocationTimestamp,
      lastLatitude: updated.lastLatitude,
      lastLongitude: updated.lastLongitude,
    });
  } catch (error: any) {
    console.error("POST /api/safety/location error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update location." },
      { status: 400 }
    );
  }
}

