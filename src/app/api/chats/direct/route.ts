import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/mongo";
import db from "@/lib/db";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { targetUserId } = body;

    if (!targetUserId) {
      return NextResponse.json({ error: "Target user ID is required" }, { status: 400 });
    }

    if (targetUserId === user.id) {
      return NextResponse.json({ error: "You cannot message yourself" }, { status: 400 });
    }

    const targetUser = await db.user.findUnique({
      where: { id: targetUserId },
      include: { profile: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const mongo = await getDb();

    // Check if a DIRECT conversation already exists between these two users
    let conv = await mongo.collection("Conversation").findOne({
      type: "DIRECT",
      participantIds: { $all: [user.id, targetUserId] },
    });

    if (!conv) {
      const userProfile = await db.profile.findUnique({ where: { userId: user.id } });
      const currentUserName = userProfile?.displayName || user.email.split("@")[0] || "Explorer";
      const targetUserName = targetUser.profile?.displayName || targetUser.email.split("@")[0] || "Explorer";

      const newConvDoc = {
        type: "DIRECT",
        title: `${currentUserName} & ${targetUserName}`,
        participantIds: [user.id, targetUserId],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const insertResult = await mongo.collection("Conversation").insertOne(newConvDoc);
      const convId = insertResult.insertedId.toString();


      return NextResponse.json({
        success: true,
        conversationId: convId,
        created: true,
      });
    }

    return NextResponse.json({
      success: true,
      conversationId: conv._id.toString(),
      created: false,
    });
  } catch (error) {
    console.error("Direct chat error:", error);
    return NextResponse.json({ error: "Failed to initiate direct chat" }, { status: 500 });
  }
}
