import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import bcrypt from "bcryptjs";
import { signToken, AuthService, createActiveSession } from "@/lib/auth";
import { evaluatePassword, getPasswordErrorMessage } from "@/lib/passwordValidation";
import { extractDigits } from "@/lib/userAccountLookup";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      email,
      password,
      displayName,
      address,
      region,
      city,
      pincode,
      gender,
      birthDate,
      bio,
      interests,
      preferredActivities,
      smokingHabit,
      drinkingHabit,
      dietaryPreference,
      lifestyleTags,
      connectionPreferences,
      linkedinUrl,
    } = body;

    if (!email || !password || !displayName) {
      return NextResponse.json(
        { error: "Email, password, and display name are required." },
        { status: 400 }
      );
    }

    // Strict email format check
    const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!EMAIL_REGEX.test(email.trim())) {
      return NextResponse.json(
        { error: "Please enter a valid email address (e.g. name@example.com)." },
        { status: 400 }
      );
    }

    // Mandatory pincode check
    const cleanPincode = (pincode || "").toString().replace(/[^0-9]/g, "");
    if (!cleanPincode || cleanPincode.length !== 6) {
      return NextResponse.json(
        { error: "Pincode is mandatory and must be a 6-digit postal code." },
        { status: 400 }
      );
    }

    // Password strength check: min 8 char, one Cap, small, number, special char
    const passwordEvaluation = evaluatePassword(password);
    if (!passwordEvaluation.isValid) {
      return NextResponse.json(
        {
          error:
            getPasswordErrorMessage(passwordEvaluation) ||
            "Password must have at least 8 characters, 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.",
        },
        { status: 400 }
      );
    }

    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please sign in instead." },
        { status: 409 }
      );
    }

    // Validate phone number format if provided
    const rawPhone = body.phoneNumber || connectionPreferences?.phoneNumber;
    if (rawPhone && typeof rawPhone === "string" && rawPhone.trim()) {
      const cleanDigits = extractDigits(rawPhone);
      if (cleanDigits.length < 10) {
        return NextResponse.json(
          { error: "Please enter a valid 10-digit mobile phone number." },
          { status: 400 }
        );
      }
    }

    let calculatedAge: number | undefined = undefined;
    let parsedBirthDate: Date | undefined = undefined;
    if (birthDate) {
      parsedBirthDate = new Date(birthDate);
      const diffMs = Date.now() - parsedBirthDate.getTime();
      const ageDt = new Date(diffMs);
      calculatedAge = Math.abs(ageDt.getUTCFullYear() - 1970);
      if (calculatedAge < 18) {
        return NextResponse.json(
          { error: "You must be at least 18 years old to join Travally." },
          { status: 400 }
        );
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const totalExistingUsers = await db.user.count();
    const joinRank = totalExistingUsers + 365;
    const membershipNumber = `TRV-${String(joinRank).padStart(4, "0")}`;

    // Prepare connectionPreferences with saved phone number
    let finalConnPrefs: Record<string, any> = { friendship: true, activityPartner: true };
    if (connectionPreferences) {
      if (typeof connectionPreferences === "string") {
        try {
          finalConnPrefs = JSON.parse(connectionPreferences);
        } catch {
          finalConnPrefs = { friendship: true, activityPartner: true };
        }
      } else {
        finalConnPrefs = { ...connectionPreferences };
      }
    }
    if (rawPhone && typeof rawPhone === "string" && rawPhone.trim()) {
      finalConnPrefs.phoneNumber = rawPhone.trim();
    }
    if (address && typeof address === "string") finalConnPrefs.address = address.trim();
    if (region && typeof region === "string") finalConnPrefs.region = region.trim();
    if (city && typeof city === "string") finalConnPrefs.city = city.trim();
    if (pincode && typeof pincode === "string") finalConnPrefs.pincode = pincode.trim();
    if (smokingHabit) finalConnPrefs.smokingHabit = smokingHabit;
    if (drinkingHabit) finalConnPrefs.drinkingHabit = drinkingHabit;
    if (dietaryPreference) finalConnPrefs.dietaryPreference = dietaryPreference;
    if (Array.isArray(lifestyleTags)) finalConnPrefs.lifestyleTags = lifestyleTags;

    const newUser = await db.user.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash,
        role: "USER",
        profile: {
          create: {
            displayName: displayName.trim(),
            avatarUrl: "/default-avatar.png",
            city: city ? city.trim() : null,
            region: region ? region.trim() : null,
            address: address ? address.trim() : null,
            pincode: pincode ? pincode.trim() : null,
            gender: gender || "PREFER_NOT_TO_SAY",
            birthDate: parsedBirthDate,
            age: calculatedAge,
            bio: bio ? bio.trim() : "",
            interests: JSON.stringify(Array.isArray(interests) ? interests : []),
            preferredActivities: JSON.stringify(
              Array.isArray(preferredActivities) ? preferredActivities : []
            ),
            connectionPreferences: JSON.stringify(finalConnPrefs),
            isVerified: false,
            verificationStatus: "UNVERIFIED",
            linkedinUrl: linkedinUrl ? linkedinUrl.trim() : null,
            hideContactDetails: true,
            discoveryVisible: true,
            membershipStatus: "ACTIVE",
            membershipTier: "FOUNDING_EXPLORER",
            membershipNumber: membershipNumber,
            memberSince: new Date(),
          },
        },
      },
      include: { profile: true },
    });

    const sessionToken = await createActiveSession(newUser.id);
    const token = signToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
      sessionToken,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        displayName: newUser.profile?.displayName,
        avatarUrl: newUser.profile?.avatarUrl,
        isVerified: false,
        verificationStatus: "UNVERIFIED",
        joinRank,
        membershipNumber,
      },
    });

    response.cookies.set({
      name: AuthService.getCookieName(),
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 90 * 24 * 60 * 60, // 90 days persistent session
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}
