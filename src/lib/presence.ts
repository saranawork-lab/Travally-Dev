import { getDb } from "@/lib/mongo";

interface PresenceData {
  lastSeen: number; // Date.now() timestamp
  isOnline: boolean;
}

// Global in-memory presence store for 0ms sub-millisecond lookups
const globalMemoryPresence = new Map<string, PresenceData>();

/**
 * Update a user's active presence in-memory and in MongoDB
 */
export async function updateUserPresence(userId: string, isOnline: boolean = true) {
  if (!userId) return;
  const now = Date.now();
  globalMemoryPresence.set(userId, { lastSeen: now, isOnline });

  // Asynchronously update MongoDB user_presence without blocking the request loop
  try {
    const mongo = await getDb();
    mongo
      .collection("user_presence")
      .updateOne(
        { userId },
        {
          $set: {
            userId,
            lastSeenAt: new Date(now).toISOString(),
            isOnline,
            updatedAt: now,
          },
        },
        { upsert: true }
      )
      .catch(() => {});
  } catch {}
}

/**
 * Retrieve a user's presence state (isOnline + lastSeenAt)
 */
export async function getUserPresence(
  userId: string
): Promise<{ isOnline: boolean; lastSeenAt: string | null }> {
  if (!userId) return { isOnline: false, lastSeenAt: null };

  const now = Date.now();
  const mem = globalMemoryPresence.get(userId);

  // If in memory and recent (within 50 seconds heartbeat threshold)
  if (mem) {
    const isOnline = mem.isOnline && now - mem.lastSeen < 50000;
    return {
      isOnline,
      lastSeenAt: new Date(mem.lastSeen).toISOString(),
    };
  }

  // Fallback to MongoDB
  try {
    const mongo = await getDb();
    const doc = await mongo.collection("user_presence").findOne({ userId });
    if (doc?.lastSeenAt) {
      const lastSeenMs = new Date(doc.lastSeenAt).getTime();
      const isOnline = doc.isOnline !== false && now - lastSeenMs < 50000;
      globalMemoryPresence.set(userId, { lastSeen: lastSeenMs, isOnline });
      return {
        isOnline,
        lastSeenAt: doc.lastSeenAt,
      };
    }
  } catch {}

  return { isOnline: false, lastSeenAt: null };
}

/**
 * Format timestamp into clean, natural user-facing text
 * e.g., "Active now", "Last seen 4m ago", "Last seen today at 2:30 PM", "Last seen yesterday at 9:15 AM"
 */
export function formatLastSeen(lastSeenAt: string | Date | null | undefined): string {
  if (!lastSeenAt) return "Offline";

  const date = typeof lastSeenAt === "string" ? new Date(lastSeenAt) : lastSeenAt;
  const timeMs = date.getTime();
  if (isNaN(timeMs)) return "Offline";

  const nowMs = Date.now();
  const diffMs = Math.max(0, nowMs - timeMs);
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);

  // Format clock time: "2:30 PM"
  const timeStr = date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  if (diffSecs < 60) {
    return "Active just now";
  }

  if (diffMins < 60) {
    return `Last seen ${diffMins}m ago`;
  }

  const nowDate = new Date(nowMs);
  const isToday =
    nowDate.getDate() === date.getDate() &&
    nowDate.getMonth() === date.getMonth() &&
    nowDate.getFullYear() === date.getFullYear();

  if (isToday) {
    return `Last seen today at ${timeStr}`;
  }

  const yesterdayDate = new Date(nowMs - 86400000);
  const isYesterday =
    yesterdayDate.getDate() === date.getDate() &&
    yesterdayDate.getMonth() === date.getMonth() &&
    yesterdayDate.getFullYear() === date.getFullYear();

  if (isYesterday) {
    return `Last seen yesterday at ${timeStr}`;
  }

  // Older: "Last seen Nov 22 at 4:30 PM"
  const dateStr = date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
  return `Last seen ${dateStr} at ${timeStr}`;
}
