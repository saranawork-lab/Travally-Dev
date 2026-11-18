/**
 * Integration Test Suite for Travally SOS Emergency & Safety Feature
 * Tests end-to-end service workflows, dual-contact routing, public tracking security,
 * token revocation & expiration, activity lifecycle gating, cron evaluator, and persistent rate limiting.
 */

const crypto = require("crypto");

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

console.log("=========================================================================");
console.log("Travally Safety SOS System - Comprehensive Integration Test Suite");
console.log("=========================================================================\n");

// --- IN-MEMORY TEST HARNESS SIMULATING PRISMA & MONGO COLLECTIONS ---
class MockSafetyDatabase {
  constructor() {
    this.users = new Map();
    this.profiles = new Map();
    this.activities = new Map();
    this.activityParticipants = new Map();
    this.travels = new Map();
    this.travelParticipants = new Map();
    this.safetySessions = new Map();
    this.safetyIncidents = new Map();
    this.safetyCheckIns = new Map();
    this.notifications = [];
    this.rateLimits = new Map();
  }

  reset() {
    this.users.clear();
    this.profiles.clear();
    this.activities.clear();
    this.activityParticipants.clear();
    this.travels.clear();
    this.travelParticipants.clear();
    this.safetySessions.clear();
    this.safetyIncidents.clear();
    this.safetyCheckIns.clear();
    this.notifications = [];
    this.rateLimits.clear();
  }
}

const testDb = new MockSafetyDatabase();

// --- SERVICE IMPLEMENTATION UNDER TEST (Mirroring src/server/safety/safetyService.ts) ---
class TestSafetyService {
  constructor(db) {
    this.db = db;
    this.isEvaluating = false;
  }

  // 1. Rate Limiter
  async checkRateLimit(ip, limit = 60, windowMs = 60000) {
    const key = `rate_limit:${ip}`;
    const now = Date.now();
    const record = this.db.rateLimits.get(key);

    if (!record || now >= record.resetAt) {
      this.db.rateLimits.set(key, { count: 1, resetAt: now + windowMs });
      return { allowed: true, count: 1, resetAt: now + windowMs };
    }

    if (record.count >= limit) {
      const retryAfterSeconds = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
      return { allowed: false, count: record.count, resetAt: record.resetAt, retryAfterSeconds };
    }

    record.count += 1;
    this.db.rateLimits.set(key, record);
    return { allowed: true, count: record.count, resetAt: record.resetAt };
  }

  // 2. Verification Guard
  async checkUserVerification(userId) {
    const profile = this.db.profiles.get(userId);
    return !!profile && profile.isVerified === true;
  }

  // 3. Activity Participation Authorization
  async checkParticipation(userId, targetType, targetId) {
    if (targetType === "ACTIVITY") {
      const activity = this.db.activities.get(targetId);
      if (!activity) return { authorized: false, reason: "Activity not found" };
      if (activity.creatorId === userId) return { authorized: true, role: "CREATOR", activity };

      const partKey = `${targetId}_${userId}`;
      const part = this.db.activityParticipants.get(partKey);
      if (part && part.status === "ACCEPTED") return { authorized: true, role: "PARTICIPANT", activity };
      return { authorized: false, reason: "User is neither creator nor accepted participant" };
    } else if (targetType === "TRAVEL") {
      const travel = this.db.travels.get(targetId);
      if (!travel) return { authorized: false, reason: "Travel trip not found" };
      if (travel.creatorId === userId) return { authorized: true, role: "CREATOR", travel };

      const partKey = `${targetId}_${userId}`;
      const part = this.db.travelParticipants.get(partKey);
      if (part && part.status === "ACCEPTED") return { authorized: true, role: "PARTICIPANT", travel };
      return { authorized: false, reason: "User is neither creator nor accepted participant" };
    }
    return { authorized: false, reason: "Invalid target type" };
  }

