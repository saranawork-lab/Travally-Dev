import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/mongo";

export const dynamic = "force-dynamic";

interface CachedBadge {
  data: { unreadChatsCount: number; pendingRequestsCount: number; totalUnreadMessages: number };
  expiresAt: number;
}

const badgeCache = new Map<string, CachedBadge>();

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ unreadChatsCount: 0, pendingRequestsCount: 0, totalUnreadMessages: 0 });
    }

    const { searchParams } = new URL(req.url);
    const viewedAtStr = searchParams.get("viewedAt") || "";
    const cacheKey = `${user.id}_${viewedAtStr}`;

    const cached = badgeCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return NextResponse.json(cached.data);
    }

    // Count unread messages in conversations where user is participant or organizer, plus direct chats
    const [participations, organizedActivities, organizedTrips, mongoDirectDocs] = await Promise.all([
      db.participant.findMany({
        where: { userId: user.id },
        select: { activityId: true, travelPlanId: true },
      }),
      db.activity.findMany({
        where: { organizerId: user.id },
        select: { id: true },
      }),
      db.travelPlan.findMany({
        where: { organizerId: user.id },
        select: { id: true },
      }),
      (async () => {
        try {
          const mongo = await getDb();
          return await mongo
            .collection("Conversation")
            .find({ type: "DIRECT", participantIds: user.id }, { projection: { _id: 1 } })
            .toArray();
        } catch {
          return [];
        }
      })(),
    ]);

    const participantActivityIds = participations.map((p) => p.activityId).filter(Boolean) as string[];
    const participantTravelIds = participations.map((p) => p.travelPlanId).filter(Boolean) as string[];

    const allActivityIds = Array.from(new Set([...participantActivityIds, ...organizedActivities.map((a) => a.id)]));
    const allTravelPlanIds = Array.from(new Set([...participantTravelIds, ...organizedTrips.map((t) => t.id)]));
    const directConvIds = mongoDirectDocs.map((d: any) => d._id.toString());

    let unreadChatsCount = 0;
    let totalUnreadMessages = 0;

    const orFilters = [];
    if (allActivityIds.length > 0) orFilters.push({ activityId: { in: allActivityIds } });
    if (allTravelPlanIds.length > 0) orFilters.push({ travelPlanId: { in: allTravelPlanIds } });
    if (directConvIds.length > 0) orFilters.push({ id: { in: directConvIds } });

    if (orFilters.length > 0) {
      const conversations = await db.conversation.findMany({
        where: {
          OR: orFilters,
        },
        select: {
          id: true,
          messages: {
            where: {
              senderId: { not: user.id },
            },
            select: {
              id: true,
              readBy: true,
            },
          },
        },
      });

      for (const conv of conversations) {
        let convHasUnread = false;
        for (const msg of conv.messages) {
          try {
            const readList: string[] = JSON.parse(msg.readBy || "[]");
            if (!readList.includes(user.id)) {
              totalUnreadMessages++;
              convHasUnread = true;
            }
          } catch (_) {
            totalUnreadMessages++;
            convHasUnread = true;
          }
        }
        if (convHasUnread) {
          unreadChatsCount++;
        }
      }
    }

    // 3. Count pending requests received by current user (as host/organizer)
    const viewedAt = viewedAtStr ? new Date(viewedAtStr) : null;

    const pendingRequestsCount = await db.joinRequest.count({
      where: {
        status: "PENDING",
        OR: [
          { activity: { organizerId: user.id } },
          { travelPlan: { organizerId: user.id } },
        ],
        ...(viewedAt && !isNaN(viewedAt.getTime())
          ? {
              createdAt: { gt: viewedAt },
            }
          : {}),
      },
    });

    const badgeData = {
      unreadChatsCount,
      totalUnreadMessages,
      pendingRequestsCount,
    };

    badgeCache.set(cacheKey, {
      data: badgeData,
      expiresAt: Date.now() + 15000,
    });

    const response = NextResponse.json(badgeData);
    response.headers.set("Cache-Control", "private, max-age=15, stale-while-revalidate=30");
    return response;
  } catch (error) {
    return NextResponse.json({ unreadChatsCount: 0, pendingRequestsCount: 0, totalUnreadMessages: 0 });
  }
}
