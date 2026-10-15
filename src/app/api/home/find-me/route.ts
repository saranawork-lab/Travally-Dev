import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/mongo";
import { ObjectId } from "mongodb";
import db from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/home/find-me
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const filter = userId ? { creatorId: userId } : {};

    const mongo = await getDb();
    const clues = await mongo
      .collection("find_me_clues")
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    const formatted = clues.map((c) => ({
      ...c,
      id: c._id.toString(),
      _id: undefined,
    }));

    return NextResponse.json({ success: true, clues: formatted });
  } catch (error) {
    console.error("Error fetching Find Me clues:", error);
    return NextResponse.json({ error: "Failed to fetch clues" }, { status: 500 });
  }
}

// POST /api/home/find-me
export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required to post a Find Me clue" }, { status: 401 });
    }

    const body = await req.json();
    const { clueText, hintArea, vibeTag, photoHintUrl } = body;

    if (!clueText || !hintArea) {
      return NextResponse.json({ error: "Clue and vicinity area are required" }, { status: 400 });
    }

    const mongo = await getDb();
    const newClue = {
      creatorId: currentUser.id,
      creatorName: currentUser.displayName || currentUser.email.split("@")[0],
      creatorAvatar: currentUser.avatarUrl || null,
      creatorCity: currentUser.city || null,
      clueText: clueText.trim(),
      hintArea: hintArea.trim(),
      vibeTag: vibeTag || "Coffee & Books",
      photoHintUrl: photoHintUrl || null,
      status: "OPEN", // OPEN, SOLVED, MATCHED
      guessesCount: 0,
      guesses: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await mongo.collection("find_me_clues").insertOne(newClue);

    return NextResponse.json({
      success: true,
      clue: {
        ...newClue,
        id: result.insertedId.toString(),
      },
    });
  } catch (error) {
    console.error("Error posting Find Me clue:", error);
    return NextResponse.json({ error: "Failed to post clue" }, { status: 500 });
  }
}

// PATCH /api/home/find-me (submit guess / request to date & unlock chat)
export async function PATCH(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required to solve clue" }, { status: 401 });
    }

    const body = await req.json();
    const { clueId, answerGuess, customMessage } = body;

    if (!clueId || !ObjectId.isValid(clueId) || !answerGuess) {
      return NextResponse.json({ error: "Clue ID and your answer guess are required" }, { status: 400 });
    }

    const mongo = await getDb();
    const clue = await mongo.collection("find_me_clues").findOne({ _id: new ObjectId(clueId) });

    if (!clue) {
      return NextResponse.json({ error: "Clue not found" }, { status: 404 });
    }

    if (clue.creatorId === currentUser.id) {
      return NextResponse.json({ error: "You cannot solve your own Find Me clue!" }, { status: 400 });
    }

    const guessEntry = {
      guesserId: currentUser.id,
      guesserName: currentUser.displayName || currentUser.email.split("@")[0],
      guesserAvatar: currentUser.avatarUrl || null,
      answerGuess: answerGuess.trim(),
      customMessage: (customMessage || "").trim(),
      timestamp: new Date().toISOString(),
    };

    await mongo.collection("find_me_clues").updateOne(
      { _id: new ObjectId(clueId) },
      {
        $push: { guesses: guessEntry as any },
        $inc: { guessesCount: 1 },
        $set: { updatedAt: new Date().toISOString() },
      }
    );

    // Also send an in-app notification to the clue creator so they know someone found their clue!
    try {
      await db.notification.create({
        data: {
          userId: clue.creatorId,
          type: "REQUEST_RECEIVED",
          title: `💘 New Find Me Match: ${currentUser.displayName || "Someone"} solved your clue!`,
          body: `"${answerGuess.trim()}" — ${customMessage || "Wants to connect and date!"}`,
          actionUrl: `/chats`,
        },
      });
    } catch (notifErr) {
      console.warn("Could not create notification:", notifErr);
    }

    return NextResponse.json({
      success: true,
      message: "Guess & Date request sent! The explorer has been notified to connect.",
    });
  } catch (error) {
    console.error("Error submitting Find Me guess:", error);
    return NextResponse.json({ error: "Failed to submit guess" }, { status: 500 });
  }
}
