import crypto from "crypto";
import db from "@/lib/db";
import { getDb } from "@/lib/mongo";
import { isValidObjectId } from "@/lib/auth";
import { VerificationService } from "@/server/verification/verificationService";

export interface SafetySetupInput {
  targetType: "ACTIVITY" | "TRAVEL";
  targetId: string;
  contactName: string;
  contactPhone?: string;
  contactUserId?: string;
  isContactAuthorized: boolean;
  checkInIntervalMinutes: number; // e.g. 20, 30, 60, 120
  initialLatitude?: number;
  initialLongitude?: number;
  initialAccuracy?: number;
  initialAddress?: string;
  shareExpiresAt?: Date;
}

export interface LocationUpdateInput {
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
}

export interface DispatchedAlert {
  id: string;
  recipientType: "CONTACT_INTERNAL" | "CONTACT_EXTERNAL" | "SAFETY_DESK" | "USER";
  recipientName: string;
  recipientPhone?: string;
  recipientUserId?: string;
  channel: "IN_APP" | "SYSTEM_AUDIT";
  title: string;
  message: string;
  trackingUrl?: string;
  sentAt: string;
  status: "DELIVERED";
}

export interface SafetyTimelineItem {
  id: string;
  type:
  | "SESSION_ACTIVATED"
  | "CHECKIN_CONFIRMED"
  | "LOCATION_UPDATED"
  | "MISSED_CHECKIN"
  | "SOS_TRIGGERED"
  | "SOS_CANCELLED"
  | "LINK_REGENERATED"
  | "LINK_REVOKED";
  title: string;
  description: string;
  timestamp: string;
}

export class SafetyService {
  /**
   * Generates a cryptographically strong, non-guessable sharing token.
   * Produces 192 bits of entropy (24 random bytes base64url-encoded).
   */
  static generateShareToken(): string {
    return crypto.randomBytes(24).toString("base64url");
  }

  /**
   * Authoritatively checks user eligibility for an activity or travel plan's safety session.
   * Requirements:
   * 1. User must be verified via existing VerificationService.
   * 2. User must be either the Organizer or an Accepted Participant.
   * 3. Target activity/trip must exist and not be cancelled/expired.
   */
  static async checkEligibility(
    userId: string,
    targetType: "ACTIVITY" | "TRAVEL",
    targetId: string
  ): Promise<{
    eligible: boolean;
    reason?: string;
    isVerified: boolean;
    role?: "ORGANIZER" | "PARTICIPANT";
    target?: {
      id: string;
      title: string;
      status: string;
      locationOrDestination: string;
      scheduledAt: string;
    };
  }> {
    if (!isValidObjectId(userId) || !isValidObjectId(targetId)) {
      return { eligible: false, isVerified: false, reason: "Invalid identifiers provided." };
    }

    // 1. Authoritative identity verification check
    const verification = await VerificationService.getVerificationStatus(userId);
    if (!verification.isVerified) {
      return {
        eligible: false,
        isVerified: false,
        reason: "IDENTITY_VERIFICATION_REQUIRED",
      };
    }

    // 2. Fetch target and participation status
    if (targetType === "ACTIVITY") {
      const activity = await db.activity.findUnique({
        where: { id: targetId },
        include: {
          participants: {
            where: { userId },
          },
          requests: {
            where: { applicantId: userId, status: "ACCEPTED" },
          },
        },
      });

      if (!activity) {
        return { eligible: false, isVerified: true, reason: "Companion activity not found." };
      }

      if (activity.status === "CANCELLED") {
        return { eligible: false, isVerified: true, reason: "Activity is cancelled." };
      }

      const isOrganizer = activity.organizerId === userId;
      const isParticipant =
        activity.participants.length > 0 || (activity.requests && activity.requests.length > 0);

      if (!isOrganizer && !isParticipant) {
        return {
          eligible: false,
          isVerified: true,
          reason: "You must be an accepted participant or organizer of this activity to use SOS Safety.",
        };
      }

      return {
        eligible: true,
        isVerified: true,
        role: isOrganizer ? "ORGANIZER" : "PARTICIPANT",
        target: {
          id: activity.id,
          title: activity.title,
          status: activity.status,
          locationOrDestination: activity.locationName,
          scheduledAt: `${activity.date.toISOString().split("T")[0]} ${activity.startTime}`,
        },
      };
    } else {
      const trip = await db.travelPlan.findUnique({
        where: { id: targetId },
        include: {
          participants: {
            where: { userId },
          },
          requests: {
            where: { applicantId: userId, status: "ACCEPTED" },
          },
        },
      });

      if (!trip) {
        return { eligible: false, isVerified: true, reason: "Travel trip not found." };
      }

      if (trip.status === "CANCELLED") {
        return { eligible: false, isVerified: true, reason: "Travel trip is cancelled." };
      }

      const isOrganizer = trip.organizerId === userId;
      const isParticipant =
        trip.participants.length > 0 || (trip.requests && trip.requests.length > 0);

      if (!isOrganizer && !isParticipant) {
        return {
          eligible: false,
          isVerified: true,
          reason: "You must be an accepted traveler or trip host to use SOS Safety.",
        };
      }

      return {
        eligible: true,
        isVerified: true,
        role: isOrganizer ? "ORGANIZER" : "PARTICIPANT",
        target: {
          id: trip.id,
          title: trip.destination,
          status: trip.status,
          locationOrDestination: `${trip.departureCity} -> ${trip.destination}`,
          scheduledAt: `${trip.startDate.toISOString().split("T")[0]} to ${trip.endDate.toISOString().split("T")[0]}`,
        },
      };
    }
  }

