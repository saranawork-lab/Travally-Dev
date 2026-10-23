import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { calculateTravelCompatibility, UserTravelProfile } from "@/lib/scoring";
import { safeJsonParse } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const destination = searchParams.get("destination");
    const style = searchParams.get("style");
    const search = searchParams.get("search");

    const currentUser = await getCurrentUser();

    let blockedUserIds: string[] = [];
    let userTravelProfile: UserTravelProfile = {};

    if (currentUser) {
      const [blocks, profile] = await Promise.all([
        db.block.findMany({
          where: {
            OR: [
              { blockerId: currentUser.id },
              { blockedId: currentUser.id },
            ],
          },
        }),
        db.profile.findUnique({
          where: { userId: currentUser.id },
        })
      ]);
      
      blockedUserIds = blocks.map((b) => (b.blockerId === currentUser.id ? b.blockedId : b.blockerId));

      if (profile) {
        userTravelProfile = {
          departureCity: profile.city || undefined,
          interests: safeJsonParse<string[]>(profile.interests, []),
        };
      }
    }

    const organizerId = searchParams.get("organizerId") || searchParams.get("userId");
    const status = searchParams.get("status");

    const where: any = {
      status: status === "ALL" ? undefined : (status || (organizerId ? undefined : "OPEN")),
      organizerId: organizerId ? organizerId : { notIn: blockedUserIds },
    };

    if (style && style !== "ALL") {
      where.travelStyle = style.toUpperCase();
    }

    if (destination && destination.trim()) {
      where.destination = { contains: destination.trim() };
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { destination: { contains: q } },
        { departureCity: { contains: q } },
        { plannedAttractions: { contains: q } },
      ];
    }

    const travelPlans = await db.travelPlan.findMany({
      where,
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
                city: true,
                linkedinUrl: true,
              },
            },
          },
        },
        requests: currentUser
          ? {
              where: { applicantId: currentUser.id },
              select: { id: true, status: true },
            }
          : false,
      },
      orderBy: { startDate: "asc" },
    });

    // Filter open trips and schedule background capacity sync without blocking GET
    const fullTripIdsToClose: string[] = [];
    const sanitizedTrips = travelPlans.filter((trip) => {
      const isFull = trip.currentAcceptedCount >= trip.groupSizeMax;
      const isPast = new Date(trip.endDate).getTime() < Date.now();
      if (isFull && trip.status !== "CLOSED") {
        fullTripIdsToClose.push(trip.id);
        trip.status = "CLOSED";
      }
      if (!organizerId) {
        if (
          trip.status === "CLOSED" ||
          trip.status === "FULL" ||
          trip.status === "CANCELLED" ||
          isFull ||
          isPast
        ) {
          return false;
        }
      }
      return true;
    });

    if (fullTripIdsToClose.length > 0) {
      db.travelPlan
        .updateMany({
          where: { id: { in: fullTripIdsToClose } },
          data: { status: "CLOSED" },
        })
        .catch((err) => console.error("Non-blocking travelPlan close error:", err));
    }

    // Augment with transparent compatibility score
    const plansWithCompatibility = sanitizedTrips.map((trip) => {
      const compatibility = calculateTravelCompatibility(userTravelProfile, {
        destination: trip.destination,
        departureCity: trip.departureCity,
        startDate: trip.startDate,
        endDate: trip.endDate,
        travelStyle: trip.travelStyle,
        interests: trip.interests,
        budgetMin: trip.budgetMin,
        budgetMax: trip.budgetMax,
      });

      return {
        ...trip,
        compatibility,
      };
    });

    return NextResponse.json({ travelPlans: plansWithCompatibility });
  } catch (error) {
    console.error("GET travel error:", error);
    return NextResponse.json({ error: "Failed to fetch travel plans" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required to create a travel plan" }, { status: 401 });
    }

    const body = await req.json();
    const {
      destination,
      departureCity,
      startDate,
      endDate,
      budgetMin,
      budgetMax,
      currency,
      travelStyle,
      interests,
      plannedAttractions,
      accommodationPreference,
      transportPreference,
      groupSizeMax,
      companionPreferences,
    } = body;

    if (!destination || !departureCity || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Destination, departure city, start date, and end date are required." },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
      return NextResponse.json(
        { error: "End date must be on or after start date." },
        { status: 400 }
      );
    }

    const travelPlan = await db.travelPlan.create({
      data: {
        organizerId: user.id,
        destination: destination.trim(),
        departureCity: departureCity.trim(),
        startDate: start,
        endDate: end,
        budgetMin: budgetMin ? parseFloat(budgetMin) : null,
        budgetMax: budgetMax ? parseFloat(budgetMax) : null,
        currency: currency || "INR",
        travelStyle: (travelStyle || "CULTURAL").toUpperCase(),
        interests: JSON.stringify(Array.isArray(interests) ? interests : []),
        plannedAttractions: plannedAttractions ? JSON.stringify(plannedAttractions) : "[]",
        accommodationPreference: accommodationPreference || "FLEXIBLE",
        transportPreference: transportPreference || "FLEXIBLE",
        groupSizeMax: parseInt(groupSizeMax, 10) || 3,
        currentAcceptedCount: 0,
        companionPreferences: companionPreferences ? JSON.stringify(companionPreferences) : "{}",
        status: "OPEN",
      },
    });

    await db.participant.create({
      data: {
        userId: user.id,
        travelPlanId: travelPlan.id,
        role: "ORGANIZER",
      },
    });

    return NextResponse.json({ success: true, travelPlan }, { status: 201 });
  } catch (error) {
    console.error("POST travel error:", error);
    return NextResponse.json({ error: "Failed to create travel plan" }, { status: 500 });
  }
}
