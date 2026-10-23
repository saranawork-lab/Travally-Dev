import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isPastCutoff } from "@/lib/utils";

import { cleanupExpiredRequests } from "@/lib/server/cleanup";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Automatically remove all requests where event time has passed by 30 mins (runs in background)
    cleanupExpiredRequests().catch(() => {});

    const { searchParams } = new URL(req.url);
    const view = searchParams.get("view") || "received"; // received, sent, or both

    if (view === "both") {
      const [receivedRequests, sentRequests] = await Promise.all([
        db.joinRequest.findMany({
          where: {
            OR: [
              { activity: { organizerId: user.id } },
              { travelPlan: { organizerId: user.id } },
            ],
          },
          include: {
            applicant: {
              select: {
                id: true,
                profile: {
                  select: {
                    displayName: true,
                    avatarUrl: true,
                    bio: true,
                    city: true,
                    age: true,
                    gender: true,
                    interests: true,
                    isVerified: true,
                    verificationStatus: true,
                    linkedinUrl: true,
                  },
                },
              },
            },
            activity: {
              include: {
                conversations: { select: { id: true } },
              },
            },
            travelPlan: {
              include: {
                conversations: { select: { id: true } },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        }),
        db.joinRequest.findMany({
          where: { applicantId: user.id },
          include: {
            activity: {
              include: {
                organizer: {
                  select: {
                    id: true,
                    profile: {
                      select: {
                        displayName: true,
                        avatarUrl: true,
                        isVerified: true,
                        verificationStatus: true,
                      },
                    },
                  },
                },
              },
            },
            travelPlan: {
              include: {
                organizer: {
                  select: {
                    id: true,
                    profile: {
                      select: {
                        displayName: true,
                        avatarUrl: true,
                        isVerified: true,
                        verificationStatus: true,
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        }),
      ]);

      return NextResponse.json({
        received: receivedRequests,
        sent: sentRequests,
      });
    }

    if (view === "sent") {
      const sentRequests = await db.joinRequest.findMany({
        where: { applicantId: user.id },
        include: {
          activity: {
            include: {
              organizer: {
                select: {
                  id: true,
                  profile: {
                    select: {
                      displayName: true,
                      avatarUrl: true,
                      isVerified: true,
                      verificationStatus: true,
                    },
                  },
                },
              },
            },
          },
          travelPlan: {
            include: {
              organizer: {
                select: {
                  id: true,
                  profile: {
                    select: {
                      displayName: true,
                      avatarUrl: true,
                      isVerified: true,
                      verificationStatus: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ requests: sentRequests });
    }

    // "received" requests: where the current user is the organizer of the activity or travel plan
    const receivedRequests = await db.joinRequest.findMany({
      where: {
        OR: [
          { activity: { organizerId: user.id } },
          { travelPlan: { organizerId: user.id } },
        ],
      },
      include: {
        applicant: {
          select: {
            id: true,
            profile: {
              select: {
                displayName: true,
                avatarUrl: true,
                bio: true,
                city: true,
                age: true,
                gender: true,
                interests: true,
                isVerified: true,
                verificationStatus: true,
                linkedinUrl: true,
              },
            },
          },
        },
        activity: {
          include: {
            conversations: { select: { id: true } },
          },
        },
        travelPlan: {
          include: {
            conversations: { select: { id: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ requests: receivedRequests });
  } catch (error) {
    console.error("GET requests error:", error);
    return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Please log in to submit a request." }, { status: 401 });
    }

    const { type, activityId, travelPlanId, introMessage } = await req.json();

    if (!type || (type !== "ACTIVITY" && type !== "TRAVEL")) {
      return NextResponse.json({ error: "Invalid request type" }, { status: 400 });
    }

    if (type === "ACTIVITY") {
      if (!activityId) return NextResponse.json({ error: "Activity ID required" }, { status: 400 });

      const activity = await db.activity.findUnique({
        where: { id: activityId },
        include: { organizer: true },
      });

      if (!activity) {
        return NextResponse.json({ error: "Activity not found" }, { status: 404 });
      }

      // Check self-request
      if (activity.organizerId === user.id) {
        return NextResponse.json({ error: "You cannot request to join your own activity." }, { status: 400 });
      }

      // Check activity status
      if (activity.status === "CANCELLED") {
        return NextResponse.json({ error: "This activity has been cancelled." }, { status: 400 });
      }
      if (activity.status === "FULL" || activity.currentAcceptedCount >= activity.maxParticipants) {
        return NextResponse.json({ error: "This activity has already reached full capacity." }, { status: 400 });
      }

      // Enforce time cutoff
      if (isPastCutoff(activity.date, activity.startTime, activity.cutoffHoursBeforeStart)) {
        return NextResponse.json(
          { error: "The cutoff window for this activity has passed. New requests are closed." },
          { status: 400 }
        );
      }

      // Check duplicate request
      const existing = await db.joinRequest.findFirst({
        where: {
          applicantId: user.id,
          activityId,
        },
      });

      if (existing) {
        return NextResponse.json(
          { error: `You already have a ${existing.status.toLowerCase()} request for this activity.` },
          { status: 409 }
        );
      }

      const joinRequest = await db.joinRequest.create({
        data: {
          type: "ACTIVITY",
          activityId,
          applicantId: user.id,
          introMessage: introMessage ? introMessage.trim() : null,
          status: "PENDING",
        },
      });

      // Send notification to organizer
      await db.notification.create({
        data: {
          userId: activity.organizerId,
          type: "REQUEST_RECEIVED",
          title: "New Companion Request",
          body: `${user.displayName} is interested in your activity "${activity.title}".`,
          actionUrl: "/requests",
        },
      });

      return NextResponse.json({ success: true, joinRequest }, { status: 201 });
    }

    if (type === "TRAVEL") {
      if (!travelPlanId) return NextResponse.json({ error: "Travel Plan ID required" }, { status: 400 });

      const trip = await db.travelPlan.findUnique({
        where: { id: travelPlanId },
        include: { organizer: true },
      });

      if (!trip) {
        return NextResponse.json({ error: "Travel plan not found" }, { status: 404 });
      }

      if (trip.organizerId === user.id) {
        return NextResponse.json({ error: "You cannot request to join your own travel plan." }, { status: 400 });
      }

      if (trip.status === "FULL" || trip.currentAcceptedCount >= trip.groupSizeMax) {
        return NextResponse.json({ error: "This travel trip has reached capacity." }, { status: 400 });
      }

      const existing = await db.joinRequest.findFirst({
        where: {
          applicantId: user.id,
          travelPlanId,
        },
      });

      if (existing) {
        return NextResponse.json(
          { error: `You already have a ${existing.status.toLowerCase()} request for this trip.` },
          { status: 409 }
        );
      }

      const joinRequest = await db.joinRequest.create({
        data: {
          type: "TRAVEL",
          travelPlanId,
          applicantId: user.id,
          introMessage: introMessage ? introMessage.trim() : null,
          status: "PENDING",
        },
      });

      await db.notification.create({
        data: {
          userId: trip.organizerId,
          type: "REQUEST_RECEIVED",
          title: "New Travel Companion Request",
          body: `${user.displayName} requested to join your trip to ${trip.destination}.`,
          actionUrl: "/requests",
        },
      });

      return NextResponse.json({ success: true, joinRequest }, { status: 201 });
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error) {
    console.error("POST request error:", error);
    return NextResponse.json({ error: "Failed to submit join request" }, { status: 500 });
  }
}