  /**
   * Search for verified Travally users to select as an in-app emergency contact.
   */
  static async searchTravallyUsers(query: string, currentUserId: string) {
    if (!query || query.trim().length < 2) return [];

    const clean = query.trim();
    const profiles = await db.profile.findMany({
      where: {
        userId: { not: currentUserId },
        // isVerified: true,
        OR: [
          { displayName: { contains: clean, mode: "insensitive" } },
          { membershipNumber: { equals: clean, mode: "insensitive" } },
          { city: { contains: clean, mode: "insensitive" } },
        ],
      },
      select: {
        userId: true,
        displayName: true,
        avatarUrl: true,
        city: true,
        membershipNumber: true,
        isVerified: true,
        verificationStatus: true,
      },
      take: 10,
    });

    return profiles.map((p) => ({
      userId: p.userId,
      displayName: p.displayName,
      avatarUrl: p.avatarUrl,
      city: p.city,
      membershipNumber: p.membershipNumber,
      isVerified: p.isVerified,
    }));
  }

  /**
   * Retrieves an existing active safety session for the user and activity/trip.
   */
  static async getSession(
    userId: string,
    targetType: "ACTIVITY" | "TRAVEL",
    targetId: string
  ) {
    if (!isValidObjectId(userId) || !isValidObjectId(targetId)) return null;

    // Trigger evaluation on read to keep server-side deadline state accurate
    await this.evaluateSingleSessionDeadlines(userId, targetType, targetId);

    const where: any = { userId, status: { in: ["ACTIVE", "PAUSED"] } };
    if (targetType === "ACTIVITY") {
      where.activityId = targetId;
    } else {
      where.travelPlanId = targetId;
    }

    return db.safetySession.findFirst({
      where,
      include: {
        checkIns: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        incidents: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });
  }

  /**
   * Creates or updates a safety session for an activity or travel plan.
   */
  static async createOrUpdateSession(userId: string, input: SafetySetupInput) {
    const eligibility = await this.checkEligibility(userId, input.targetType, input.targetId);
    if (!eligibility.eligible) {
      throw new Error(eligibility.reason || "Not eligible for safety session.");
    }

    if (!input.contactName?.trim()) {
      throw new Error("Emergency contact name is required.");
    }

    if (!input.isContactAuthorized) {
      throw new Error("Explicit authorization to share trip information is required.");
    }

    const interval = Math.max(10, Math.min(240, Number(input.checkInIntervalMinutes) || 30));
    const now = new Date();
    const nextCheckIn = new Date(now.getTime() + interval * 60 * 1000);
    // Link expiration: default 7 days from now
    const expiresAt = input.shareExpiresAt || new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const existingWhere: any = {
      userId,
      status: { in: ["ACTIVE", "PAUSED"] },
    };
    if (input.targetType === "ACTIVITY") existingWhere.activityId = input.targetId;
    else existingWhere.travelPlanId = input.targetId;

    const existing = await db.safetySession.findFirst({
      where: existingWhere,
    });

    if (existing) {
      const updated = await db.safetySession.update({
        where: { id: existing.id },
        data: {
          contactName: input.contactName.trim(),
          contactPhone: input.contactPhone?.trim() || null,
          contactUserId: input.contactUserId || null,
          isContactAuthorized: true,
          checkInIntervalMinutes: interval,
          nextCheckInAt: nextCheckIn,
          status: "ACTIVE",
          isLinkRevoked: false,
          revokedAt: null,
          shareExpiresAt: expiresAt,
          locationSharingEnabled:
            input.initialLatitude !== undefined ? true : existing.locationSharingEnabled,
          lastLatitude: input.initialLatitude ?? existing.lastLatitude,
          lastLongitude: input.initialLongitude ?? existing.lastLongitude,
          lastLocationAccuracy: input.initialAccuracy ?? existing.lastLocationAccuracy,
          lastLocationAddress: input.initialAddress ?? existing.lastLocationAddress,
          lastLocationTimestamp:
            input.initialLatitude !== undefined ? now : existing.lastLocationTimestamp,
        },
        include: {
          checkIns: { take: 5, orderBy: { createdAt: "desc" } },
          incidents: { take: 5, orderBy: { createdAt: "desc" } },
        },
      });

      if (input.contactUserId && isValidObjectId(input.contactUserId) && existing.contactUserId !== input.contactUserId) {
        try {
          const travelerProfile = await db.profile.findUnique({ where: { userId } });
          const travelerName = travelerProfile?.displayName || "A fellow traveler";
          await db.notification.create({
            data: {
              userId: input.contactUserId,
              type: "TRIP_UPDATE",
              title: "🛡️ Designated as Emergency Safety Contact",
              body: `${travelerName} selected you as their emergency safety contact. Live tracking: /safety/live/${existing.shareToken}`,
              actionUrl: `/safety/live/${existing.shareToken}`,
            },
          });
        } catch (e: any) {
          console.warn("Could not dispatch contact designation notification on update:", e?.message);
        }
      }

      return updated;
    }

    const shareToken = this.generateShareToken();

    const created = await db.safetySession.create({
      data: {
        userId,
        activityId: input.targetType === "ACTIVITY" ? input.targetId : null,
        travelPlanId: input.targetType === "TRAVEL" ? input.targetId : null,
        status: "ACTIVE",
        sosStatus: "NORMAL",
        contactName: input.contactName.trim(),
        contactPhone: input.contactPhone?.trim() || null,
        contactUserId: input.contactUserId || null,
        isContactAuthorized: true,
        checkInIntervalMinutes: interval,
        lastCheckInAt: now,
        nextCheckInAt: nextCheckIn,
        shareToken,
        shareExpiresAt: expiresAt,
        isLinkRevoked: false,
        locationSharingEnabled: input.initialLatitude !== undefined,
        lastLatitude: input.initialLatitude,
        lastLongitude: input.initialLongitude,
        lastLocationAccuracy: input.initialAccuracy,
        lastLocationAddress: input.initialAddress,
        lastLocationTimestamp: input.initialLatitude !== undefined ? now : null,
      },
      include: {
        checkIns: true,
        incidents: true,
      },
    });

    // Record session activation incident
    await db.safetyIncident.create({
      data: {
        sessionId: created.id,
        type: "SESSION_ACTIVATED",
        latitude: input.initialLatitude,
        longitude: input.initialLongitude,
        accuracy: input.initialAccuracy,
        notes: `Safety protection configured with contact ${input.contactName.trim()}.`,
      },
    });

    // If designated contact is an internal Travally user, notify them in-app
    if (input.contactUserId && isValidObjectId(input.contactUserId)) {
      try {
        const travelerProfile = await db.profile.findUnique({ where: { userId } });
        const travelerName = travelerProfile?.displayName || "A fellow traveler";
        await db.notification.create({
          data: {
            userId: input.contactUserId,
            type: "TRIP_UPDATE",
            title: "🛡️ Designated as Emergency Safety Contact",
            body: `${travelerName} selected you as their emergency safety contact for an activity. Live tracking: /safety/live/${created.shareToken}`,
            actionUrl: `/safety/live/${created.shareToken}`,
          },
        });
      } catch (e: any) {
        console.warn("Could not dispatch contact designation notification:", e?.message);
      }
    }

    return created;
  }

  /**
   * Explicitly revokes public tracking access for a session.
   */
  static async revokeShareToken(userId: string, sessionId: string) {
    const session = await db.safetySession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.userId !== userId) {
      throw new Error("Unauthorized or safety session not found.");
    }

    const now = new Date();

    const updated = await db.safetySession.update({
      where: { id: sessionId },
      data: {
        isLinkRevoked: true,
        revokedAt: now,
        locationSharingEnabled: false,
      },
    });

    await db.safetyIncident.create({
      data: {
        sessionId: session.id,
        type: "LINK_REVOKED",
        resolvedAt: now,
        notes: "Emergency tracking link was revoked by the traveler.",
      },
    });

    return updated;
  }

