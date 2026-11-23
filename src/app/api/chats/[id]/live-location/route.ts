import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import db from "@/lib/db";
import { decryptChatMessage, encryptChatMessage } from "@/lib/crypto";

export const dynamic = "force-dynamic";

/**
 * Ephemeral memory store for fast sub-second live location tracking.
 * Maps `${conversationId}:${messageId}` -> LiveLocationEntry
 */
interface LiveLocationEntry {
  messageId: string;
  conversationId: string;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  heading?: number;
  liveUntil: string;
  isActive: boolean;
  note?: string;
  address?: string;
  updatedAt: number;
}

const liveLocationStore = new Map<string, LiveLocationEntry>();

/**
 * GET /api/chats/[id]/live-location
 * Returns active live locations in this conversation.
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: conversationId } = params;
    const now = Date.now();

    const activeList: LiveLocationEntry[] = [];
    liveLocationStore.forEach((entry) => {
      if (entry.conversationId === conversationId) {
        const isExpired = new Date(entry.liveUntil).getTime() <= now;
        if (!isExpired && entry.isActive) {
          activeList.push(entry);
        } else if (isExpired && entry.isActive) {
          entry.isActive = false;
        }
      }
    });

    return NextResponse.json({ liveLocations: activeList });
  } catch (error) {
    console.error("GET live-location error:", error);
    return NextResponse.json({ error: "Failed to fetch live locations" }, { status: 500 });
  }
}

/**
 * POST /api/chats/[id]/live-location
 * Broadcast/update live location coordinates from sender.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: conversationId } = params;
    const body = await req.json();
    const {
      messageId,
      latitude,
      longitude,
      accuracy,
      heading,
      liveUntil,
      note,
      address,
      isActive = true,
    } = body;

    if (!messageId || typeof latitude !== "number" || typeof longitude !== "number") {
      return NextResponse.json(
        { error: "messageId, latitude, and longitude are required" },
        { status: 400 }
      );
    }

    const storeKey = `${conversationId}:${messageId}`;
    const entry: LiveLocationEntry = {
      messageId,
      conversationId,
      userId: user.id,
      displayName: user.displayName || user.email?.split("@")[0] || "Traveler",
      avatarUrl: (user as any).avatarUrl || undefined,
      latitude,
      longitude,
      accuracy,
      heading,
      liveUntil: liveUntil || new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      isActive,
      note,
      address,
      updatedAt: Date.now(),
    };

    liveLocationStore.set(storeKey, entry);

    // Asynchronously update message in DB (throttled/non-blocking)
    (async () => {
      try {
        const msg = await db.message.findUnique({
          where: { id: messageId },
          select: { id: true, content: true },
        });

        if (msg) {
          let contentStr = msg.content;
          try {
            contentStr = await decryptChatMessage(contentStr, conversationId);
          } catch {}

          try {
            const parsed = JSON.parse(contentStr);
            if (parsed && parsed.mediaType === "LIVE_LOCATION") {
              parsed.mediaData = {
                ...parsed.mediaData,
                latitude,
                longitude,
                accuracy,
                heading,
                isActive,
                lastUpdatedAt: new Date().toISOString(),
              };

              let updatedRaw = JSON.stringify(parsed);
              try {
                updatedRaw = await encryptChatMessage(updatedRaw, conversationId);
              } catch {}

              await db.message.update({
                where: { id: messageId },
                data: { content: updatedRaw },
              });
            }
          } catch {}
        }
      } catch (err) {
        console.warn("Could not sync live location coordinates to message DB:", err);
      }
    })();

    return NextResponse.json({ success: true, entry });
  } catch (error) {
    console.error("POST live-location error:", error);
    return NextResponse.json({ error: "Failed to update live location" }, { status: 500 });
  }
}

/**
 * PATCH /api/chats/[id]/live-location
 * Stop sharing live location for a specific message session.
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: conversationId } = params;
    const body = await req.json();
    const { messageId } = body;

    if (!messageId) {
      return NextResponse.json({ error: "messageId is required" }, { status: 400 });
    }

    const storeKey = `${conversationId}:${messageId}`;
    const existing = liveLocationStore.get(storeKey);
    if (existing) {
      existing.isActive = false;
      liveLocationStore.set(storeKey, existing);
    }

    // Persist termination to message DB
    try {
      const msg = await db.message.findUnique({
        where: { id: messageId },
        select: { id: true, content: true },
      });

      if (msg) {
        let contentStr = msg.content;
        try {
          contentStr = await decryptChatMessage(contentStr, conversationId);
        } catch {}

        try {
          const parsed = JSON.parse(contentStr);
          if (parsed && parsed.mediaType === "LIVE_LOCATION") {
            parsed.mediaData = {
              ...parsed.mediaData,
              isActive: false,
              endedAt: new Date().toISOString(),
            };

            let updatedRaw = JSON.stringify(parsed);
            try {
              updatedRaw = await encryptChatMessage(updatedRaw, conversationId);
            } catch {}

            await db.message.update({
              where: { id: messageId },
              data: { content: updatedRaw },
            });
          }
        } catch {}
      }
    } catch (err) {
      console.warn("Could not persist live location stop to message DB:", err);
    }

    return NextResponse.json({ success: true, message: "Live location stopped" });
  } catch (error) {
    console.error("PATCH live-location error:", error);
    return NextResponse.json({ error: "Failed to stop live location" }, { status: 500 });
  }
}
