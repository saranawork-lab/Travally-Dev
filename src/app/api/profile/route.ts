import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const fullUser = await db.user.findUnique({
      where: { id: user.id },
      include: {
        profile: true,
        activitiesOrganized: { take: 5, orderBy: { createdAt: "desc" } },
        travelPlansOrganized: { take: 5, orderBy: { createdAt: "desc" } },
      },
    });

    let profile = fullUser?.profile;
    if (profile && !profile.membershipNumber) {
      const generatedNumber = `TRV-${Math.floor(100000 + Math.random() * 900000)}`;
      profile = await db.profile.update({
        where: { id: profile.id },
        data: {
          membershipNumber: generatedNumber,
          membershipStatus: profile.membershipStatus || "ACTIVE",
          membershipTier: profile.membershipTier || "FOUNDING_EXPLORER",
        },
      });
      if (fullUser) fullUser.profile = profile;
    }

    return NextResponse.json({ user: fullUser });
  } catch (error) {
    console.error("GET profile error:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      email,
      password,
      displayName,
      bio,
      city,
      address,
      region,
      pincode,
      gender,
      birthDate,
      phoneNumber,
      smokingHabit,
      drinkingHabit,
      dietaryPreference,
      lifestyleTags,
      interests,
      preferredActivities,
      connectionPreferences,
      linkedinUrl,
      avatarUrl,
      hideContactDetails,
      discoveryVisible,
      showLifestylePublic,
    } = body;

    // If password or email are provided (e.g. from Google or LinkedIn OAuth users creating a direct login password/email), update User model
    const userUpdates: any = {};
    if (email && typeof email === "string" && email.includes("@")) {
      userUpdates.email = email.toLowerCase().trim();
    }
    if (password && typeof password === "string" && password.trim().length >= 4) {
      userUpdates.passwordHash = await bcrypt.hash(password.trim(), 10);
    }
    if (Object.keys(userUpdates).length > 0) {
      await db.user.update({
        where: { id: user.id },
        data: userUpdates,
      });
    }

    let parsedBirthDate: Date | undefined = undefined;
    let calculatedAge: number | undefined = undefined;
    if (birthDate) {
      const d = new Date(birthDate);
      if (!isNaN(d.getTime())) {
        parsedBirthDate = d;
        const today = new Date();
        let age = today.getFullYear() - d.getFullYear();
        const m = today.getMonth() - d.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < d.getDate())) {
          age--;
        }
        calculatedAge = age >= 0 ? age : undefined;
      }
    }

    // Merge lifestyle habits & phone number into connectionPreferences
    let mergedConnPrefs: Record<string, any> = {};
    if (connectionPreferences) {
      mergedConnPrefs = typeof connectionPreferences === "string" 
        ? JSON.parse(connectionPreferences) 
        : { ...connectionPreferences };
    }
    if (phoneNumber !== undefined) mergedConnPrefs.phoneNumber = phoneNumber;
    if (address !== undefined) mergedConnPrefs.address = address;
    if (region !== undefined) mergedConnPrefs.region = region;
    if (pincode !== undefined) mergedConnPrefs.pincode = pincode;
    if (smokingHabit !== undefined) mergedConnPrefs.smokingHabit = smokingHabit;
    if (drinkingHabit !== undefined) mergedConnPrefs.drinkingHabit = drinkingHabit;
    if (dietaryPreference !== undefined) mergedConnPrefs.dietaryPreference = dietaryPreference;
    if (lifestyleTags !== undefined) mergedConnPrefs.lifestyleTags = lifestyleTags;
    if (showLifestylePublic !== undefined) mergedConnPrefs.showLifestylePublic = showLifestylePublic;
    if (password && typeof password === "string" && password.trim().length >= 4) {
      mergedConnPrefs.hasCustomPassword = true;
    }

    const updatedProfile = await db.profile.upsert({
      where: { userId: user.id },
      update: {
        displayName: displayName ? displayName.trim() : undefined,
        bio: bio !== undefined ? bio.trim() : undefined,
        city: city !== undefined ? city.trim() : undefined,
        address: address !== undefined ? (address ? address.trim() : null) : undefined,
        region: region !== undefined ? (region ? region.trim() : null) : undefined,
        pincode: pincode !== undefined ? (pincode ? pincode.toString().trim() : null) : undefined,
        gender: gender || undefined,
        birthDate: parsedBirthDate,
        age: calculatedAge,
        interests: interests !== undefined ? JSON.stringify(interests) : undefined,
        preferredActivities: preferredActivities !== undefined ? JSON.stringify(preferredActivities) : undefined,
        connectionPreferences: Object.keys(mergedConnPrefs).length > 0 ? JSON.stringify(mergedConnPrefs) : undefined,
        linkedinUrl: linkedinUrl !== undefined ? (linkedinUrl ? linkedinUrl.trim() : null) : undefined,
        avatarUrl: avatarUrl || undefined,
        hideContactDetails: hideContactDetails !== undefined ? hideContactDetails : undefined,
        discoveryVisible: discoveryVisible !== undefined ? discoveryVisible : undefined,
      },
      create: {
        userId: user.id,
        displayName: displayName || user.displayName,
        bio: bio || "",
        city: city || "",
        address: address || null,
        region: region || null,
        pincode: pincode ? pincode.toString() : null,
        gender: gender || "PREFER_NOT_TO_SAY",
        birthDate: parsedBirthDate,
        age: calculatedAge,
        interests: JSON.stringify(interests || []),
        preferredActivities: JSON.stringify(preferredActivities || []),
        connectionPreferences: JSON.stringify(mergedConnPrefs),
        linkedinUrl: linkedinUrl || null,
        avatarUrl: avatarUrl || null,
        hideContactDetails: true,
        discoveryVisible: true,
      },
    });

    return NextResponse.json({ success: true, profile: updatedProfile });
  } catch (error) {
    console.error("PUT profile error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;

    // Remove user's data across all collections
    await db.$transaction([
      db.profile.deleteMany({ where: { userId } }),
      db.participant.deleteMany({ where: { userId } }),
      db.joinRequest.deleteMany({ where: { applicantId: userId } }),
      db.message.deleteMany({ where: { senderId: userId } }),
      db.notification.deleteMany({ where: { userId } }),
      db.block.deleteMany({ where: { OR: [{ blockerId: userId }, { blockedId: userId }] } }),
      db.report.deleteMany({ where: { reporterId: userId } }),
      db.activity.deleteMany({ where: { organizerId: userId } }),
      db.travelPlan.deleteMany({ where: { organizerId: userId } }),
      db.user.delete({ where: { id: userId } }),
    ]);

    const response = NextResponse.json({ success: true, message: "Account and all data permanently deleted" });
    response.cookies.delete("travally_token");
    response.cookies.delete("token");
    return response;
  } catch (error) {
    console.error("DELETE user error:", error);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}