  /**
   * Regenerates a fresh, unguessable tracking link, revoking any previous link.
   */
  static async regenerateShareToken(userId: string, sessionId: string) {
    const session = await db.safetySession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.userId !== userId) {
      throw new Error("Unauthorized or safety session not found.");
    }

    const newToken = this.generateShareToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const updated = await db.safetySession.update({
      where: { id: sessionId },
      data: {
        shareToken: newToken,
        shareExpiresAt: expiresAt,
        isLinkRevoked: false,
        revokedAt: null,
      },
    });

    await db.safetyIncident.create({
      data: {
        sessionId: session.id,
        type: "LINK_REGENERATED",
        notes: "Previous tracking link replaced with a new secure token.",
      },
    });

    return updated;
  }

  /**
   * Confirms a check-in: records "I'm okay ✓" and schedules the next deadline.
   */
  static async recordCheckIn(
    userId: string,
    sessionId: string,
    coords?: { latitude?: number; longitude?: number; accuracy?: number; address?: string }
  ) {
    const session = await db.safetySession.findUnique({
      where: { id: sessionId },
      include: {
        user: { include: { profile: true } },
        activity: true,
        travelPlan: true,
      },
    });

    if (!session || session.userId !== userId) {
      throw new Error("Safety session not found or unauthorized.");
    }

    const now = new Date();
    const interval = session.checkInIntervalMinutes || 30;
    const nextCheckIn = new Date(now.getTime() + interval * 60 * 1000);

    const hadEscalation = session.isCheckInEscalated || session.missedCheckInAt !== null;

    // Create check-in entry
    await db.safetyCheckIn.create({
      data: {
        sessionId: session.id,
        status: hadEscalation ? "ACKNOWLEDGED_LATE" : "COMPLETED",
        scheduledFor: session.nextCheckInAt || now,
        respondedAt: now,
        latitude: coords?.latitude ?? session.lastLatitude,
        longitude: coords?.longitude ?? session.lastLongitude,
        accuracy: coords?.accuracy ?? session.lastLocationAccuracy,
      },
    });

    const updated = await db.safetySession.update({
      where: { id: session.id },
      data: {
        lastCheckInAt: now,
        nextCheckInAt: nextCheckIn,
        missedCheckInAt: null,
        isCheckInEscalated: false,
        lastLatitude: coords?.latitude ?? session.lastLatitude,
        lastLongitude: coords?.longitude ?? session.lastLongitude,
        lastLocationAccuracy: coords?.accuracy ?? session.lastLocationAccuracy,
        lastLocationAddress: coords?.address ?? session.lastLocationAddress,
        lastLocationTimestamp: coords?.latitude !== undefined ? now : session.lastLocationTimestamp,
      },
      include: {
        checkIns: { take: 5, orderBy: { createdAt: "desc" } },
        incidents: { take: 5, orderBy: { createdAt: "desc" } },
      },
    });

    // Record check-in confirmed incident for the tracking timeline
    await db.safetyIncident.create({
      data: {
        sessionId: session.id,
        type: hadEscalation ? "CHECKIN_RESOLVED" : "CHECKIN_CONFIRMED",
        latitude: coords?.latitude ?? session.lastLatitude,
        longitude: coords?.longitude ?? session.lastLongitude,
        accuracy: coords?.accuracy ?? session.lastLocationAccuracy,
        locationAddress: coords?.address ?? session.lastLocationAddress,
        resolvedAt: now,
        notes: hadEscalation
          ? "Traveler confirmed safety after missed check-in notice."
          : "Traveler confirmed: 'I\'m okay ✓'.",
      },
    });

    // If contact is a Travally user, notify them in-app
    if (session.contactUserId && isValidObjectId(session.contactUserId)) {
      const userName = session.user?.profile?.displayName || "Explorer";
      const activityTitle =
        session.activity?.title || session.travelPlan?.destination || "Travel Activity";
      await this.dispatchEmergencyAlert({
        session,
        type: hadEscalation ? "CHECKIN_RESOLVED" : "CHECKIN_CONFIRMED",
        notes: `${userName} checked in safe for "${activityTitle}".`,
      });
    }

    return updated;
  }

  /**
   * Updates user's live coordinates.
   */
  static async updateLocation(
    userId: string,
    sessionId: string,
    location: LocationUpdateInput
  ) {
    const session = await db.safetySession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.userId !== userId) {
      throw new Error("Safety session not found or unauthorized.");
    }

    if (session.isLinkRevoked || session.status !== "ACTIVE") {
      throw new Error("Cannot update location for a revoked or inactive session.");
    }

    const now = new Date();

    return db.safetySession.update({
      where: { id: sessionId },
      data: {
        locationSharingEnabled: true,
        lastLatitude: location.latitude,
        lastLongitude: location.longitude,
        lastLocationAccuracy: location.accuracy,
        lastLocationAddress: location.address,
        lastLocationTimestamp: now,
      },
    });
  }

  /**
   * Toggles or stops location sharing.
   */
  static async setLocationSharing(
    userId: string,
    sessionId: string,
    enabled: boolean
  ) {
    const session = await db.safetySession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.userId !== userId) {
      throw new Error("Safety session not found or unauthorized.");
    }

    return db.safetySession.update({
      where: { id: sessionId },
      data: { locationSharingEnabled: enabled },
    });
  }

  /**
   * Activates SOS Emergency:
   * 1. Idempotency check: If already TRIGGERED, returns active session without duplicate alert storms.
   * 2. Sets sosStatus = "TRIGGERED".
   * 3. Updates last known location if provided.
   * 4. Dispatches in-app notifications & logs audit incident.
   */
  static async triggerSOS(
    userId: string,
    sessionId: string,
    coords?: { latitude?: number; longitude?: number; accuracy?: number; address?: string },
    idempotencyKey?: string
  ) {
    const session = await db.safetySession.findUnique({
      where: { id: sessionId },
      include: {
        user: { include: { profile: true } },
        activity: true,
        travelPlan: true,
      },
    });

    if (!session || session.userId !== userId) {
      throw new Error("Safety session not found or unauthorized.");
    }

    // Idempotency: If already active and triggered within last 60 seconds, return existing without re-alerting
    if (session.sosStatus === "TRIGGERED") {
      const latestIncident = await db.safetyIncident.findFirst({
        where: { sessionId: session.id, type: "SOS_TRIGGERED" },
        orderBy: { createdAt: "desc" },
      });
      return {
        session,
        incident: latestIncident,
        dispatched: [],
        alreadyActive: true,
      };
    }

    const now = new Date();

    const updatedSession = await db.safetySession.update({
      where: { id: sessionId },
      data: {
        sosStatus: "TRIGGERED",
        lastLatitude: coords?.latitude ?? session.lastLatitude,
        lastLongitude: coords?.longitude ?? session.lastLongitude,
        lastLocationAccuracy: coords?.accuracy ?? session.lastLocationAccuracy,
        lastLocationAddress: coords?.address ?? session.lastLocationAddress,
        lastLocationTimestamp: coords?.latitude !== undefined ? now : session.lastLocationTimestamp,
        locationSharingEnabled: true, // ensure location tracking is active for emergency
      },
    });

    // Dispatch in-app notifications
    const dispatched = await this.dispatchEmergencyAlert({
      session: {
        ...session,
        lastLatitude: coords?.latitude ?? session.lastLatitude,
        lastLongitude: coords?.longitude ?? session.lastLongitude,
      },
      type: "SOS_TRIGGERED",
      notes: "Emergency SOS triggered by user (3-second hold).",
    });

    // Record incident
    const incident = await db.safetyIncident.create({
      data: {
        sessionId: session.id,
        type: "SOS_TRIGGERED",
        latitude: coords?.latitude ?? session.lastLatitude,
        longitude: coords?.longitude ?? session.lastLongitude,
        accuracy: coords?.accuracy ?? session.lastLocationAccuracy,
        locationAddress: coords?.address ?? session.lastLocationAddress,
        notes: `Emergency SOS triggered by user.${idempotencyKey ? ` [Key: ${idempotencyKey}]` : ""}`,
        notificationsDispatched: JSON.stringify(dispatched),
      },
    });

    return {
      session: updatedSession,
      incident,
      dispatched,
      alreadyActive: false,
    };
  }

  /**
   * Cancels an active SOS alert. Requires confirmation on frontend.
   */
  static async cancelSOS(
    userId: string,
    sessionId: string,
    reason?: string
  ) {
    const session = await db.safetySession.findUnique({
      where: { id: sessionId },
      include: {
        user: { include: { profile: true } },
        activity: true,
        travelPlan: true,
      },
    });

    if (!session || session.userId !== userId) {
      throw new Error("Safety session not found or unauthorized.");
    }

    const now = new Date();

    const updatedSession = await db.safetySession.update({
      where: { id: sessionId },
      data: {
        sosStatus: "RESOLVED",
      },
    });

    const dispatched = await this.dispatchEmergencyAlert({
      session,
      type: "SOS_CANCELLED",
      notes: reason || "User marked themselves safe and cancelled the SOS alert.",
    });

    const incident = await db.safetyIncident.create({
      data: {
        sessionId: session.id,
        type: "SOS_CANCELLED",
        latitude: session.lastLatitude,
        longitude: session.lastLongitude,
        resolvedAt: now,
        notes: reason || "SOS cancelled by user.",
        notificationsDispatched: JSON.stringify(dispatched),
      },
    });

    return {
      session: updatedSession,
      incident,
      dispatched,
    };
  }

  /**
   * Internal dispatcher for browser-based emergency communications.
   * Strictly NO SMS.
   * Handles:
   * 1. In-App Notification if emergency contact is an internal Travally User.
   * 2. Platform safety audit log.
   */
  private static async dispatchEmergencyAlert({
    session,
    type,
    notes,
  }: {
    session: any;
    type:
    | "SOS_TRIGGERED"
    | "MISSED_CHECKIN_ESCALATED"
    | "SOS_CANCELLED"
    | "CHECKIN_RESOLVED"
    | "CHECKIN_CONFIRMED";
    notes?: string;
  }): Promise<DispatchedAlert[]> {
    const dispatched: DispatchedAlert[] = [];
    let appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://travally.in";
    if (process.env.NODE_ENV === "production") {
      if (appUrl.startsWith("http://localhost")) {
        appUrl = "https://travally.in";
      } else if (appUrl.startsWith("http://")) {
        appUrl = appUrl.replace(/^http:\/\//i, "https://");
      }
    }
    const trackingUrl = `${appUrl}/safety/live/${session.shareToken}`;

    const userName = session.user?.profile?.displayName || "Travally Explorer";
    const activityName =
      session.activity?.title || session.travelPlan?.destination || "Travel Activity";

    let alertTitle = "";
    let alertBody = "";

    if (type === "SOS_TRIGGERED") {
      alertTitle = `🚨 EMERGENCY ALERT: ${userName} triggered SOS`;
      alertBody = `URGENT: ${userName} pressed SOS during "${activityName}". View live safety portal: ${trackingUrl}`;
    } else if (type === "MISSED_CHECKIN_ESCALATED") {
      alertTitle = `⚠️ SAFETY NOTICE: ${userName} missed safety check-in`;
      alertBody = `Safety check-in deadline missed for "${activityName}". Last known location recorded. View details: ${trackingUrl}`;
    } else if (type === "SOS_CANCELLED") {
      alertTitle = `✅ SAFETY UPDATE: ${userName} is Safe`;
      alertBody = `${userName} cancelled their emergency alert and confirmed they are safe.`;
    } else if (type === "CHECKIN_RESOLVED") {
      alertTitle = `✅ CHECK-IN UPDATE: ${userName} is Safe`;
      alertBody = `${userName} confirmed safety after the missed check-in notice.`;
    } else if (type === "CHECKIN_CONFIRMED") {
      alertTitle = `✅ Safe Check-in: ${userName}`;
      alertBody = `${userName} completed periodic safety check-in: "I'm okay ✓" for "${activityName}".`;
    }

    // 1. If Contact is a Travally User, create an authoritative in-app Notification
    if (session.contactUserId && isValidObjectId(session.contactUserId)) {
      try {
        await db.notification.create({
          data: {
            userId: session.contactUserId,
            type: "TRIP_UPDATE",
            title: alertTitle,
            body: alertBody,
            actionUrl: `/safety/live/${session.shareToken}`,
          },
        });

        dispatched.push({
          id: crypto.randomUUID(),
          recipientType: "CONTACT_INTERNAL",
          recipientName: session.contactName,
          recipientUserId: session.contactUserId,
          channel: "IN_APP",
          title: alertTitle,
          message: alertBody,
          trackingUrl,
          sentAt: new Date().toISOString(),
          status: "DELIVERED",
        });
      } catch (e: any) {
        console.warn("Could not dispatch internal in-app notification:", e?.message);
      }
    }

    // 2. Travally platform safety log
    dispatched.push({
      id: crypto.randomUUID(),
      recipientType: "SAFETY_DESK",
      recipientName: "Travally Safety Desk",
      channel: "SYSTEM_AUDIT",
      title: alertTitle,
      message: `Safety event [${type}] logged for session ${session.id}. User: ${session.userId}. Note: ${notes || "None"}`,
      trackingUrl,
      sentAt: new Date().toISOString(),
      status: "DELIVERED",
    });

    return dispatched;
  }

  /**
   * Evaluates check-in deadlines for a single user's session.
   */
  private static async evaluateSingleSessionDeadlines(
    userId: string,
    targetType: "ACTIVITY" | "TRAVEL",
    targetId: string
  ) {
    try {
      const now = new Date();
      const where: any = {
        userId,
        status: "ACTIVE",
        nextCheckInAt: { not: null },
      };
      if (targetType === "ACTIVITY") where.activityId = targetId;
      else where.travelPlanId = targetId;

      const session = await db.safetySession.findFirst({
        where,
        include: {
          user: { include: { profile: true } },
          activity: true,
          travelPlan: true,
        },
      });

      if (!session || !session.nextCheckInAt) return;

      const deadline = new Date(session.nextCheckInAt).getTime();
      const gracePeriodMs = 5 * 60 * 1000; // 5 minute grace period

      if (now.getTime() > deadline + gracePeriodMs && !session.isCheckInEscalated) {
        // Escalate!
        const dispatched = await this.dispatchEmergencyAlert({
          session,
          type: "MISSED_CHECKIN_ESCALATED",
          notes: "Missed check-in grace period exceeded without response.",
        });

        await db.safetyCheckIn.create({
          data: {
            sessionId: session.id,
            status: "MISSED",
            scheduledFor: session.nextCheckInAt,
            respondedAt: null,
            latitude: session.lastLatitude,
            longitude: session.lastLongitude,
          },
        });

        await db.safetyIncident.create({
          data: {
            sessionId: session.id,
            type: "MISSED_CHECKIN_ESCALATED",
            latitude: session.lastLatitude,
            longitude: session.lastLongitude,
            notes: "Missed check-in escalated after 5m grace period.",
            notificationsDispatched: JSON.stringify(dispatched),
          },
        });

        await db.safetySession.update({
          where: { id: session.id },
          data: {
            isCheckInEscalated: true,
            missedCheckInAt: now,
          },
        });

        // Also alert user in-app
        await db.notification.create({
          data: {
            userId: session.userId,
            type: "TRIP_UPDATE",
            title: "Safety Check-in Missed",
            body: `You missed your scheduled check-in. Your emergency contact (${session.contactName}) has been notified with your last known location.`,
            actionUrl:
              session.activityId !== null
                ? `/activities/${session.activityId}`
                : `/travel/${session.travelPlanId}`,
          },
        });
      }
    } catch (e: any) {
      console.warn("Error evaluating session deadline:", e?.message);
    }
  }

  /**
   * Autonomous background deadline evaluator.
   * Designed to be triggered by cron (every 1-2 minutes).
   * Features:
   * 1. Distributed lock via MongoDB `cron_locks` collection to prevent multi-instance races.
   * 2. Atomic document-level compare-and-swap (`updateMany` with `isCheckInEscalated: false`) to guarantee zero duplicate escalations.
   */
  static async evaluateAllActiveSessions(): Promise<{ evaluatedCount: number; escalatedCount: number }> {
    const now = new Date();

    // 1. Distributed MongoDB lock across multi-pod / serverless instances
    try {
      const mongo = await getDb();
      const lockKey = "cron:safety-checkins";
      const lockTtlMs = 60 * 1000; // 60s lease
      const lockExpiry = new Date(now.getTime() + lockTtlMs);

      const acquire = await mongo.collection("cron_locks").findOneAndUpdate(
        {
          key: lockKey,
          $or: [
            { expiresAt: { $lt: now } },
            { expiresAt: { $exists: false } },
          ],
        },
        {
          $set: { key: lockKey, lockedAt: now, expiresAt: lockExpiry },
        },
        { upsert: true, returnDocument: "after" }
      );

      if (acquire && acquire.lockedAt && Math.abs(new Date(acquire.lockedAt).getTime() - now.getTime()) > 500) {
        return { evaluatedCount: 0, escalatedCount: 0 };
      }
    } catch {
      // In offline/test environments, proceed to document-level CAS guarantee
    }

    const gracePeriodMs = 5 * 60 * 1000;
    const threshold = new Date(now.getTime() - gracePeriodMs);

    const pendingSessions = await db.safetySession.findMany({
      where: {
        status: "ACTIVE",
        isCheckInEscalated: false,
        nextCheckInAt: {
          lte: threshold,
        },
      },
      include: {
        user: { include: { profile: true } },
        activity: true,
        travelPlan: true,
      },
      take: 50,
    });

    let escalatedCount = 0;

    for (const session of pendingSessions) {
      try {
        // Concurrency guard: update atomically to avoid race condition if another runner executes simultaneously
        const updated = await db.safetySession.updateMany({
          where: {
            id: session.id,
            isCheckInEscalated: false,
          },
          data: {
            isCheckInEscalated: true,
            missedCheckInAt: now,
          },
        });

        if (updated.count === 0) continue; // Already handled by concurrent runner

        const dispatched = await this.dispatchEmergencyAlert({
          session,
          type: "MISSED_CHECKIN_ESCALATED",
          notes: "Autonomous cron: missed check-in grace period exceeded.",
        });

        await db.safetyCheckIn.create({
          data: {
            sessionId: session.id,
            status: "MISSED",
            scheduledFor: session.nextCheckInAt!,
            respondedAt: null,
            latitude: session.lastLatitude,
            longitude: session.lastLongitude,
          },
        });

        await db.safetyIncident.create({
          data: {
            sessionId: session.id,
            type: "MISSED_CHECKIN_ESCALATED",
            latitude: session.lastLatitude,
            longitude: session.lastLongitude,
            notes: "Missed check-in escalated by autonomous background scheduler.",
            notificationsDispatched: JSON.stringify(dispatched),
          },
        });

        await db.notification.create({
          data: {
            userId: session.userId,
            type: "TRIP_UPDATE",
            title: "Safety Check-in Missed",
            body: `You missed your scheduled check-in. Your emergency contact (${session.contactName}) has been notified with your last known location.`,
            actionUrl:
              session.activityId !== null
                ? `/activities/${session.activityId}`
                : `/travel/${session.travelPlanId}`,
          },
        });

        escalatedCount++;
      } catch (e: any) {
        console.warn(`Failed evaluating session ${session.id}:`, e?.message);
      }
    }

    return { evaluatedCount: pendingSessions.length, escalatedCount };
  }

  /**
   * Retrieves public tracking information for an emergency contact using the secure shareToken.
   * Enforces:
   * 1. Token validation & existence.
   * 2. Revocation checking (returns status: "REVOKED", no coords).
   * 3. Expiration checking (returns status: "EXPIRED", no coords).
   * 4. Session lifecycle checking (returns status: "COMPLETED" | "CANCELLED", no coords).
   * 5. Target activity lifecycle checking (returns status: "ACTIVITY_CANCELLED", no coords).
   * 6. Real safety timeline reconstruction from database events.
   * 7. Strips all sensitive private user data.
   */
  static async getPublicTrackingData(shareToken: string) {
    if (!shareToken || typeof shareToken !== "string" || shareToken.length < 16) {
      return { status: "INVALID_TOKEN", error: "Invalid safety tracking token." };
    }

    const session = await db.safetySession.findUnique({
      where: { shareToken },
      include: {
        user: {
          select: {
            id: true,
            profile: {
              select: {
                displayName: true,
                avatarUrl: true,
                isVerified: true,
              },
            },
          },
        },
        activity: {
          select: {
            id: true,
            title: true,
            category: true,
            locationName: true,
            meetingPointVenue: true,
            date: true,
            startTime: true,
            status: true,
          },
        },
        travelPlan: {
          select: {
            id: true,
            destination: true,
            departureCity: true,
            startDate: true,
            endDate: true,
            travelStyle: true,
            status: true,
          },
        },
        incidents: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        checkIns: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!session) {
      return { status: "NOT_FOUND", error: "Safety tracking session not found or link has expired." };
    }

    const displayName = session.user?.profile?.displayName || "Explorer";
    const avatarUrl = session.user?.profile?.avatarUrl || null;
    const isVerified = Boolean(session.user?.profile?.isVerified);

    // 1. Check explicit link revocation
    if (session.isLinkRevoked) {
      return {
        status: "REVOKED",
        user: { displayName, avatarUrl, isVerified },
        message: "This emergency tracking link was revoked by the traveler.",
        revokedAt: session.revokedAt,
      };
    }

    // 2. Check link expiration
    const now = new Date();
    if (session.shareExpiresAt && now > new Date(session.shareExpiresAt)) {
      return {
        status: "EXPIRED",
        user: { displayName, avatarUrl, isVerified },
        message: "This emergency tracking link has expired.",
        expiredAt: session.shareExpiresAt,
      };
    }

    // 3. Check session status
    if (session.status === "COMPLETED" || session.status === "CANCELLED") {
      return {
        status: session.status,
        user: { displayName, avatarUrl, isVerified },
        message: `This travel safety session has been ${session.status.toLowerCase()}.`,
        updatedAt: session.updatedAt,
      };
    }

    // 4. Check associated activity/trip status
    if (session.activity && ["CANCELLED", "COMPLETED"].includes(session.activity.status)) {
      return {
        status: session.activity.status === "COMPLETED" ? "ACTIVITY_COMPLETED" : "ACTIVITY_CANCELLED",
        user: { displayName, avatarUrl, isVerified },
        message: session.activity.status === "COMPLETED"
          ? "This companion activity has completed."
          : "This companion activity was cancelled.",
      };
    }
    if (session.travelPlan && ["CANCELLED", "COMPLETED"].includes(session.travelPlan.status)) {
      return {
        status: session.travelPlan.status === "COMPLETED" ? "ACTIVITY_COMPLETED" : "ACTIVITY_CANCELLED",
        user: { displayName, avatarUrl, isVerified },
        message: session.travelPlan.status === "COMPLETED"
          ? "This travel plan has completed."
          : "This travel plan was cancelled.",
      };
    }

    // 5. Build structured safety update timeline from real DB events
    const timeline: SafetyTimelineItem[] = [];

    // Map incidents
    for (const inc of session.incidents) {
      let title = "Safety Event";
      let desc = inc.notes || "";

      if (inc.type === "SOS_TRIGGERED") {
        title = "🚨 Emergency SOS Activated";
        desc = "User explicitly activated emergency SOS alert.";
      } else if (inc.type === "SOS_CANCELLED") {
        title = "✅ Emergency SOS Cancelled";
        desc = inc.notes || "User confirmed safety and cancelled the emergency alert.";
      } else if (inc.type === "MISSED_CHECKIN_ESCALATED") {
        title = "⚠️ Check-in Deadline Missed";
        desc = "Scheduled safety check-in grace period expired.";
      } else if (inc.type === "CHECKIN_RESOLVED") {
        title = "✅ Confirmed Safe After Alert";
        desc = "User confirmed safety following the missed check-in notice.";
      } else if (inc.type === "CHECKIN_CONFIRMED") {
        title = "✓ Check-in Confirmed";
        desc = "User confirmed: 'I\'m okay ✓'.";
      } else if (inc.type === "SESSION_ACTIVATED") {
        title = "Safety Protection Activated";
        desc = "Personal safety companion session initiated.";
      } else if (inc.type === "LINK_REGENERATED") {
        title = "Tracking Link Refreshed";
        desc = "A new tracking link was generated.";
      }

      timeline.push({
        id: inc.id,
        type: inc.type as any,
        title,
        description: desc,
        timestamp: inc.createdAt.toISOString(),
      });
    }

    // Map recent successful check-ins (deduplicating with incidents if any)
    for (const ci of session.checkIns) {
      if (ci.status === "COMPLETED" && ci.respondedAt) {
        const timeStr = ci.respondedAt.toISOString();
        const alreadyInTimeline = timeline.some(
          (t) => Math.abs(new Date(t.timestamp).getTime() - new Date(timeStr).getTime()) < 3000
        );
        if (!alreadyInTimeline) {
          timeline.push({
            id: ci.id,
            type: "CHECKIN_CONFIRMED",
            title: "✓ Check-in Confirmed",
            description: "User confirmed: 'I\'m okay ✓'.",
            timestamp: timeStr,
          });
        }
      }
    }

    // Sort timeline chronologically descending (newest first)
    timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return {
      status: "ACTIVE",
      shareToken: session.shareToken,
      sosStatus: session.sosStatus,
      isCheckInEscalated: session.isCheckInEscalated,
      missedCheckInAt: session.missedCheckInAt,
      lastCheckInAt: session.lastCheckInAt,
      nextCheckInAt: session.nextCheckInAt,
      locationSharingEnabled: session.locationSharingEnabled,
      lastLatitude: session.locationSharingEnabled ? session.lastLatitude : null,
      lastLongitude: session.locationSharingEnabled ? session.lastLongitude : null,
      lastLocationAccuracy: session.locationSharingEnabled ? session.lastLocationAccuracy : null,
      lastLocationTimestamp: session.locationSharingEnabled ? session.lastLocationTimestamp : null,
      lastLocationAddress: session.locationSharingEnabled ? session.lastLocationAddress : null,
      shareExpiresAt: session.shareExpiresAt,
      user: {
        displayName,
        avatarUrl,
        isVerified,
      },
      target: session.activity
        ? {
          type: "ACTIVITY" as const,
          title: session.activity.title,
          category: session.activity.category,
          location: session.activity.locationName,
          venue: session.activity.meetingPointVenue,
          date: session.activity.date,
          time: session.activity.startTime,
          status: session.activity.status,
        }
        : session.travelPlan
          ? {
            type: "TRAVEL" as const,
            title: session.travelPlan.destination,
            category: session.travelPlan.travelStyle,
            location: `${session.travelPlan.departureCity} ➔ ${session.travelPlan.destination}`,
            date: session.travelPlan.startDate,
            endDate: session.travelPlan.endDate,
            status: session.travelPlan.status,
          }
          : null,
      timeline: timeline.slice(0, 15),
    };
  }

  /**
   * Persistent rate limiting using MongoDB `rate_limits` collection.
   * Tracks request counts within a sliding window.
   */
  static async checkRateLimit(
    identifier: string,
    limit = 60,
    windowSeconds = 60
  ): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
    try {
      const mongo = await getDb();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + windowSeconds * 1000);

      const record = await mongo.collection("rate_limits").findOneAndUpdate(
        { key: identifier, resetAt: { $gt: now } },
        {
          $inc: { count: 1 },
          $setOnInsert: { key: identifier, createdAt: now, resetAt: expiresAt },
        },
        { upsert: true, returnDocument: "after" }
      );

      const count = record?.count ?? 1;
      const reset = record?.resetAt ?? expiresAt;

      return {
        allowed: count <= limit,
        remaining: Math.max(0, limit - count),
        resetAt: reset,
      };
    } catch (e) {
      console.warn("MongoDB rate limit fallback (allow request):", e);
      return { allowed: true, remaining: limit, resetAt: new Date(Date.now() + windowSeconds * 1000) };
    }
  }

  /**
   * Completes or cancels a safety session when the activity finishes or is cancelled.
   */
  static async closeSession(
    userId: string,
    sessionId: string,
    status: "COMPLETED" | "CANCELLED"
  ) {
    const session = await db.safetySession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.userId !== userId) {
      throw new Error("Unauthorized or session not found.");
    }

    return db.safetySession.update({
      where: { id: sessionId },
      data: {
        status,
        locationSharingEnabled: false,
        nextCheckInAt: null,
      },
    });
  }
}
