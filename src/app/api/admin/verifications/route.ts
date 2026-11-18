import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, invalidateSessionCache } from "@/lib/auth";
import { getDb } from "@/lib/mongo";
import db from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/verifications
 * Super Admin endpoint: Retrieves all customer verification submissions.
 */
export async function GET(req: NextRequest) {
  try {
    const adminUser = await getCurrentUser();
    if (!adminUser || (adminUser.role !== "SUPER_ADMIN" && adminUser.email !== "superadmin@travally.app")) {
      return NextResponse.json(
        { error: "Access denied. Super Administrator credentials required." },
        { status: 403 }
      );
    }

    const mongo = await getDb();
    const rawSessions = await mongo
      .collection("identity_verifications")
      .find({
        $or: [
          { documentImage: { $exists: true } },
          { selfieImage: { $exists: true } },
          { status: { $in: ["PENDING", "REVIEW_PENDING", "VERIFIED", "REJECTED", "ID_PENDING", "SELFIE_PENDING"] } },
        ],
      })
      .sort({ updatedAt: -1, createdAt: -1 })
      .limit(100)
      .toArray();

    // Collect userIds to fetch latest profile details
    const userIds = Array.from(
      new Set(rawSessions.map((s) => s.userId).filter(Boolean))
    );

    const profiles = await db.profile.findMany({
      where: { userId: { in: userIds } },
      include: { user: { select: { email: true, createdAt: true, role: true } } },
    });

    const profileMap = new Map(profiles.map((p) => [p.userId, p]));

    const verifications = rawSessions.map((s) => {
      const p = profileMap.get(s.userId);
      const isReviewPending = s.status === "REVIEW_PENDING" || s.status === "PENDING";
      const normalizedStatus = isReviewPending
        ? "PENDING"
        : s.status === "VERIFIED"
        ? "VERIFIED"
        : s.status === "REJECTED"
        ? "REJECTED"
        : "INCOMPLETE";

      return {
        id: s._id.toString(),
        sessionId: s.sessionId,
        userId: s.userId,
        status: normalizedStatus,
        documentType: s.documentType || "ID_CARD",
        documentImage: s.documentImage || null,
        selfieImage: s.selfieImage || null,
        submittedAt: s.submittedAt || s.createdAt || new Date().toISOString(),
        reviewedAt: s.reviewedAt || null,
        reviewedBy: s.reviewedBy || null,
        rejectionReason: s.rejectionReason || s.reasonCode || null,
        user: {
          id: s.userId,
          displayName: p?.displayName || s.userName || "Customer",
          email: p?.user?.email || s.userEmail || "",
          avatarUrl: p?.avatarUrl || s.userAvatar || null,
          city: p?.city || null,
          country: p?.country || "India",
          isVerified: p?.isVerified || false,
          dbVerificationStatus: p?.verificationStatus || "UNVERIFIED",
          registeredAt: p?.user?.createdAt || null,
        },
      };
    });

    const summary = {
      total: verifications.length,
      pending: verifications.filter((v) => v.status === "PENDING").length,
      verified: verifications.filter((v) => v.status === "VERIFIED").length,
      rejected: verifications.filter((v) => v.status === "REJECTED").length,
    };

    return NextResponse.json({
      success: true,
      summary,
      verifications,
    });
  } catch (error: any) {
    console.error("GET /api/admin/verifications error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load verifications queue." },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/verifications
 * Super Admin endpoint: Approve (tick mark) or Reject a customer's verification.
 */
export async function PATCH(req: NextRequest) {
  try {
    const adminUser = await getCurrentUser();
    if (!adminUser || (adminUser.role !== "SUPER_ADMIN" && adminUser.email !== "superadmin@travally.app")) {
      return NextResponse.json(
        { error: "Access denied. Super Administrator credentials required." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { sessionId, action, rejectionReason } = body;

    if (!sessionId || !action || !["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json(
        { error: "Valid sessionId and action ('APPROVE' | 'REJECT') are required." },
        { status: 400 }
      );
    }

    const mongo = await getDb();
    const session = await mongo.collection("identity_verifications").findOne({ sessionId });
    if (!session) {
      return NextResponse.json(
        { error: "Verification session not found." },
        { status: 404 }
      );
    }

    const targetUserId = session.userId;
    const now = new Date();

    if (action === "APPROVE") {
      // 1. Update Prisma User Profile authoritatively
      await db.profile.update({
        where: { userId: targetUserId },
        data: {
          isVerified: true,
          verificationStatus: "VERIFIED",
        },
      });

      // 2. Invalidate in-memory session cache for instant update across active sessions
      invalidateSessionCache(targetUserId);

      // 3. Update MongoDB audit trail
      await mongo.collection("identity_verifications").updateOne(
        { sessionId },
        {
          $set: {
            status: "VERIFIED",
            isVerified: true,
            reviewedAt: now.toISOString(),
            reviewedBy: adminUser.email,
            rejectionReason: null,
            updatedAt: now.toISOString(),
          },
        }
      );

      // 4. Send In-App Notification to Customer
      try {
        await db.notification.create({
          data: {
            userId: targetUserId,
            type: "SYSTEM",
            title: "Identity Verified",
            body: "Your government ID document and live selfie have been reviewed and approved by the Super Admin! All verified features are now unlocked.",
            actionUrl: "/profile",
            isRead: false,
          },
        });
      } catch (notifErr) {
        console.warn("Could not dispatch verification approval notification:", notifErr);
      }

      return NextResponse.json({
        success: true,
        message: "Customer identity has been verified successfully. DB profile updated to VERIFIED.",
        newStatus: "VERIFIED",
        targetUserId,
      });
    }

    // ACTION === "REJECT"
    const reasonText = rejectionReason?.trim() || "Submitted document was not clear or did not match live selfie.";

    // 1. Update Prisma Profile to UNVERIFIED / REJECTED
    await db.profile.update({
      where: { userId: targetUserId },
      data: {
        isVerified: false,
        verificationStatus: "REJECTED",
      },
    });

    // 2. Invalidate in-memory cache
    invalidateSessionCache(targetUserId);

    // 3. Update MongoDB audit trail
    await mongo.collection("identity_verifications").updateOne(
      { sessionId },
      {
        $set: {
          status: "REJECTED",
          isVerified: false,
          rejectionReason: reasonText,
          reviewedAt: now.toISOString(),
          reviewedBy: adminUser.email,
          updatedAt: now.toISOString(),
        },
      }
    );

    // 4. Send In-App Notification to Customer
    try {
      await db.notification.create({
        data: {
          userId: targetUserId,
          type: "SYSTEM",
          title: "Verification Needs Attention",
          body: `Your identity verification was not approved. Reason: ${reasonText}. Please upload a clearer photo or retake your selfie.`,
          actionUrl: "/profile",
          isRead: false,
        },
      });
    } catch (notifErr) {
      console.warn("Could not dispatch verification rejection notification:", notifErr);
    }

    return NextResponse.json({
      success: true,
      message: "Customer verification has been marked as REJECTED.",
      newStatus: "REJECTED",
      targetUserId,
    });
  } catch (error: any) {
    console.error("PATCH /api/admin/verifications error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update verification status." },
      { status: 500 }
    );
  }
}
