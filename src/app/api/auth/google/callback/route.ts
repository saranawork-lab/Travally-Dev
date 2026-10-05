import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import bcrypt from "bcryptjs";
import { signToken, AuthService, createActiveSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Handles Google OAuth 2.0 callback.
 * Reads GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET strictly from environment variables.
 * Creates or updates user, issues session cookie, and directs to onboarding if profile data is needed.
 */
export async function GET(req: NextRequest) {
  const host = req.headers.get("x-forwarded-host") || req.nextUrl.host;
  const proto = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const requestOrigin = `${proto}://${host}`;

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    requestOrigin ||
    "http://localhost:3000";

  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error || !code) {
    console.error("Google OAuth error:", error);
    const redirectUrl = new URL("/login", requestOrigin);
    redirectUrl.searchParams.set("error", error || "Google sign-in was cancelled.");
    return NextResponse.redirect(redirectUrl);
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    const storedRedirectUri = req.cookies.get("google_oauth_redirect_uri")?.value;
    let fallbackRedirectUri = process.env.GOOGLE_REDIRECT_URI;
    if (!fallbackRedirectUri || (fallbackRedirectUri.includes("localhost") && !host.includes("localhost"))) {
      fallbackRedirectUri = `${requestOrigin}/api/auth/google/callback`;
    }

    const redirectUri = storedRedirectUri || fallbackRedirectUri;

    if (!clientId || !clientSecret) {
      throw new Error("Google credentials are not configured in environment.");
    }

    // 1. Exchange authorization code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error("Google token exchange failure:", tokenData);
      throw new Error(tokenData.error_description || "Failed to exchange Google authorization code");
    }

    // 2. Fetch User Profile from Google userinfo API
    const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const userInfo = await userInfoResponse.json();

    if (!userInfoResponse.ok || !userInfo.email) {
      console.error("Google userinfo fetch failure:", userInfo);
      throw new Error("Unable to retrieve user information from Google");
    }

    const email = (userInfo.email as string).toLowerCase().trim();
    const displayName = userInfo.name || email.split("@")[0];
    const avatarUrl = userInfo.picture || "/default-avatar.png";

    // 3. Find or Create User in database
    let user = await db.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    let isProfileComplete = false;

    if (user) {
      // User exists - check if mandatory profile details (phone, DOB, city, pincode, address) are filled
      const profile = user.profile;
      let prefs: any = {};
      try {
        prefs = typeof profile?.connectionPreferences === "string"
          ? JSON.parse(profile.connectionPreferences)
          : (profile?.connectionPreferences || {});
      } catch { }

      const hasPhone = Boolean(prefs?.phoneNumber);
      const hasCity = Boolean(profile?.city && profile.city.trim() !== "");
      const hasPincode = Boolean(profile?.pincode && profile.pincode.trim() !== "");
      const hasDob = Boolean(profile?.birthDate);
      const hasAddress = Boolean(profile?.address || prefs?.address);
      const hasCustomPassword = Boolean(prefs?.hasCustomPassword);

      isProfileComplete = Boolean(hasPhone && hasCity && hasPincode && hasDob && hasAddress && hasCustomPassword);

      // If user has no avatar or vercel placeholder, update with Google picture
      if (!user.profile?.avatarUrl || user.profile.avatarUrl.includes("avatar.vercel.sh")) {
        await db.profile.update({
          where: { userId: user.id },
          data: { avatarUrl },
        });
      }
    } else {
      // Calculate membership number
      const totalExistingUsers = await db.user.count();
      const joinRank = totalExistingUsers + 365;
      const membershipNumber = `TRV-${String(joinRank).padStart(4, "0")}`;
      const randomPassword = await bcrypt.hash(Math.random().toString(36), 10);

      user = await db.user.create({
        data: {
          email,
          passwordHash: randomPassword,
          role: "USER",
          profile: {
            create: {
              displayName,
              avatarUrl,
              isVerified: false,
              verificationStatus: "UNVERIFIED",
              membershipStatus: "ACTIVE",
              membershipTier: "FOUNDING_EXPLORER",
              membershipNumber,
              interests: JSON.stringify([]),
              preferredActivities: JSON.stringify([]),
              connectionPreferences: JSON.stringify({
                friendship: true,
                activityPartner: true,
                travel: true,
              }),
            },
          },
        },
        include: { profile: true },
      });

      isProfileComplete = false; // New user must fill remaining details
    }

    // 4. Issue session token and secure cookie
    const sessionToken = await createActiveSession(user.id);
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      sessionToken,
    });

    // If profile is already complete, go straight to discover; otherwise ask remaining data in /onboarding
    const targetPath = isProfileComplete ? "/discover" : "/onboarding";
    const redirectUrl = new URL(targetPath, requestOrigin);
    if (!isProfileComplete) {
      redirectUrl.searchParams.set("google", "true");
    }

    const response = NextResponse.redirect(redirectUrl);

    response.cookies.set({
      name: AuthService.getCookieName(),
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 90 * 24 * 60 * 60, // 90 days
      path: "/",
    });

    // Clear oauth cookies
    response.cookies.delete("google_oauth_state");
    response.cookies.delete("google_oauth_redirect_uri");

    return response;
  } catch (err: any) {
    console.error("Google OAuth Callback exception:", err);
    const redirectUrl = new URL("/login", requestOrigin);
    redirectUrl.searchParams.set("error", err.message || "Failed to complete Google sign-in");
    return NextResponse.redirect(redirectUrl);
  }
}
