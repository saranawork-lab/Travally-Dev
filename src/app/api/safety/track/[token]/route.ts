import { NextRequest, NextResponse } from "next/server";
import { SafetyService } from "@/server/safety/safetyService";

export const dynamic = "force-dynamic";

/**
 * GET /api/safety/track/[token]
 * Public, token-secured endpoint for designated emergency contacts to track live location and safety status.
 * Rate limited to 60 requests/min per IP.
 */
export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const { token } = params;
    if (!token || typeof token !== "string" || token.length < 16) {
      return NextResponse.json({ error: "Invalid safety tracking link." }, { status: 400 });
    }

    // 1. Persistent IP-based rate limiting
    const forwardedFor = req.headers.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : req.headers.get("x-real-ip") || "anonymous";
    const rateLimit = await SafetyService.checkRateLimit(`track_ip_${ip}`, 60, 60);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Too many tracking requests. Please slow down.",
          code: "RATE_LIMITED",
          retryAfter: 60,
        },
        {
          status: 429,
          headers: {
            "Retry-After": "60",
            "X-RateLimit-Limit": "60",
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }

    // 2. Fetch validated tracking data
    const data = await SafetyService.getPublicTrackingData(token);

    if (data.status === "INVALID_TOKEN") {
      return NextResponse.json({ error: data.error }, { status: 400 });
    }

    if (data.status === "NOT_FOUND") {
      return NextResponse.json({ error: data.error }, { status: 404 });
    }

    const response = NextResponse.json({
      success: true,
      tracking: data,
    });

    response.headers.set("X-RateLimit-Limit", "60");
    response.headers.set("X-RateLimit-Remaining", String(rateLimit.remaining));
    return response;
  } catch (error: any) {
    console.error("GET /api/safety/track/[token] error:", error);
    return NextResponse.json(
      { error: "Unable to load safety tracking data." },
      { status: 500 }
    );
  }
}
