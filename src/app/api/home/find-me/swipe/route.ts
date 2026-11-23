import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/mongo";
import { ObjectId } from "mongodb";
import db from "@/lib/db";

export const dynamic = "force-dynamic";

// POST /api/home/find-me/swipe
export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required to swipe" }, { status: 401 });
    }

    const body = await req.json();
    const { clueId, action, guess } = body;

    if (!clueId || !ObjectId.isValid(clueId) || !["accept", "reject"].includes(action)) {
      return NextResponse.json({ error: "Valid clueId and action ('accept' | 'reject') required" }, { status: 400 });
    }

    const mongo = await getDb();
    const now = new Date().toISOString();

    const clue = await mongo.collection("find_me_clues").findOne({
      _id: new ObjectId(clueId),
      expiresAt: { $gt: now },
    });

    if (!clue) {
      return NextResponse.json({ error: "This beacon has expired or is no longer available" }, { status: 404 });
    }

    if (clue.creatorId === currentUser.id) {
      return NextResponse.json({ error: "You cannot swipe on your own story card" }, { status: 400 });
    }

    if (action === "accept") {
      // 1. Mark accepted on clue
      const updateData: any = {
        $addToSet: { acceptedByUsers: currentUser.id },
        $inc: { savedCount: 1 },
        $set: { updatedAt: new Date().toISOString() },
      };

      if (guess && guess.trim()) {
        const guessEntry = {
          guesserId: currentUser.id,
          guesserName: currentUser.displayName || currentUser.email.split("@")[0],
          guesserAvatar: currentUser.avatarUrl || null,
          answerGuess: guess.trim(),
          timestamp: new Date().toISOString(),
        };
        updateData.$push = { guesses: guessEntry };
        updateData.$inc.guessesCount = 1;
      }

      await mongo.collection("find_me_clues").updateOne(
        { _id: new ObjectId(clueId) },
        updateData
      );

      // 2. Save card for the current user with exact matching expiration
      // "once the time expires in the find me then the saved ones also gets deleted completely, from other profiles"
      await mongo.collection("find_me_saved").updateOne(
        { userId: currentUser.id, clueId: new ObjectId(clueId) },
        {
          $set: {
            userId: currentUser.id,
            userName: currentUser.displayName || currentUser.email.split("@")[0],
            userAvatar: currentUser.avatarUrl || null,
            clueId: new ObjectId(clueId),
            creatorId: clue.creatorId,
            savedAt: new Date().toISOString(),
            expiresAt: clue.expiresAt,
          },
        },
        { upsert: true }
      );

      // 3. Notify the creator
      try {
        await db.notification.create({
          data: {
            userId: clue.creatorId,
            type: "REQUEST_RECEIVED",
            title: `💚 Find Me Match: ${currentUser.displayName || "Someone"} accepted your story!`,
            body: `They swiped right on your Find Me card. Connect in chat before the beacon expires!`,
            actionUrl: `/chats`,
          },
        });
      } catch (notifErr) {
        console.warn("Could not create match notification:", notifErr);
      }

      return NextResponse.json({
        success: true,
        action: "accept",
        message: "Story card accepted and saved! Match stored until beacon expires.",
        expiresAt: clue.expiresAt,
      });
    }

    if (action === "reject") {
      // Mark rejected on clue so it won't appear in user's deck again
      await mongo.collection("find_me_clues").updateOne(
        { _id: new ObjectId(clueId) },
        {
          $addToSet: { rejectedByUsers: currentUser.id },
          $set: { updatedAt: new Date().toISOString() },
        }
      );

      return NextResponse.json({
        success: true,
        action: "reject",
        message: "Passed card",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error processing Find Me swipe:", error);
    return NextResponse.json({ error: "Failed to process swipe" }, { status: 500 });
  }
}