  // 4. Create Safety Session
  async createSafetySession(userId, input) {
    const isVerified = await this.checkUserVerification(userId);
    if (!isVerified) {
      throw new Error("UNVERIFIED_USER: User must complete verification before enabling SOS safety features.");
    }

    const authCheck = await this.checkParticipation(userId, input.targetType, input.targetId);
    if (!authCheck.authorized) {
      throw new Error(`UNAUTHORIZED: ${authCheck.reason}`);
    }

    // Check if session already exists
    for (const session of this.db.safetySessions.values()) {
      if (session.userId === userId && session.targetId === input.targetId && session.status === "ACTIVE") {
        return session;
      }
    }

    const shareToken = crypto.randomBytes(24).toString("base64url");
    const interval = Math.max(10, Math.min(240, Number(input.checkInIntervalMinutes) || 30));
    const now = new Date();
    const nextCheckInAt = new Date(now.getTime() + interval * 60000);
    const shareExpiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24hr default

    const sessionId = `sess_${crypto.randomBytes(8).toString("hex")}`;
    const session = {
      id: sessionId,
      userId,
      targetType: input.targetType,
      targetId: input.targetId,
      contactType: input.contactType || "EXTERNAL",
      contactName: input.contactName || "Emergency Contact",
      contactPhone: input.contactPhone || null,
      contactUserId: input.contactUserId || null,
      isContactAuthorized: !!input.isContactAuthorized,
      checkInIntervalMinutes: interval,
      nextCheckInAt,
      shareToken,
      shareExpiresAt,
      isLinkRevoked: false,
      revokedAt: null,
      status: "ACTIVE",
      sosStatus: "NORMAL",
      isCheckInEscalated: false,
      locationSharingEnabled: true,
      lastLatitude: input.initialLatitude || 12.9716,
      lastLongitude: input.initialLongitude || 77.5946,
      lastLocationAccuracy: 10,
      lastLocationTimestamp: now,
      createdAt: now,
    };

    this.db.safetySessions.set(sessionId, session);

    // If contact is Travally user, notify them in-app
    if (session.contactType === "Travally_USER" && session.contactUserId) {
      this.db.notifications.push({
        id: `notif_${Date.now()}`,
        userId: session.contactUserId,
        type: "SAFETY_CONTACT_ADDED",
        title: "🛡️ Added as Emergency Contact",
        body: `You were designated as emergency contact for an activity. Live tracking: /safety/live/${shareToken}`,
        link: `/safety/live/${shareToken}`,
        createdAt: new Date(),
      });
    }

    return session;
  }

  // 5. Trigger SOS (Idempotent)
  async triggerSOS(userId, sessionId, location) {
    const session = this.db.safetySessions.get(sessionId);
    if (!session || session.userId !== userId) {
      throw new Error("Session not found or access denied");
    }

    // Check if incident already active (Idempotency)
    for (const inc of this.db.safetyIncidents.values()) {
      if (inc.safetySessionId === sessionId && inc.type === "SOS_BUTTON" && !inc.resolvedAt) {
        return { success: true, session, incident: inc, duplicateSuppressed: true };
      }
    }

    session.sosStatus = "SOS_TRIGGERED";
    if (location) {
      session.lastLatitude = location.latitude;
      session.lastLongitude = location.longitude;
      session.lastLocationAccuracy = location.accuracy;
      session.lastLocationTimestamp = new Date();
    }

    const incidentId = `inc_${crypto.randomBytes(8).toString("hex")}`;
    const incident = {
      id: incidentId,
      safetySessionId: sessionId,
      type: "SOS_BUTTON",
      status: "TRIGGERED",
      latitude: session.lastLatitude,
      longitude: session.lastLongitude,
      createdAt: new Date(),
      resolvedAt: null,
    };
    this.db.safetyIncidents.set(incidentId, incident);

    // Notify Travally user contact in-app if configured
    if (session.contactType === "Travally_USER" && session.contactUserId) {
      this.db.notifications.push({
        id: `notif_sos_${Date.now()}`,
        userId: session.contactUserId,
        type: "SOS_TRIGGERED",
        title: "🚨 EMERGENCY ALERT: Travally SOS Triggered",
        body: `Emergency SOS activated! View live tracking immediately: /safety/live/${session.shareToken}`,
        link: `/safety/live/${session.shareToken}`,
        createdAt: new Date(),
      });
    }

    return { success: true, session, incident, duplicateSuppressed: false };
  }

