import { NextRequest, NextResponse } from "next/server";
import { SafetyService } from "@/server/safety/safetyService";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/safety-checkins
 * POST /api/cron/safety-checkins
 * Autonomous background cron endpoint to evaluate overdue safety check-in deadlines.
 * Protected by CRON_SECRET header or query parameter.
 */
async function handleCron(req: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET || "travally-safety-cron-dev-secret-2026";

    // Validate authorization header or query secret
    const authHeader = req.headers.get("authorization");
    const customHeader = req.headers.get("x-cron-secret");
    const { searchParams } = new URL(req.url);
    const querySecret = searchParams.get("secret");

    const providedSecret =
      (authHeader && authHeader.startsWith("Bearer ") ? authHeader.substring(7) : null) ||
      customHeader ||
      querySecret;

    if (!providedSecret || providedSecret !== cronSecret) {
      return NextResponse.json(
        { error: "Unauthorized. Valid CRON_SECRET is required to trigger safety check-in evaluation." },
        { status: 401 }
      );
    }

    const result = await SafetyService.evaluateAllActiveSessions();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (error: any) {
    console.error("Cron /api/cron/safety-checkins error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to execute safety check-in cron." },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return handleCron(req);
}

export async function POST(req: NextRequest) {
  return handleCron(req);
}

