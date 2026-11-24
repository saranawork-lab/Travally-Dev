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

    // Fallback: check User collection for last activity / updatedAt
    const { ObjectId } = await import("mongodb");
    let userDoc: any = null;
    try {
      userDoc = await mongo.collection("User").findOne(
        { _id: new ObjectId(userId) },
        { projection: { updatedAt: 1, createdAt: 1 } }
      );
    } catch {
      userDoc = await mongo.collection("User").findOne(
        { id: userId },
        { projection: { updatedAt: 1, createdAt: 1 } }
      );
    }
    if (userDoc?.updatedAt || userDoc?.createdAt) {
      const fallbackDate = new Date(userDoc.updatedAt || userDoc.createdAt).toISOString();
      return { isOnline: false, lastSeenAt: fallbackDate };
    }
  } catch {}

  return { isOnline: false, lastSeenAt: null };
}

export { formatLastSeen } from "@/lib/utils";
