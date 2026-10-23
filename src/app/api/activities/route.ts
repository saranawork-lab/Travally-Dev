import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const status = searchParams.get("status") || "OPEN";

    // MVO80 Matching Algorithm Configuration
    const SCORE_WEIGHTS = {
      EXACT_CITY_MATCH: 50,
      INTEREST_MATCH: 30,
      VERIFIED_HOST: 15,
      TRENDING_PER_USER: 5,
      URGENCY_MAX: 20,
    };

    const currentUser = await getCurrentUser();

    // Find blocked users and user profile in parallel if authenticated
    let blockedUserIds: string[] = [];
    let userProfile: any = null;
    
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
      userProfile = profile;
    }

    const organizerId = searchParams.get("organizerId") || searchParams.get("userId");

    const where: any = {
      status: status === "ALL" ? undefined : status,
      organizerId: organizerId ? organizerId : { notIn: blockedUserIds },
    };

    if (category && category !== "ALL") {
      where.category = category.toUpperCase().replace(/\s+/g, "_");
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { title: { contains: q } },
        { description: { contains: q } },
        { locationName: { contains: q } },
      ];
    }

    const activities = await db.activity.findMany({
      where,
      include: {
        organizer: {
          select: {
            id: true,
            email: true,
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
    });

    // Filter open activities and schedule background capacity sync without blocking GET
    const fullActivityIdsToClose: string[] = [];
    const sanitizedActivities = activities.filter((act) => {
      const isFull = act.currentAcceptedCount >= act.maxParticipants;
      const isPast = new Date(act.date).getTime() < Date.now();
      if (isFull && act.status !== "CLOSED") {
        fullActivityIdsToClose.push(act.id);
        act.status = "CLOSED";
      }
      if (!organizerId) {
        if (
          act.status === "CLOSED" ||
          act.status === "CANCELLED" ||
          act.status === "EXPIRED" ||
          isFull ||
          isPast
        ) {
          return false;
        }
      }
      return true;
    });

    if (fullActivityIdsToClose.length > 0) {
      db.activity
        .updateMany({
          where: { id: { in: fullActivityIdsToClose } },
          data: { status: "CLOSED" },
        })
        .catch((err) => console.error("Non-blocking activity close error:", err));
    }

    // High-Level Matching Algorithm implementation
    let matchedActivities = sanitizedActivities;

    if (currentUser) {
      // 1. We already fetched userProfile in parallel with blocks


      const userCity = userProfile?.city?.toLowerCase() || "";
      const userAge = userProfile?.age;
      const userGender = userProfile?.gender || "PREFER_NOT_TO_SAY";

      let userInterests: string[] = [];
      let userPreferredActs: string[] = [];
      try {
        if (userProfile?.interests) {
          userInterests = JSON.parse(userProfile.interests as string).map((i: string) => i.toLowerCase());
        }
      } catch (e) {}
      try {
        if (userProfile?.preferredActivities) {
          userPreferredActs = JSON.parse(userProfile.preferredActivities as string).map((a: string) => a.toLowerCase());
        }
      } catch (e) {}

      const allUserPreferences = Array.from(new Set([...userInterests, ...userPreferredActs]));

      // 2. Score each activity with Multi-Factor Matching Algorithm
      const now = new Date().getTime();
      const scoredActivities = sanitizedActivities.map((activity) => {
        let score = 0;

        // A. Location Match (City/Area/Locality)
        if (userCity && activity.locationName && (
          activity.locationName.toLowerCase().includes(userCity) ||
          userCity.includes(activity.locationName.toLowerCase())
        )) {
          score += SCORE_WEIGHTS.EXACT_CITY_MATCH; // +50
        }

        // B. Interest & Category Semantic Affinity Match
        const activityCategory = (activity.category || "").toLowerCase();
        const activityTitle = activity.title.toLowerCase();
        const activityDesc = activity.description.toLowerCase();

        const hasCategoryMatch = allUserPreferences.some(pref =>
          activityCategory.includes(pref) || pref.includes(activityCategory) ||
          activityTitle.includes(pref) || activityDesc.includes(pref)
        );
        if (hasCategoryMatch) {
          score += SCORE_WEIGHTS.INTEREST_MATCH; // +30
        }

        // C. Verified Host Trust Factor
        if (activity.organizer.profile?.isVerified) {
          score += SCORE_WEIGHTS.VERIFIED_HOST; // +15
        }

        // D. Demographic Alignment (Age & Gender preference)
        if (userAge && activity.preferredAgeMin && activity.preferredAgeMax) {
          if (userAge >= activity.preferredAgeMin && userAge <= activity.preferredAgeMax) {
            score += 10;
          }
        }
        if (activity.genderPreference === "ANY" || activity.genderPreference === userGender) {
          score += 5;
        }

        // E. Social Proof & Urgency Sweet-Spot
        const spotsRemaining = activity.maxParticipants - activity.currentAcceptedCount;
        if (spotsRemaining === 1) {
          score += 15; // Urgency bonus: almost full!
        } else if (spotsRemaining > 1) {
          score += (activity.currentAcceptedCount || 0) * SCORE_WEIGHTS.TRENDING_PER_USER;
        }

        // F. Time Proximity (Next 2-7 days gets peak relevance)
        const activityTime = new Date(activity.date).getTime();
        const timeDiffDays = (activityTime - now) / (1000 * 3600 * 24);
        if (timeDiffDays >= 0 && timeDiffDays <= 7) {
          score += Math.max(0, SCORE_WEIGHTS.URGENCY_MAX - (timeDiffDays * 2));
        }

        return { ...activity, matchScore: score };
      });

      // 3. Sort by matchScore descending, then by upcoming date
      matchedActivities = scoredActivities.sort((a, b) => {
        if (b.matchScore !== a.matchScore) {
          return b.matchScore - a.matchScore;
        }
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });
    } else {
      matchedActivities = sanitizedActivities.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }

    return NextResponse.json({ activities: matchedActivities });
  } catch (error) {
    console.error("GET activities error:", error);
    return NextResponse.json({ error: "Failed to fetch activities" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required to create an activity" }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      description,
      category,
      date,
      startTime,
      approxDurationHours,
      locationName,
      meetingPointVenue,
      maxParticipants,
      preferredAgeMin,
      preferredAgeMax,
      genderPreference,
      additionalRequirements,
      cutoffHoursBeforeStart,
      imageUrl,
    } = body;

    // Note: locationName and maxParticipants are now optional as requested
    if (!title || !description || !category || !date || !startTime) {
      return NextResponse.json(
        { error: "Please fill in all required fields: title, description, category, date, and start time." },
        { status: 400 }
      );
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: "Invalid date format." }, { status: 400 });
    }

    const activity = await db.activity.create({
      data: {
        organizerId: user.id,
        title: title.trim(),
        description: description.trim(),
        category: category.toUpperCase().replace(/\s+/g, "_"),
        date: parsedDate,
        startTime: startTime.trim(),
        approxDurationHours: parseFloat(approxDurationHours) || 2.0,
        locationName: locationName ? locationName.trim() : (user.city || "Local Meetup"),
        meetingPointVenue: meetingPointVenue ? meetingPointVenue.trim() : null,
        maxParticipants: maxParticipants ? parseInt(maxParticipants, 10) : 2,
        currentAcceptedCount: 0,
        preferredAgeMin: preferredAgeMin ? parseInt(preferredAgeMin, 10) : null,
        preferredAgeMax: preferredAgeMax ? parseInt(preferredAgeMax, 10) : null,
        genderPreference: genderPreference || "ANY",
        cutoffHoursBeforeStart: cutoffHoursBeforeStart ? Math.max(0.5, parseFloat(cutoffHoursBeforeStart)) : 1,
        // @ts-ignore: Schema updated but types may not reflect it yet without restarting dev server
        imageUrl: imageUrl ? imageUrl.trim() : null,
        status: "OPEN",
      },
    });

    // Automatically create participant entry for the organizer
    await db.participant.create({
      data: {
        userId: user.id,
        activityId: activity.id,
        role: "ORGANIZER",
      },
    });

    return NextResponse.json({ success: true, activity }, { status: 201 });
  } catch (error) {
    console.error("POST activity error:", error);
    return NextResponse.json({ error: "Failed to create activity" }, { status: 500 });
  }
}