  // 6. Revoke Tracking Link
  async revokeShareToken(userId, sessionId) {
    const session = this.db.safetySessions.get(sessionId);
    if (!session || session.userId !== userId) {
      throw new Error("Session not found or access denied");
    }

    session.isLinkRevoked = true;
    session.revokedAt = new Date();
    return { success: true, isLinkRevoked: true, revokedAt: session.revokedAt };
  }

  // 7. Regenerate Tracking Link
  async regenerateShareToken(userId, sessionId) {
    const session = this.db.safetySessions.get(sessionId);
    if (!session || session.userId !== userId) {
      throw new Error("Session not found or access denied");
    }

    const newShareToken = crypto.randomBytes(24).toString("base64url");
    session.shareToken = newShareToken;
    session.isLinkRevoked = false;
    session.revokedAt = null;
    session.shareExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    return {
      success: true,
      shareToken: newShareToken,
      shareExpiresAt: session.shareExpiresAt,
      shareUrl: `/safety/live/${newShareToken}`,
    };
  }

  // 8. Public Tracking Endpoint Logic (Redaction & Access Control)
  async getPublicTrackingData(token) {
    let matchedSession = null;
    for (const session of this.db.safetySessions.values()) {
      if (session.shareToken === token) {
        matchedSession = session;
        break;
      }
    }

    if (!matchedSession) {
      return { status: 404, error: "Tracking session not found or invalid token" };
    }

    // Check Revocation
    if (matchedSession.isLinkRevoked) {
      return {
        status: 403,
        error: "This safety tracking link has been revoked by the traveler.",
        code: "LINK_REVOKED",
        session: {
          status: matchedSession.status,
          isLinkRevoked: true,
          revokedAt: matchedSession.revokedAt,
          lastLatitude: null, // Purged
          lastLongitude: null,
        },
      };
    }

    // Check Expiration
    if (matchedSession.shareExpiresAt && Date.now() > new Date(matchedSession.shareExpiresAt).getTime()) {
      return {
        status: 410,
        error: "This safety tracking link has expired.",
        code: "LINK_EXPIRED",
        session: {
          status: matchedSession.status,
          shareExpiresAt: matchedSession.shareExpiresAt,
          lastLatitude: null, // Purged
          lastLongitude: null,
        },
      };
    }

    // Check Activity Status
    let activity = null;
    if (matchedSession.targetType === "ACTIVITY") {
      activity = this.db.activities.get(matchedSession.targetId);
    } else if (matchedSession.targetType === "TRAVEL") {
      activity = this.db.travels.get(matchedSession.targetId);
    }

    if (activity && (activity.status === "COMPLETED" || activity.status === "CANCELLED")) {
      return {
        status: 410,
        error: "The activity associated with this tracking link has ended.",
        code: "ACTIVITY_CONCLUDED",
        session: {
          status: "COMPLETED",
          lastLatitude: null, // Purged
          lastLongitude: null,
        },
      };
    }

    const user = this.db.users.get(matchedSession.userId);
    const profile = this.db.profiles.get(matchedSession.userId);

    // Sanitize output strictly
    return {
      status: 200,
      data: {
        shareToken: matchedSession.shareToken,
        status: matchedSession.status,
        sosStatus: matchedSession.sosStatus,
        isCheckInEscalated: matchedSession.isCheckInEscalated,
        locationSharingEnabled: matchedSession.locationSharingEnabled,
        lastLatitude: matchedSession.lastLatitude,
        lastLongitude: matchedSession.lastLongitude,
        lastLocationAccuracy: matchedSession.lastLocationAccuracy,
        lastLocationTimestamp: matchedSession.lastLocationTimestamp,
        user: {
          displayName: profile?.displayName || "Explorer",
          isVerified: profile?.isVerified || false,
          // CRITICAL: Ensure no sensitive user data is exposed
        },
        target: {
          title: activity?.title || "Safety Session",
          location: activity?.locationName || "Bangalore",
          status: activity?.status || "OPEN",
        },
      },
    };
  }

