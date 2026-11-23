import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { updateUserPresence, getUserPresence } from "@/lib/presence";

export const dynamic = "force-dynamic";

// POST /api/presence — Heartbeat ping when user has the app open
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const isOnline = body?.isOnline !== false;

    await updateUserPresence(user.id, isOnline);
    return NextResponse.json({ ok: true, isOnline });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

// GET /api/presence?userId=xxx — Check a user's presence state
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const presence = await getUserPresence(userId);
    const res = NextResponse.json(presence);
    res.headers.set("Cache-Control", "private, no-cache, no-store, must-revalidate");
    return res;
  } catch {
    return NextResponse.json({ isOnline: false, lastSeenAt: null });
  }
}
