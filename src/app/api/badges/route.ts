import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

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

    // Count unread messages in conversations where user is participant
    const participations = await db.participant.findMany({
      where: { userId: user.id },
      select: { activityId: true, travelPlanId: true },
    });

    const activityIds = participations.map((p) => p.activityId).filter(Boolean) as string[];
    const travelPlanIds = participations.map((p) => p.travelPlanId).filter(Boolean) as string[];

    let unreadChatsCount = 0;
    let totalUnreadMessages = 0;

    if (activityIds.length > 0 || travelPlanIds.length > 0) {
      const orFilters = [];
      if (activityIds.length > 0) orFilters.push({ activityId: { in: activityIds } });
      if (travelPlanIds.length > 0) orFilters.push({ travelPlanId: { in: travelPlanIds } });

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
