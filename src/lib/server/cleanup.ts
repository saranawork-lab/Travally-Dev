import db from "@/lib/db";

let lastCleanupTime = 0;
let isCleaningUp = false;
const CLEANUP_COOLDOWN_MS = 5 * 60 * 1000; // Run at most once every 5 minutes

/**
 * Cleanup function:
 * Deletes any JoinRequest whose activity or travelPlan has passed event time + 30 mins.
 * Throttled to prevent DB load.
 */
export async function cleanupExpiredRequests() {
  const nowMs = Date.now();
  if (isCleaningUp || nowMs - lastCleanupTime < CLEANUP_COOLDOWN_MS) {
    return;
  }
  isCleaningUp = true;
  lastCleanupTime = nowMs;

  try {
    const now = new Date();
    // Only inspect past events (date <= now)
    const [activities, travelPlans] = await Promise.all([
      db.activity.findMany({
        where: { date: { lte: now } },
        select: { id: true, date: true, startTime: true },
        take: 100,
      }),
      db.travelPlan.findMany({
        where: { startDate: { lte: now } },
        select: { id: true, startDate: true },
        take: 100,
      }),
    ]);

    const expiredActivityIds: string[] = [];
    for (const act of activities) {
      try {
        const actDate = new Date(act.date);
        if (act.startTime) {
          const [h, m] = act.startTime.split(":").map(Number);
          actDate.setHours(h || 0, m || 0, 0, 0);
        }
        const cutoff = new Date(actDate.getTime() + 30 * 60 * 1000);
        if (now >= cutoff) {
          expiredActivityIds.push(act.id);
        }
      } catch (_) {}
    }

    const expiredTravelPlanIds: string[] = [];
    for (const trip of travelPlans) {
      try {
        const tripDate = new Date(trip.startDate);
        const cutoff = new Date(tripDate.getTime() + 30 * 60 * 1000);
        if (now >= cutoff) {
          expiredTravelPlanIds.push(trip.id);
        }
      } catch (_) {}
    }

    // 3. Delete matching requests from DB
    if (expiredActivityIds.length > 0 || expiredTravelPlanIds.length > 0) {
      await db.joinRequest.deleteMany({
        where: {
          OR: [
            expiredActivityIds.length > 0 ? { activityId: { in: expiredActivityIds } } : {},
            expiredTravelPlanIds.length > 0 ? { travelPlanId: { in: expiredTravelPlanIds } } : {},
          ],
        },
      });
    }
  } catch (err) {
    console.error("cleanupExpiredRequests error:", err);
  } finally {
    isCleaningUp = false;
  }
}
