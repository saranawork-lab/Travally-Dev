import db from "@/lib/db";

/**
 * Strips all non-digit characters from a phone number string.
 */
export function extractDigits(phone: string): string {
  return String(phone || "").replace(/[^0-9]/g, "");
}

/**
 * Checks if a given phone number is already registered to another user.
 * Matches against the last 10 digits to accommodate country code variations (+91, 0, etc.).
 */
async function isPhoneNumberRegistered(
  phoneNumber: string,
  excludeUserId?: string
): Promise<{ isTaken: boolean; existingUserId?: string }> {
  if (!phoneNumber || typeof phoneNumber !== "string") {
    return { isTaken: false };
  }

  const clean = extractDigits(phoneNumber);
  if (clean.length < 10) {
    return { isTaken: false };
  }

  const last10 = clean.slice(-10);

  // 1. Direct contains query on connectionPreferences
  try {
    const candidateProfiles = await db.profile.findMany({
      where: {
        connectionPreferences: {
          contains: last10,
        },
      },
      select: {
        userId: true,
        connectionPreferences: true,
      },
    });

    for (const p of candidateProfiles) {
      if (excludeUserId && p.userId === excludeUserId) continue;
      try {
        const parsed =
          typeof p.connectionPreferences === "string"
            ? JSON.parse(p.connectionPreferences)
            : p.connectionPreferences;
        const pDigits = extractDigits(parsed?.phoneNumber || "");
        if (pDigits.length >= 10 && pDigits.endsWith(last10)) {
          return { isTaken: true, existingUserId: p.userId };
        }
      } catch {}
    }
  } catch (err) {
    console.warn("Candidate profile contains search error:", err);
  }

  // 2. Resilient fallback scan of profiles
  try {
    const allProfiles = await db.profile.findMany({
      select: {
        userId: true,
        connectionPreferences: true,
      },
      take: 1000,
    });

    for (const p of allProfiles) {
      if (excludeUserId && p.userId === excludeUserId) continue;
      try {
        const parsed =
          typeof p.connectionPreferences === "string"
            ? JSON.parse(p.connectionPreferences)
            : p.connectionPreferences;
        const pDigits = extractDigits(parsed?.phoneNumber || "");
        if (pDigits.length >= 10 && pDigits.endsWith(last10)) {
          return { isTaken: true, existingUserId: p.userId };
        }
      } catch {}
    }
  } catch (err) {
    console.error("Profile scan fallback error:", err);
  }

  return { isTaken: false };
}

/**
 * Finds a user account by either email address or phone number.
 */
export async function findUserByIdentifier(identifier: string) {
  if (!identifier || typeof identifier !== "string") return null;
  const trimmed = identifier.trim();

  // 1. If it contains '@', search by email first
  if (trimmed.includes("@")) {
    const user = await db.user.findUnique({
      where: { email: trimmed.toLowerCase() },
      include: { profile: true },
    });
    if (user) return user;
  }

  // 2. Try looking up by phone number (last 10 digits)
  const clean = extractDigits(trimmed);
  if (clean.length >= 10) {
    const last10 = clean.slice(-10);

    // Search by contains
    try {
      const candidates = await db.profile.findMany({
        where: {
          connectionPreferences: {
            contains: last10,
          },
        },
        include: { user: true },
      });

      for (const p of candidates) {
        try {
          const parsed =
            typeof p.connectionPreferences === "string"
              ? JSON.parse(p.connectionPreferences)
              : p.connectionPreferences;
          const pDigits = extractDigits(parsed?.phoneNumber || "");
          if (pDigits.length >= 10 && pDigits.endsWith(last10)) {
            if (p.user) return { ...p.user, profile: p };
            const fullUser = await db.user.findUnique({
              where: { id: p.userId },
              include: { profile: true },
            });
            if (fullUser) return fullUser;
          }
        } catch {}
      }
    } catch (err) {
      console.warn("Error finding candidate profiles by phone:", err);
    }

    // Fallback scan
    try {
      const allProfiles = await db.profile.findMany({
        include: { user: true },
        take: 1000,
      });

      for (const p of allProfiles) {
        try {
          const parsed =
            typeof p.connectionPreferences === "string"
              ? JSON.parse(p.connectionPreferences)
              : p.connectionPreferences;
          const pDigits = extractDigits(parsed?.phoneNumber || "");
          if (pDigits.length >= 10 && pDigits.endsWith(last10)) {
            if (p.user) return { ...p.user, profile: p };
            const fullUser = await db.user.findUnique({
              where: { id: p.userId },
              include: { profile: true },
            });
            if (fullUser) return fullUser;
          }
        } catch {}
      }
    } catch (err) {
      console.error("Profile scan fallback error:", err);
    }
  }

  // 3. Fallback: Search by email even if without @
  try {
    const user = await db.user.findUnique({
      where: { email: trimmed.toLowerCase() },
      include: { profile: true },
    });
    if (user) return user;
  } catch {}

  return null;
}
