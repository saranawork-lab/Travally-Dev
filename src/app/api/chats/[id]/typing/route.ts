import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { updateUserPresence, getUserPresence } from "@/lib/presence";

export const dynamic = "force-dynamic";

/**
 * In-memory typing status store with automatic TTL expiry.
 * Each conversation maps to a set of { userId, displayName, avatarUrl, expiresAt }.
 * Entries auto-expire after 4 seconds (if no fresh heartbeat arrives).
 *
 * This is intentionally ephemeral (in-memory) — typing status is transient
 * and does not need database persistence.
 */
interface TypingEntry {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  expiresAt: number; // Date.now() + TTL
}

const TYPING_TTL_MS = 4000; // 4 seconds

// Global in-memory store: conversationId -> TypingEntry[]
const typingStore = new Map<string, TypingEntry[]>();

/** Remove expired entries for a conversation */
function pruneExpired(conversationId: string): TypingEntry[] {
  const now = Date.now();
  const entries = typingStore.get(conversationId) || [];
  const active = entries.filter((e) => e.expiresAt > now);
  if (active.length === 0) {
    typingStore.delete(conversationId);
  } else {
    typingStore.set(conversationId, active);
  }
  return active;
}

/**
 * POST /api/chats/[id]/typing
 * Signal that the current user is typing (or stopped typing).
 * Body: { isTyping: boolean }
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: conversationId } = params;
    const body = await req.json().catch(() => ({}));
    const isTyping = body?.isTyping !== false; // default true

    // Prune expired entries first
    const entries = pruneExpired(conversationId);

    if (isTyping) {
      // Upsert: refresh or add this user's typing entry
      const existingIdx = entries.findIndex((e) => e.userId === user.id);
      const entry: TypingEntry = {
        userId: user.id,
        displayName: user.displayName || user.email?.split("@")[0] || "Traveler",
        avatarUrl: (user as any).avatarUrl || undefined,
        expiresAt: Date.now() + TYPING_TTL_MS,
      };

      if (existingIdx >= 0) {
        entries[existingIdx] = entry;
      } else {
        entries.push(entry);
      }
      typingStore.set(conversationId, entries);
    } else {
      // Remove this user's typing entry
      const filtered = entries.filter((e) => e.userId !== user.id);
      if (filtered.length === 0) {
        typingStore.delete(conversationId);
      } else {
        typingStore.set(conversationId, filtered);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST typing error:", error);
    return NextResponse.json({ error: "Failed to update typing status" }, { status: 500 });
  }
}

/**
 * GET /api/chats/[id]/typing
 * Returns list of users currently typing in this conversation (excluding the requester).
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: conversationId } = params;

    // Refresh requesting user's active presence in the app
    updateUserPresence(user.id, true).catch(() => {});

    // Prune and get active entries, excluding the requesting user
    const active = pruneExpired(conversationId);
    const others = active.filter((e) => e.userId !== user.id);

    // Optional: live presence check for companion in direct chats
    const otherUserId = req.nextUrl.searchParams.get("otherUserId");
    let companionPresence = null;
    if (otherUserId) {
      companionPresence = await getUserPresence(otherUserId);
    }

    const response = NextResponse.json({
      typingUsers: others.map((e) => ({
        userId: e.userId,
        displayName: e.displayName,
        avatarUrl: e.avatarUrl,
      })),
      companionPresence,
    });
    response.headers.set("Cache-Control", "private, no-cache, no-store, must-revalidate");
    return response;
  } catch (error) {
    console.error("GET typing error:", error);
    return NextResponse.json({ error: "Failed to get typing status" }, { status: 500 });
  }
}
