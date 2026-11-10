import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getDb } from "@/lib/mongo";

export async function POST() {
  try {
    const mongo = await getDb();

    // Clean MongoDB collections
    const [posts, verifs, grow, treasures, clues] = await Promise.all([
      mongo.collection("community_posts").deleteMany({}),
      mongo.collection("identity_verifications").deleteMany({}),
      mongo.collection("grow_initiatives").deleteMany({}),
      mongo.collection("treasure_drops").deleteMany({}),
      mongo.collection("find_me_clues").deleteMany({}),
    ]);

    // Clean Prisma collections
    const notifications = await db.notification.deleteMany({});
    const messages = await db.message.deleteMany({});
    const conversations = await db.conversation.deleteMany({});
    const joinRequests = await db.joinRequest.deleteMany({});
    const participants = await db.participant.deleteMany({});
    const activities = await db.activity.deleteMany({});
    const travelPlans = await db.travelPlan.deleteMany({});
    const blocks = await db.block.deleteMany({});
    const reports = await db.report.deleteMany({});
    const profiles = await db.profile.deleteMany({});
    const users = await db.user.deleteMany({});

    return NextResponse.json({
      success: true,
      message: "All user data and associated collections cleaned successfully",
      stats: {
        users: users.count,
        profiles: profiles.count,
        communityPosts: posts.deletedCount,
        identityVerifications: verifs.deletedCount,
        growInitiatives: grow.deletedCount,
        treasureDrops: treasures.deletedCount,
        findMeClues: clues.deletedCount,
        activities: activities.count,
        travelPlans: travelPlans.count,
        joinRequests: joinRequests.count,
        messages: messages.count,
        notifications: notifications.count,
        blocks: blocks.count,
        reports: reports.count,
      },
    });
  } catch (error: any) {
    console.error("Failed to clean user data:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to clean users data" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return POST();
}
