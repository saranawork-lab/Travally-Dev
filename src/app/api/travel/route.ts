import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { requireVerifiedUser } from "@/lib/verificationGuard";
import { calculateTravelCompatibility, UserTravelProfile } from "@/lib/scoring";
import { safeJsonParse } from "@/lib/utils";

export const dynamic = "force-dynamic";

// Short-lived server-side in-memory cache to make travel feed lightning-fast
interface CacheEntry {
  data: any;
  timestamp: number;
}
const travelFeedCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 15000; // 15 seconds

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const destination = searchParams.get("destination");
    const style = searchParams.get("style");
    const search = searchParams.get("search");
    const organizerId = searchParams.get("organizerId") || searchParams.get("userId");
    const status = searchParams.get("status");

    const currentUser = await getCurrentUser();

    // Check fast in-memory cache for default feed queries
    const isDefaultQuery = !search && !destination && (!style || style === "ALL") && (!status || status === "OPEN") && !organizerId;
    const cacheKey = `${currentUser?.id || "anon"}_default`;
    if (isDefaultQuery) {
      const cached = travelFeedCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        const res = NextResponse.json(cached.data);
        res.headers.set("Cache-Control", "private, max-age=10, stale-while-revalidate=60");
        return res;
      }
    }

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

    const where: any = {
      status: status === "ALL" ? undefined : (status || (organizerId ? undefined : "OPEN")),
      organizerId: organizerId ? organizerId : { notIn: blockedUserIds },
    };

    if (!organizerId) {
      // Don't pull long-expired travel plans from database
      where.endDate = { gte: new Date(Date.now() - 24 * 3600 * 1000) };
    }

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

    const resultPayload = { travelPlans: plansWithCompatibility };
    if (isDefaultQuery) {
      travelFeedCache.set(cacheKey, { data: resultPayload, timestamp: Date.now() });
    }

    const response = NextResponse.json(resultPayload);
    response.headers.set("Cache-Control", "private, max-age=10, stale-while-revalidate=60");
    return response;
  } catch (error) {
    console.error("GET travel error:", error);
    return NextResponse.json({ error: "Failed to fetch travel plans" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireVerifiedUser();
    if (auth.errorResponse) {
      return auth.errorResponse;
    }
    const user = auth.user;

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

    travelFeedCache.clear();
    return NextResponse.json({ success: true, travelPlan }, { status: 201 });
  } catch (error) {
    console.error("POST travel error:", error);
    return NextResponse.json({ error: "Failed to create travel plan" }, { status: 500 });
  }
}
