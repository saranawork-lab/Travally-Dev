import db from "@/lib/db";

const CHAT_RETENTION_DAYS = 7;
const SEVEN_DAYS_MS = CHAT_RETENTION_DAYS * 24 * 60 * 60 * 1000;

export interface ChatRetentionInfo {
  isEventCompleted: boolean;
  completionDate: Date | null;
  expiryDate: Date | null;
  daysRemaining: number | null;
  isExpired: boolean;
  statusLabel: string;
}

/**
 * Calculates the completion date and 7-day auto-deletion expiry for an activity or travel plan.
 */
export function getChatRetentionInfo(conversation: {
  activity?: {
    date?: Date | string;
    approxDurationHours?: number;
    status?: string;
    updatedAt?: Date | string;
  } | null;
  travelPlan?: {
    endDate?: Date | string;
    status?: string;
    updatedAt?: Date | string;
  } | null;
}): ChatRetentionInfo {
  const now = new Date();
  let completionDate: Date | null = null;

  if (conversation.activity) {
    const act = conversation.activity;
    const baseDate = act.date ? new Date(act.date) : null;
    if (baseDate) {
      const durationHours = act.approxDurationHours || 2.0;
      completionDate = new Date(baseDate.getTime() + durationHours * 60 * 60 * 1000);
    }
    if (act.status === "COMPLETED" && act.updatedAt) {
      const compDate = new Date(act.updatedAt);
      if (!completionDate || compDate > completionDate) {
        completionDate = compDate;
      }
    }
  } else if (conversation.travelPlan) {
    const tp = conversation.travelPlan;
    if (tp.endDate) {
      completionDate = new Date(tp.endDate);
    }
    if (tp.status === "COMPLETED" && tp.updatedAt) {
      const compDate = new Date(tp.updatedAt);
      if (!completionDate || compDate > completionDate) {
        completionDate = compDate;
      }
    }
  }

  if (!completionDate) {
    return {
      isEventCompleted: false,
      completionDate: null,
      expiryDate: null,
      daysRemaining: null,
      isExpired: false,
      statusLabel: `Chats auto-delete ${CHAT_RETENTION_DAYS} days after event completion`,
    };
  }

  const isEventCompleted = now.getTime() >= completionDate.getTime();
  const expiryDate = new Date(completionDate.getTime() + SEVEN_DAYS_MS);
  const msUntilExpiry = expiryDate.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(msUntilExpiry / (1000 * 60 * 60 * 24)));
  const isExpired = now.getTime() >= expiryDate.getTime();

  let statusLabel = "";
  if (isExpired) {
    statusLabel = "Chat expired • Auto-deleted";
  } else if (isEventCompleted) {
    statusLabel = `Event completed • Auto-deletes in ${daysRemaining} day${daysRemaining === 1 ? "" : "s"}`;
  } else {
    statusLabel = `7-day validity after event completion • Auto-deletes on ${expiryDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  }

  return {
    isEventCompleted,
    completionDate,
    expiryDate,
    daysRemaining,
    isExpired,
    statusLabel,
  };
}

/**
 * Automatically cleans up conversations whose 7-day retention period has passed.
 * Deletes conversations from the database (messages cascade delete automatically).
 */
export async function cleanupExpiredConversations(): Promise<number> {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - SEVEN_DAYS_MS);

    // 1. Find conversations linked to activities that ended more than 7 days ago
    const expiredActivities = await db.activity.findMany({
      where: {
        OR: [
          { date: { lt: sevenDaysAgo } },
          { status: "COMPLETED", updatedAt: { lt: sevenDaysAgo } },
        ],
      },
      select: { id: true },
    });
    const expiredActivityIds = expiredActivities.map((a) => a.id);

    // 2. Find conversations linked to travel plans that ended more than 7 days ago
    const expiredTrips = await db.travelPlan.findMany({
      where: {
        OR: [
          { endDate: { lt: sevenDaysAgo } },
          { status: "COMPLETED", updatedAt: { lt: sevenDaysAgo } },
        ],
      },
      select: { id: true },
    });
    const expiredTripIds = expiredTrips.map((t) => t.id);

    if (expiredActivityIds.length === 0 && expiredTripIds.length === 0) {
      return 0;
    }

    // 3. Find matching conversation IDs
    const expiredConversations = await db.conversation.findMany({
      where: {
        OR: [
          { activityId: { in: expiredActivityIds } },
          { travelPlanId: { in: expiredTripIds } },
        ],
      },
      select: { id: true },
    });

    if (expiredConversations.length === 0) {
      return 0;
    }

    const idsToDelete = expiredConversations.map((c) => c.id);

    // 4. Delete the conversations (Prisma cascade deletes associated messages)
    const result = await db.conversation.deleteMany({
      where: {
        id: { in: idsToDelete },
      },
    });

    return result.count;
  } catch (error) {
    console.error("Error running cleanupExpiredConversations:", error);
    return 0;
  }
}