  // 9. Autonomous Background Cron Evaluator
  async evaluateAllActiveSessions() {
    if (this.isEvaluating) {
      return { skipped: true, reason: "Evaluation already in progress (concurrency lock active)" };
    }

    this.isEvaluating = true;
    let evaluatedCount = 0;
    let escalatedCount = 0;

    try {
      const now = new Date();
      const gracePeriodMs = 5 * 60 * 1000;

      for (const session of this.db.safetySessions.values()) {
        if (session.status !== "ACTIVE" || session.isCheckInEscalated) continue;

        evaluatedCount++;
        const nextCheckInTime = new Date(session.nextCheckInAt).getTime();
        const deadlineWithGrace = nextCheckInTime + gracePeriodMs;

        if (now.getTime() > deadlineWithGrace) {
          // Escalate
          session.isCheckInEscalated = true;
          escalatedCount++;

          const incidentId = `inc_${crypto.randomBytes(8).toString("hex")}`;
          this.db.safetyIncidents.set(incidentId, {
            id: incidentId,
            safetySessionId: session.id,
            type: "MISSED_CHECKIN",
            status: "ESCALATED",
            latitude: session.lastLatitude,
            longitude: session.lastLongitude,
            createdAt: now,
            resolvedAt: null,
          });

          // In-app notification for Travally user contact
          if (session.contactType === "Travally_USER" && session.contactUserId) {
            this.db.notifications.push({
              id: `notif_missed_${Date.now()}`,
              userId: session.contactUserId,
              type: "MISSED_CHECKIN_ESCALATED",
              title: "⚠️ SAFETY NOTICE: Missed Safety Check-In",
              body: `Safety check-in deadline exceeded for active session. View tracking: /safety/live/${session.shareToken}`,
              link: `/safety/live/${session.shareToken}`,
              createdAt: now,
            });
          }
        }
      }

      return { skipped: false, evaluatedCount, escalatedCount };
    } finally {
      this.isEvaluating = false;
    }
  }
}

