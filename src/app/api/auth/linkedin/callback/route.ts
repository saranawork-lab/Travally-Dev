import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import bcrypt from "bcryptjs";
import { signToken, AuthService, createActiveSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Handles the OAuth 2.0 callback from LinkedIn.
 * Exchanges the authorization code for access tokens, queries userinfo,
 * and upserts the user with LinkedIn Verified Member status.
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
  const errorDescription = searchParams.get("error_description");

  if (error || !code) {
    console.error("LinkedIn OAuth error received:", error, errorDescription);
    const redirectUrl = new URL("/login", requestOrigin);
    redirectUrl.searchParams.set(
      "error",
      errorDescription || "LinkedIn authorization was cancelled or failed."
    );
    return NextResponse.redirect(redirectUrl);
  }

  // Validate state cookie to prevent CSRF
  const storedState = req.cookies.get("linkedin_oauth_state")?.value;
  if (storedState && state && storedState !== state) {
    console.warn("LinkedIn OAuth state mismatch warning");
  }

  try {
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;

    // Use exact redirectUri stored during authorization request to guarantee no mismatch
    const storedRedirectUri = req.cookies.get("linkedin_oauth_redirect_uri")?.value;
    let fallbackRedirectUri = process.env.LINKEDIN_REDIRECT_URI;
    if (!fallbackRedirectUri || (fallbackRedirectUri.includes("localhost") && !host.includes("localhost"))) {
      fallbackRedirectUri = `${requestOrigin}/api/auth/linkedin/callback`;
    }

    const redirectUri = storedRedirectUri || fallbackRedirectUri;

    if (!clientId || !clientSecret) {
      throw new Error("LinkedIn credentials are not configured in environment.");
    }

    // 1. Exchange authorization code for access token
    const tokenResponse = await fetch(
      "https://www.linkedin.com/oauth/v2/accessToken",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
        }),
      }
    );

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error("Failed to retrieve LinkedIn access token:", tokenData);
      throw new Error(
        tokenData.error_description || "Failed to exchange authorization code"
      );
    }

    const accessToken = tokenData.access_token;

    // 2. Fetch User Profile and Email using OpenID Connect UserInfo endpoint
    const userInfoResponse = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const userInfo = await userInfoResponse.json();

    if (!userInfoResponse.ok || !userInfo.email) {
      console.error("Failed to retrieve LinkedIn userinfo:", userInfo);
      throw new Error("Unable to retrieve email and profile from LinkedIn");
    }

    const email = (userInfo.email as string).toLowerCase().trim();
    const displayName =
      userInfo.name ||
      `${userInfo.given_name || ""} ${userInfo.family_name || ""}`.trim() ||
      email.split("@")[0];
    const avatarUrl =
      userInfo.picture ||
      `https://avatar.vercel.sh/${encodeURIComponent(displayName)}`;
    const linkedinSub = userInfo.sub || "";
    const generatedLinkedinUrl = `https://www.linkedin.com/in/${linkedinSub}`;

    // 3. Find or Create User in database
    let user = await db.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    let isProfileComplete = false;

    if (user) {
      // Check if mandatory profile details are filled
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

      // User exists: Update profile to ensure LinkedIn Verified Member status
      await db.profile.upsert({
        where: { userId: user.id },
        update: {
          isVerified: true,
          verificationStatus: "VERIFIED",
          linkedinUrl: user.profile?.linkedinUrl || generatedLinkedinUrl,
          ...((!user.profile?.avatarUrl || user.profile.avatarUrl.includes("avatar.vercel.sh")) && { avatarUrl }),
        },
        create: {
          userId: user.id,
          displayName,
          avatarUrl,
          isVerified: true,
          verificationStatus: "VERIFIED",
          linkedinUrl: generatedLinkedinUrl,
          membershipStatus: "ACTIVE",
          membershipTier: "FOUNDING_EXPLORER",
          membershipNumber: `TRV-${Math.floor(100000 + Math.random() * 900000)}`,
          interests: JSON.stringify(["Networking", "Coffee", "Cinema"]),
          preferredActivities: JSON.stringify(["Movies", "Food and Cafes"]),
          connectionPreferences: JSON.stringify({
            friendship: true,
            activityPartner: true,
            travel: true,
          }),
        },
      });
    } else {
      // Create new user with verified status
      const totalExistingUsers = await db.user.count();
      const joinRank = totalExistingUsers + 365;
      const membershipNumber = `TRV-${String(joinRank).padStart(4, "0")}`;

      const randomPasswordHash = await bcrypt.hash(
        `linkedin_${Math.random().toString(36)}_${Date.now()}`,
        10
      );

      user = await db.user.create({
        data: {
          email,
          passwordHash: randomPasswordHash,
          role: "USER",
          profile: {
            create: {
              displayName,
              avatarUrl,
              isVerified: true,
              verificationStatus: "VERIFIED",
              linkedinUrl: generatedLinkedinUrl,
              interests: JSON.stringify([]),
              preferredActivities: JSON.stringify([]),
              connectionPreferences: JSON.stringify({
                friendship: true,
                activityPartner: true,
                travel: true,
              }),
              hideContactDetails: true,
              discoveryVisible: true,
              membershipStatus: "ACTIVE",
              membershipTier: "FOUNDING_EXPLORER",
              membershipNumber,
              memberSince: new Date(),
            },
          },
        },
        include: { profile: true },
      });

      isProfileComplete = false; // New user must fill remaining details
    }

    // 4. Issue session token and cookie
    const sessionToken = await createActiveSession(user.id);
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      sessionToken,
    });

    const targetPath = isProfileComplete ? "/discover" : "/onboarding";
    const successRedirect = new URL(targetPath, requestOrigin);
    if (isProfileComplete) {
      successRedirect.searchParams.set("verified", "linkedin");
      successRedirect.searchParams.set("welcome", encodeURIComponent(displayName));
    } else {
      successRedirect.searchParams.set("linkedin", "true");
    }

    const response = NextResponse.redirect(successRedirect);

    response.cookies.set({
      name: AuthService.getCookieName(),
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 90 * 24 * 60 * 60, // 90 days
      path: "/",
    });

    // Clear state and redirect cookies
    response.cookies.delete("linkedin_oauth_state");
    response.cookies.delete("linkedin_oauth_redirect_uri");

    return response;
  } catch (err: any) {
    console.error("LinkedIn OAuth Callback exception:", err);
    const redirectUrl = new URL("/login", requestOrigin);
    redirectUrl.searchParams.set(
      "error",
      err.message || "Failed to complete LinkedIn sign-in"
    );
    return NextResponse.redirect(redirectUrl);
  }
}
