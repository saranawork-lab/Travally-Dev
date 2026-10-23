import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getCurrentUser, isValidObjectId } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action } = await req.json(); // "ACCEPT" | "DECLINE"

    if (action !== "ACCEPT" && action !== "DECLINE") {
      return NextResponse.json({ error: "Invalid action. Must be ACCEPT or DECLINE." }, { status: 400 });
    }

    const joinRequest = await db.joinRequest.findUnique({
      where: { id },
      include: {
        activity: true,
        travelPlan: true,
        applicant: {
          select: {
            id: true,
            profile: { select: { displayName: true } },
          },
        },
      },
    });

    if (!joinRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const isActivity = joinRequest.type === "ACTIVITY";
    const organizerId = isActivity ? joinRequest.activity?.organizerId : joinRequest.travelPlan?.organizerId;

    if (organizerId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Only the organizer can respond to this request." }, { status: 403 });
    }

    if (joinRequest.status !== "PENDING") {
      return NextResponse.json({ error: `Request has already been ${joinRequest.status.toLowerCase()}.` }, { status: 400 });
    }

    if (action === "DECLINE" || action === "NOT_INTERESTED") {
      const updated = await db.joinRequest.update({
        where: { id },
        data: {
          status: "DECLINED",
          respondedAt: new Date(),
        },
      });

      await db.notification.create({
        data: {
          userId: joinRequest.applicantId,
          type: "REQUEST_DECLINED",
          title: "Request Update",
          body: `The organizer was not able to accommodate your request for "${isActivity ? joinRequest.activity?.title : joinRequest.travelPlan?.destination}".`,
          actionUrl: "/discover",
        },
      });

      return NextResponse.json({ success: true, request: updated, notInterested: action === "NOT_INTERESTED" });
    }

    // Handle ACCEPT
    if (isActivity && joinRequest.activity) {
      const activity = joinRequest.activity;

      // Check current capacity
      if (activity.currentAcceptedCount >= activity.maxParticipants) {
        return NextResponse.json({ error: "Activity is already at maximum capacity." }, { status: 400 });
      }

      // 1. Update JoinRequest
      const updated = await db.joinRequest.update({
        where: { id },
        data: {
          status: "ACCEPTED",
          respondedAt: new Date(),
        },
      });

      // 2. Add applicant and organizer to Participants
      const existingOrganizer = await db.participant.findFirst({
        where: {
          userId: user.id,
          activityId: activity.id,
        },
      });

      if (!existingOrganizer) {
        await db.participant.create({
          data: {
            userId: user.id,
            activityId: activity.id,
            role: "ORGANIZER",
          },
        });
      }

      const existingParticipant = await db.participant.findFirst({
        where: {
          userId: joinRequest.applicantId,
          activityId: activity.id,
        },
      });

      if (!existingParticipant) {
        await db.participant.create({
          data: {
            userId: joinRequest.applicantId,
            activityId: activity.id,
            role: "MEMBER",
          },
        });
      }

      // 3. Increment accepted count & check capacity
      const newAcceptedCount = activity.currentAcceptedCount + 1;
      const isNowFull = newAcceptedCount >= activity.maxParticipants;

      await db.activity.update({
        where: { id: activity.id },
        data: {
          currentAcceptedCount: newAcceptedCount,
          status: isNowFull ? "CLOSED" : activity.status,
        },
      });

      // 4. Ensure Conversation exists
      let conversation = await db.conversation.findFirst({
        where: { activityId: activity.id },
      });

      if (!conversation) {
        conversation = await db.conversation.create({
          data: {
            type: "ACTIVITY",
            activityId: activity.id,
            title: `${activity.title} Group Chat`,
          },
        });
      }

      // 5. Send welcome message into chat
      await db.message.create({
        data: {
          conversationId: conversation.id,
          senderId: user.id,
          content: `Welcome to the group, ${joinRequest.applicant.profile?.displayName || "companion"}! Feel free to coordinate details here.`,
        },
      });

      // 6. Send notification to applicant
      await db.notification.create({
        data: {
          userId: joinRequest.applicantId,
          type: "REQUEST_ACCEPTED",
          title: "Request Accepted!",
          body: `You are in! ${user.displayName} accepted your request for "${activity.title}". The private chat is now open.`,
          actionUrl: `/chats/${conversation.id}`,
        },
      });

      return NextResponse.json({ success: true, request: updated, conversationId: conversation.id });
    }

    if (!isActivity && joinRequest.travelPlan) {
      const trip = joinRequest.travelPlan;

      if (trip.currentAcceptedCount >= trip.groupSizeMax) {
        return NextResponse.json({ error: "Trip has reached maximum companion capacity." }, { status: 400 });
      }

      const updated = await db.joinRequest.update({
        where: { id },
        data: {
          status: "ACCEPTED",
          respondedAt: new Date(),
        },
      });

      const existingOrganizer = await db.participant.findFirst({
        where: {
          userId: user.id,
          travelPlanId: trip.id,
        },
      });

      if (!existingOrganizer) {
        await db.participant.create({
          data: {
            userId: user.id,
            travelPlanId: trip.id,
            role: "ORGANIZER",
          },
        });
      }

      const existingParticipant = await db.participant.findFirst({
        where: {
          userId: joinRequest.applicantId,
          travelPlanId: trip.id,
        },
      });

      if (!existingParticipant) {
        await db.participant.create({
          data: {
            userId: joinRequest.applicantId,
            travelPlanId: trip.id,
            role: "MEMBER",
          },
        });
      }

      const newAcceptedCount = trip.currentAcceptedCount + 1;
      const isNowFull = newAcceptedCount >= trip.groupSizeMax;

      await db.travelPlan.update({
        where: { id: trip.id },
        data: {
          currentAcceptedCount: newAcceptedCount,
          status: isNowFull ? "CLOSED" : trip.status,
        },
      });

      let conversation = await db.conversation.findFirst({
        where: { travelPlanId: trip.id },
      });

      if (!conversation) {
        conversation = await db.conversation.create({
          data: {
            type: "TRAVEL",
            travelPlanId: trip.id,
            title: `${trip.destination} Travel Team`,
          },
        });
      }

      await db.message.create({
        data: {
          conversationId: conversation.id,
          senderId: user.id,
          content: `Welcome to the travel group, ${joinRequest.applicant.profile?.displayName || "traveler"}! Excited to plan our journey together.`,
        },
      });

      await db.notification.create({
        data: {
          userId: joinRequest.applicantId,
          type: "REQUEST_ACCEPTED",
          title: "Travel Request Accepted!",
          body: `Your request to join the trip to ${trip.destination} has been accepted! You can now join the planning chat.`,
          actionUrl: `/chats/${conversation.id}`,
        },
      });

      return NextResponse.json({ success: true, request: updated, conversationId: conversation.id });
    }

    return NextResponse.json({ error: "Failed to process request." }, { status: 400 });
  } catch (error) {
    console.error("PATCH request error:", error);
    return NextResponse.json({ error: "Failed to update request" }, { status: 500 });
  }
}