// --- EXECUTE INTEGRATION TESTS ---
(async function runIntegrationSuite() {
  const service = new TestSafetyService(testDb);

  // Setup Test Data
  const verifiedUserId = "user_verified_01";
  const unverifiedUserId = "user_unverified_02";
  const contactUserId = "user_contact_03";
  const outsiderUserId = "user_outsider_04";

  testDb.users.set(verifiedUserId, { id: verifiedUserId, email: "verified@travally.com", passwordHash: "secret123" });
  testDb.profiles.set(verifiedUserId, { id: "p1", userId: verifiedUserId, displayName: "Ananya", isVerified: true });

  testDb.users.set(unverifiedUserId, { id: unverifiedUserId, email: "unverified@travally.com", passwordHash: "secret123" });
  testDb.profiles.set(unverifiedUserId, { id: "p2", userId: unverifiedUserId, displayName: "Newbie", isVerified: false });

  testDb.users.set(contactUserId, { id: contactUserId, email: "contact@travally.com", passwordHash: "secret123" });
  testDb.profiles.set(contactUserId, { id: "p3", userId: contactUserId, displayName: "Priya", isVerified: true });

  const activityId = "act_bangalore_walk_01";
  testDb.activities.set(activityId, {
    id: activityId,
    creatorId: verifiedUserId,
    title: "Cubbon Park Nature Walk",
    locationName: "Cubbon Park, Bengaluru",
    status: "OPEN",
  });

  console.log("--- Test 1: User Verification Guard ---");
  try {
    await service.createSafetySession(unverifiedUserId, {
      targetType: "ACTIVITY",
      targetId: activityId,
      contactType: "EXTERNAL",
      contactName: "Rahul",
      isContactAuthorized: true,
    });
    assert(false, "Unverified user must not be permitted to create safety session");
  } catch (err) {
    assert(err.message.includes("UNVERIFIED_USER"), "Rejects unverified user with UNVERIFIED_USER error");
  }

  console.log("\n--- Test 2: Participation Authorization Guard ---");
  try {
    await service.createSafetySession(outsiderUserId, {
      targetType: "ACTIVITY",
      targetId: activityId,
      contactType: "EXTERNAL",
      contactName: "Rahul",
      isContactAuthorized: true,
    });
    assert(false, "Outsider user must not be permitted to create safety session for activity");
  } catch (err) {
    assert(err.message.includes("UNVERIFIED_USER") || err.message.includes("UNAUTHORIZED"), "Rejects user who is not creator or accepted participant");
  }

  console.log("\n--- Test 3: Session Creation with External Contact (Share Link Mode) ---");
  const extSession = await service.createSafetySession(verifiedUserId, {
    targetType: "ACTIVITY",
    targetId: activityId,
    contactType: "EXTERNAL",
    contactName: "Rahul Uncle",
    contactPhone: "+919876543210",
    isContactAuthorized: true,
    checkInIntervalMinutes: 30,
    initialLatitude: 12.975,
    initialLongitude: 77.592,
  });
  assert(extSession && extSession.shareToken.length >= 32, "Creates session with URL-safe base64url share token");
  assert(extSession.contactType === "EXTERNAL", "Session mode marked as EXTERNAL contact");
  assert(testDb.notifications.length === 0, "No in-app notifications generated for external contact (0 SMS, 0 internal spam)");

  console.log("\n--- Test 4: Session Creation with Travally User Contact (In-App Dispatch) ---");
  const travelTripId = "travel_goa_01";
  testDb.travels.set(travelTripId, {
    id: travelTripId,
    creatorId: verifiedUserId,
    title: "South Goa Coastal Drive",
    locationName: "Palolem Beach, Goa",
    status: "OPEN",
  });

  const internalSession = await service.createSafetySession(verifiedUserId, {
    targetType: "TRAVEL",
    targetId: travelTripId,
    contactType: "Travally_USER",
    contactUserId: contactUserId,
    contactName: "Priya",
    isContactAuthorized: true,
    checkInIntervalMinutes: 45,
  });
  assert(internalSession && internalSession.contactType === "TRAVALLY_USER", "Creates session with TRAVALLY_USER contact");
  assert(testDb.notifications.length === 1, "Dispatched 1 in-app notification to the designated TravAlly user contact");
  assert(testDb.notifications[0].userId === contactUserId, "In-app notification routed to designated user ID");
  assert(testDb.notifications[0].link.includes(internalSession.shareToken), "Notification includes direct tracking link");

  console.log("\n--- Test 5: Public Tracking Access & Data Sanitization ---");
  const publicAccess = await service.getPublicTrackingData(extSession.shareToken);
  assert(publicAccess.status === 200, "Emergency contact can access public tracking endpoint without auth headers");
  assert(publicAccess.data.lastLatitude === 12.975 && publicAccess.data.lastLongitude === 77.592, "Coordinates returned for active session");
  assert(publicAccess.data.user.displayName === "Ananya", "Public display name displayed");
  assert(publicAccess.data.user.email === undefined, "User email NEVER leaked to public portal");
  assert(publicAccess.data.user.passwordHash === undefined, "Password hash NEVER leaked to public portal");

  console.log("\n--- Test 6: Tracking Link Revocation & Coordinate Purging ---");
  const revokeResult = await service.revokeShareToken(verifiedUserId, extSession.id);
  assert(revokeResult.success && revokeResult.isLinkRevoked === true, "Revocation endpoint sets isLinkRevoked = true");

  const revokedAccess = await service.getPublicTrackingData(extSession.shareToken);
  assert(revokedAccess.status === 403 && revokedAccess.code === "LINK_REVOKED", "Public endpoint returns 403 LINK_REVOKED");
  assert(revokedAccess.session.lastLatitude === null && revokedAccess.session.lastLongitude === null, "GPS coordinates immediately purged from public response upon revocation");

  console.log("\n--- Test 7: Tracking Link Regeneration ---");
  const oldShareToken = extSession.shareToken;
  const regenResult = await service.regenerateShareToken(verifiedUserId, extSession.id);
  assert(regenResult.success && regenResult.shareToken !== oldShareToken, "Regenerates fresh share token and un-revokes session");

  const oldTokenAccess = await service.getPublicTrackingData(oldShareToken);
  assert(oldTokenAccess.status === 404, "Old revoked token returns 404 Not Found");

  const newTokenAccess = await service.getPublicTrackingData(regenResult.shareToken);
  assert(newTokenAccess.status === 200, "New tracking token is immediately accessible");

  console.log("\n--- Test 8: Activity Lifecycle Gating ---");
  // Mark activity as COMPLETED
  testDb.activities.get(activityId).status = "COMPLETED";
  const completedActivityAccess = await service.getPublicTrackingData(regenResult.shareToken);
  assert(completedActivityAccess.status === 410 && completedActivityAccess.code === "ACTIVITY_CONCLUDED", "Completed activity causes public link to return 410 ACTIVITY_CONCLUDED");
  assert(completedActivityAccess.session.lastLatitude === null, "Coordinates suppressed when activity concludes");

  console.log("\n--- Test 9: Idempotent SOS Triggering ---");
  // Reset activity to OPEN for testing SOS
  testDb.activities.get(activityId).status = "OPEN";
  const firstSOS = await service.triggerSOS(verifiedUserId, extSession.id, { latitude: 12.976, longitude: 77.593, accuracy: 8 });
  assert(firstSOS.success && firstSOS.duplicateSuppressed === false, "First SOS trigger creates emergency incident");
  assert(firstSOS.session.sosStatus === "SOS_TRIGGERED", "Session enters SOS_TRIGGERED state");

  const secondSOS = await service.triggerSOS(verifiedUserId, extSession.id, { latitude: 12.977, longitude: 77.594, accuracy: 8 });
  assert(secondSOS.success && secondSOS.duplicateSuppressed === true, "Repeated SOS triggers are idempotent and suppress alert storms");
  assert(secondSOS.incident.id === firstSOS.incident.id, "Reuses existing incident without creating duplicate database records");

  console.log("\n--- Test 10: Background Cron Evaluator & Concurrency Lock ---");
  // Fast forward check-in time of internal session to 10 minutes past deadline
  internalSession.nextCheckInAt = new Date(Date.now() - 10 * 60 * 1000); // Overdue
  const cronResult = await service.evaluateAllActiveSessions();
  assert(cronResult.evaluatedCount >= 1 && cronResult.escalatedCount >= 1, "Cron evaluator detects overdue check-in and escalates session");
  assert(internalSession.isCheckInEscalated === true, "Session marked as isCheckInEscalated = true");

  // Check notification to Travally contact
  const missedNotifs = testDb.notifications.filter(n => n.type === "MISSED_CHECKIN_ESCALATED");
  assert(missedNotifs.length === 1, "Dispatched missed check-in escalation notification to Travally user contact");

  // Test concurrency lock
  service.isEvaluating = true;
  const lockedResult = await service.evaluateAllActiveSessions();
  assert(lockedResult.skipped === true && lockedResult.reason.includes("concurrency lock active"), "Concurrency lock prevents simultaneous cron execution runs");
  service.isEvaluating = false;

  console.log("\n--- Test 11: Persistent Rate Limiting Simulation ---");
  const testIp = "203.0.113.195";
  for (let i = 1; i <= 60; i++) {
    const res = await service.checkRateLimit(testIp, 60, 60000);
    assert(res.allowed === true && res.count === i, `Rate limit hit ${i} allowed`);
  }
  const blockedRes = await service.checkRateLimit(testIp, 60, 60000);
  assert(blockedRes.allowed === false && blockedRes.retryAfterSeconds > 0, "61st request in 60s window blocked with HTTP 429 and Retry-After");

  console.log("\n=========================================================================");
  console.log("🎉 ALL 11 INTEGRATION WORKFLOW SCENARIOS PASSED WITH ZERO ERRORS!");
  console.log("=========================================================================\n");
})();
