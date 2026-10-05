import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import crypto from "crypto";
import db from "./db";

const JWT_SECRET = process.env.JWT_SECRET || "travally-fallback-secret-for-dev";
const COOKIE_NAME = "travally_session";

export interface SessionUser {
  id: string;
  email: string;
  role: string;
  displayName: string;
  avatarUrl: string | null;
  isVerified: boolean;
  verificationStatus: string;
  city: string | null;
  joinRank?: number;
  membershipNumber?: string | null;
}

export function signToken(payload: {
  userId: string;
  email: string;
  role: string;
  sessionToken?: string;
}): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "90d" });
}

function verifyToken(token: string): {
  userId: string;
  email: string;
  role: string;
  sessionToken?: string;
} | null {
  try {
    return jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      role: string;
      sessionToken?: string;
    };
  } catch {
    return null;
  }
}

export function isValidObjectId(id?: string | null): boolean {
  if (!id || typeof id !== "string") return false;
  return /^[0-9a-fA-F]{24}$/.test(id);
}

/**
 * Creates and persists a new unique activeSessionToken for the user,
 * invalidating any older active sessions on other browsers or devices.
 */
export async function createActiveSession(userId: string): Promise<string> {
  const sessionToken = crypto.randomUUID();
  try {
    await db.user.update({
      where: { id: userId },
      data: { activeSessionToken: sessionToken } as any,
    });
  } catch (e: any) {
    console.warn("Could not set activeSessionToken in DB:", e?.message);
  }
  return sessionToken;
}

/**
 * Retrieves the current session user from HTTP-only cookie.
 * Validates single-active-session by matching sessionToken with database.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId || !isValidObjectId(decoded.userId)) {
      return null;
    }

    let user: any = null;
    try {
      user = await db.user.findUnique({
        where: { id: decoded.userId },
        include: { profile: true },
      });

      if (!user) {
        return null;
      }

      // ── SINGLE ACTIVE SESSION ENFORCEMENT ──
      // If user has an activeSessionToken in DB and this session token doesn't match,
      // it means a newer login occurred on another device/browser. Invalidate older session!
      if (user.activeSessionToken && decoded.sessionToken !== user.activeSessionToken) {
        console.log(
          `[SingleSession] Session invalidated for user ${user.id} - active login detected on another device/browser.`
        );
        return null;
      }
    } catch (dbError: any) {
      if (dbError?.message?.includes("Malformed ObjectID")) {
        return null;
      }
      console.warn(
        "DB lookup error in getCurrentUser, falling back to session token:",
        dbError?.message
      );
      return {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        displayName: decoded.email.split("@")[0],
        avatarUrl: null,
        isVerified: true,
        verificationStatus: "VERIFIED",
        city: null,
      };
    }

    let joinRank = 365;
    try {
      const rawCount = await db.user.count({
        where: { createdAt: { lte: user.createdAt } },
      });
      joinRank = 364 + (rawCount || 1);
    } catch {
      joinRank = 365;
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      displayName: user.profile?.displayName || user.email.split("@")[0],
      avatarUrl: user.profile?.avatarUrl || null,
      isVerified: user.profile?.isVerified || false,
      verificationStatus: user.profile?.verificationStatus || "UNVERIFIED",
      city: user.profile?.city || null,
      joinRank,
      membershipNumber:
        user.profile?.membershipNumber || `TRV-${String(joinRank).padStart(4, "0")}`,
    };
  } catch (error: any) {
    if (
      error?.digest === "DYNAMIC_SERVER_USAGE" ||
      error?.name === "DynamicServerError" ||
      error?.message?.includes("DYNAMIC_SERVER_USAGE")
    ) {
      throw error;
    }
    if (error?.message?.includes("Malformed ObjectID")) {
      return null;
    }
    console.error("Error in getCurrentUser:", error);
    return null;
  }
}

/**
 * Authentication service abstraction layer.
 * Pre-configured for local JWT sessions, with interfaces ready for Supabase or external SSO.
 */
export const AuthService = {
  getCookieName: () => COOKIE_NAME,
  getProvider: () => process.env.AUTH_PROVIDER || "local",
};