// User cancels their own request
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const joinRequest = await db.joinRequest.findUnique({
      where: { id },
      include: {
        activity: true,
        travelPlan: true,
      },
    });

    if (!joinRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (joinRequest.applicantId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "You can only cancel your own requests." }, { status: 403 });
    }

    const wasAccepted = joinRequest.status === "ACCEPTED";

    // 1. Mark request as CANCELLED
    const cancelled = await db.joinRequest.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    // 2. If participant was confirmed, remove participant and decrement capacity
    if (wasAccepted) {
      if (joinRequest.activityId && joinRequest.activity) {
        const activity = joinRequest.activity;
        // Remove from participants
        await db.participant.deleteMany({
          where: {
            userId: user.id,
            activityId: activity.id,
          },
        });

        const newCount = Math.max(0, activity.currentAcceptedCount - 1);
        const wasFull = activity.currentAcceptedCount >= activity.maxParticipants || activity.status === "CLOSED" || activity.status === "FULL";

        // Do not reopen automatically! Keep CLOSED so it doesn't automatically expose to public feed
        await db.activity.update({
          where: { id: activity.id },
          data: {
            currentAcceptedCount: newCount,
            status: wasFull ? "CLOSED" : activity.status,
          },
        });

        // Trigger prompt notification to event creator
        if (wasFull) {
          await db.notification.create({
            data: {
              userId: activity.organizerId,
              type: "SPOT_OPENED",
              title: "A spot has opened up!",
              body: `A participant left "${activity.title}". Would you like to reopen this event to the public? (${newCount}/${activity.maxParticipants} spots filled)`,
              actionUrl: `/activities/${activity.id}?prompt=reopen`,
            },
          });
        }
      } else if (joinRequest.travelPlanId && joinRequest.travelPlan) {
        const trip = joinRequest.travelPlan;
        await db.participant.deleteMany({
          where: {
            userId: user.id,
            travelPlanId: trip.id,
          },
        });

        const newCount = Math.max(0, trip.currentAcceptedCount - 1);
        const wasFull = trip.currentAcceptedCount >= trip.groupSizeMax || trip.status === "CLOSED" || trip.status === "FULL";

        await db.travelPlan.update({
          where: { id: trip.id },
          data: {
            currentAcceptedCount: newCount,
            status: wasFull ? "CLOSED" : trip.status,
          },
        });

        if (wasFull) {
          await db.notification.create({
            data: {
              userId: trip.organizerId,
              type: "SPOT_OPENED",
              title: "A spot has opened up!",
              body: `A traveler left "${trip.destination}". Would you like to reopen this trip to the public? (${newCount}/${trip.groupSizeMax} spots filled)`,
              actionUrl: `/travel/${trip.id}?prompt=reopen`,
            },
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Request cancelled successfully",
      request: cancelled,
      wasAccepted,
    });
  } catch (error) {
    console.error("DELETE request error:", error);
    return NextResponse.json({ error: "Failed to cancel request" }, { status: 500 });
  }
}
