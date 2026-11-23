import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/chats/[id]/participants?search=xxx
 * Searches for users not yet in this group to invite / add.
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: conversationId } = params;
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";

    const conversation = await db.conversation.findUnique({
      where: { id: conversationId },
      include: {
        activity: { include: { participants: true } },
        travelPlan: { include: { participants: true } },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const existingUserIds = new Set<string>();
    if (conversation.activity) {
      existingUserIds.add(conversation.activity.organizerId);
      conversation.activity.participants.forEach((p) => existingUserIds.add(p.userId));
    }
    if (conversation.travelPlan) {
      existingUserIds.add(conversation.travelPlan.organizerId);
      conversation.travelPlan.participants.forEach((p) => existingUserIds.add(p.userId));
    }

    const whereClause: any = {
      id: { notIn: Array.from(existingUserIds) },
    };

    if (search) {
      whereClause.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { profile: { displayName: { contains: search, mode: "insensitive" } } },
      ];
    }

    const candidates = await db.user.findMany({
      where: whereClause,
      take: 20,
      select: {
        id: true,
        email: true,
        profile: {
          select: {
            displayName: true,
            avatarUrl: true,
            isVerified: true,
            city: true,
          },
        },
      },
    });

    return NextResponse.json({ candidates });
  } catch (error) {
    console.error("GET eligible participants error:", error);
    return NextResponse.json({ error: "Failed to search participants" }, { status: 500 });
  }
}

/**
 * POST /api/chats/[id]/participants
 * Body: { targetUserId: string, action?: "add" | "remove" }
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: conversationId } = params;
    const body = await req.json();
    const { targetUserId, action = "remove" } = body;

    if (!targetUserId) {
      return NextResponse.json({ error: "Target user ID is required" }, { status: 400 });
    }

    const conversation = await db.conversation.findUnique({
      where: { id: conversationId },
      include: {
        activity: {
          include: {
            organizer: {
              include: { profile: true },
            },
            participants: true,
          },
        },
        travelPlan: {
          include: {
            organizer: {
              include: { profile: true },
            },
            participants: true,
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Verify current user is the host / organizer or ADMIN
    const isHost =
      (conversation.activity && conversation.activity.organizerId === user.id) ||
      (conversation.travelPlan && conversation.travelPlan.organizerId === user.id) ||
      user.role === "ADMIN";

    if (!isHost) {
      return NextResponse.json(
        { error: "Only the group host has authority to manage members." },
        { status: 403 }
      );
    }

    // Target user profile for system message and notifications
    const targetUser = await db.user.findUnique({
      where: { id: targetUserId },
      include: { profile: true },
    });
    const targetName =
      targetUser?.profile?.displayName || targetUser?.email?.split("@")[0] || "A participant";
    const hostName =
      (user as any).name || (user as any).displayName || user.email?.split("@")[0] || "The host";

    // ─── ACTION: ADD PARTICIPANT ───
    if (action === "add") {
      // Check if already in group
      const inActivity = conversation.activity?.participants.some((p) => p.userId === targetUserId);
      const inTravel = conversation.travelPlan?.participants.some((p) => p.userId === targetUserId);

      if (inActivity || inTravel) {
        return NextResponse.json(
          { error: `${targetName} is already a member of this group.` },
          { status: 400 }
        );
      }

      let newParticipant = null;

      if (conversation.activityId) {
        newParticipant = await db.participant.create({
          data: {
            userId: targetUserId,
            activityId: conversation.activityId,
            role: "MEMBER",
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                profile: true,
              },
            },
          },
        });

        await db.activity.update({
          where: { id: conversation.activityId },
          data: { currentAcceptedCount: { increment: 1 } },
        });
      } else if (conversation.travelPlanId) {
        newParticipant = await db.participant.create({
          data: {
            userId: targetUserId,
            travelPlanId: conversation.travelPlanId,
            role: "MEMBER",
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                profile: true,
              },
            },
          },
        });

        await db.travelPlan.update({
          where: { id: conversation.travelPlanId },
          data: { currentAcceptedCount: { increment: 1 } },
        });
      }

      // Create system announcement message in chat
      await db.message.create({
        data: {
          conversationId,
          senderId: user.id,
          content: JSON.stringify({
            text: `👋 ${targetName} was added to the group by ${hostName}.`,
            system: true,
          }),
          readBy: JSON.stringify([user.id]),
        },
      });

      // Notify added user
      await db.notification.create({
        data: {
          userId: targetUserId,
          type: "REQUEST_ACCEPTED",
          title: "Added to Group",
          body: `You were added to "${conversation.title}" by ${hostName}.`,
          actionUrl: `/chats/${conversationId}`,
        },
      });

      return NextResponse.json({ success: true, participant: newParticipant });
    }

    // ─── ACTION: REMOVE PARTICIPANT ───
    if (targetUserId === user.id) {
      return NextResponse.json(
        { error: "Host cannot remove themselves from the group." },
        { status: 400 }
      );
    }

    if (conversation.activityId) {
      await db.participant.deleteMany({
        where: {
          userId: targetUserId,
          activityId: conversation.activityId,
        },
      });

      await db.activity.update({
        where: { id: conversation.activityId },
        data: {
          currentAcceptedCount: { decrement: 1 },
          status: "OPEN",
        },
      });

      await db.joinRequest.updateMany({
        where: {
          applicantId: targetUserId,
          activityId: conversation.activityId,
          status: "ACCEPTED",
        },
        data: { status: "DECLINED" },
      });
    } else if (conversation.travelPlanId) {
      await db.participant.deleteMany({
        where: {
          userId: targetUserId,
          travelPlanId: conversation.travelPlanId,
        },
      });

      await db.travelPlan.update({
        where: { id: conversation.travelPlanId },
        data: {
          currentAcceptedCount: { decrement: 1 },
          status: "OPEN",
        },
      });

      await db.joinRequest.updateMany({
        where: {
          applicantId: targetUserId,
          travelPlanId: conversation.travelPlanId,
          status: "ACCEPTED",
        },
        data: { status: "DECLINED" },
      });
    }

    // Create system message in chat
    await db.message.create({
      data: {
        conversationId,
        senderId: user.id,
        content: JSON.stringify({
          text: `⚠️ ${targetName} was removed from the group by the host.`,
          system: true,
        }),
        readBy: JSON.stringify([user.id]),
      },
    });

    // Create In-App Notification for removed user
    await db.notification.create({
      data: {
        userId: targetUserId,
        type: "ACTIVITY_CANCELLED",
        title: "Removed from Group",
        body: `You were removed from "${conversation.title}" by the host.`,
        actionUrl: "/chats",
      },
    });

    return NextResponse.json({ success: true, removedUserId: targetUserId });
  } catch (error) {
    console.error("Manage participant error:", error);
    return NextResponse.json({ error: "Failed to manage participant" }, { status: 500 });
  }
}
