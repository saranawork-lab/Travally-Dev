import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { cleanupExpiredConversations, getChatRetentionInfo } from "@/lib/chatRetention";
import { getDb } from "@/lib/mongo";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Non-blocking background purge of conversations exceeding 7-day retention
    cleanupExpiredConversations().catch((err) =>
      console.warn("Background chat retention cleanup warning:", err)
    );

    // 2. Get all activities and trips where the user is a participant OR the host/organizer
    const [participations, organizedActivities, organizedTrips] = await Promise.all([
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
    ]);

    const participantActivityIds = participations.map((p) => p.activityId).filter(Boolean) as string[];
    const participantTravelIds = participations.map((p) => p.travelPlanId).filter(Boolean) as string[];

    const allActivityIds = Array.from(
      new Set([...participantActivityIds, ...organizedActivities.map((a) => a.id)])
    );
    const allTravelPlanIds = Array.from(
      new Set([...participantTravelIds, ...organizedTrips.map((t) => t.id)])
    );

    // 3. Fetch activity/trip conversations matching these activities or trips
    const conversations = (allActivityIds.length > 0 || allTravelPlanIds.length > 0)
      ? await db.conversation.findMany({
          where: {
            OR: [
              ...(allActivityIds.length > 0 ? [{ activityId: { in: allActivityIds } }] : []),
              ...(allTravelPlanIds.length > 0 ? [{ travelPlanId: { in: allTravelPlanIds } }] : []),
            ],
          },
          select: {
            id: true,
            title: true,
            type: true,
            updatedAt: true,
            activityId: true,
            travelPlanId: true,
            activity: {
              select: {
                id: true,
                title: true,
                category: true,
                date: true,
                startTime: true,
                approxDurationHours: true,
                locationName: true,
                status: true,
                updatedAt: true,
              },
            },
            travelPlan: {
              select: {
                id: true,
                destination: true,
                departureCity: true,
                startDate: true,
                endDate: true,
                travelStyle: true,
                status: true,
                updatedAt: true,
              },
            },
            messages: {
              take: 1,
              orderBy: { createdAt: "desc" },
              select: {
                id: true,
                content: true,
                createdAt: true,
                senderId: true,
                sender: {
                  select: {
                    id: true,
                    profile: { select: { displayName: true, avatarUrl: true } },
                  },
                },
              },
            },
          },
          orderBy: { updatedAt: "desc" },
        })
      : [];

    // 4. Fetch DIRECT 1-on-1 conversations from MongoDB
    const mongo = await getDb();
    const directDocs = await mongo
      .collection("Conversation")
      .find({
        type: "DIRECT",
        participantIds: user.id,
      })
      .sort({ updatedAt: -1 })
      .toArray();

    const directConversations = await Promise.all(
      directDocs.map(async (doc) => {
        const otherUserId = (doc.participantIds || []).find((uid: string) => uid !== user.id);
        let otherUser = null;
        if (otherUserId) {
          otherUser = await db.user.findUnique({
            where: { id: otherUserId },
            include: { profile: true },
          });
        }

        const lastMsg = await mongo
          .collection("Message")
          .find({ conversationId: doc._id })
          .sort({ createdAt: -1 })
          .limit(1)
          .toArray();

        const latest = lastMsg[0];

        return {
          id: doc._id.toString(),
          title: otherUser?.profile?.displayName || "Companion",
          type: "DIRECT",
          otherUser: otherUser?.profile
            ? {
                id: otherUser.id,
                displayName: otherUser.profile.displayName,
                avatarUrl: otherUser.profile.avatarUrl,
                isVerified: otherUser.profile.isVerified,
              }
            : null,
          updatedAt: doc.updatedAt || doc.createdAt,
          activityId: null,
          travelPlanId: null,
          activity: null,
          travelPlan: null,
          participantIds: doc.participantIds,
          messages: latest
            ? [
                {
                  id: latest._id.toString(),
                  content: latest.content,
                  createdAt: latest.createdAt,
                  senderId: latest.senderId?.toString(),
                  sender: {
                    id: latest.senderId?.toString(),
                    profile: {
                      displayName:
                        latest.senderId?.toString() === user.id
                          ? user.displayName
                          : otherUser?.profile?.displayName || "Companion",
                      avatarUrl:
                        latest.senderId?.toString() === user.id
                          ? user.avatarUrl
                          : otherUser?.profile?.avatarUrl,
                    },
                  },
                },
              ]
            : [],
        };
      })
    );

    // Merge and decorate with 7-day retention details
    const allConvs = [...conversations, ...directConversations];
    allConvs.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    const decorated = allConvs.map((conv) => ({
      ...conv,
      retentionInfo: getChatRetentionInfo(conv as any),
    }));

    const response = NextResponse.json({ conversations: decorated });
    response.headers.set("Cache-Control", "private, s-maxage=10, stale-while-revalidate=59");
    return response;
  } catch (error) {
    console.error("GET chats error:", error);
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
  }
}
