import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { SafetyService } from "@/server/safety/safetyService";

export const dynamic = "force-dynamic";

/**
 * GET /api/safety/users?q=Priya
 * Searches verified Travally users to select as an in-app emergency contact.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";

    if (query.trim().length < 2) {
      return NextResponse.json({ users: [] });
    }

    const users = await SafetyService.searchTravallyUsers(query, user.id);

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error("GET /api/safety/users error:", error);
    return NextResponse.json({ error: "Failed to search users." }, { status: 500 });
  }
}

