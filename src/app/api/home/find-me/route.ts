import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { requireVerifiedUser } from "@/lib/verificationGuard";
import { getDb } from "@/lib/mongo";
import { ObjectId } from "mongodb";
import db from "@/lib/db";

export const dynamic = "force-dynamic";

// Sample initial story cards inspired by the design
const SAMPLE_STORY_CARDS = [
  {
    creatorId: "seed_m_39",
    creatorName: "M",
    creatorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80",
    creatorAge: 39,
    creatorProfession: "Business",
    creatorCity: "Hyderabad",
    creatorNative: "Hyderabad",
    relationshipStatus: "Single",
    vibeTag: "Coffee & Books",
    story: "I find peace in early morning walks and a good book. Sunsets, soulful music and meaningful conversations matter to me. I believe in growing together, supporting each other's dreams and building a life full of purpose.",
    clueText: "Sipping a dark roast by the glass window of an old roastery near Road No. 10",
    hintArea: "Banjara Hills, Hyderabad",
    status: "OPEN",
    guessesCount: 2,
    savedCount: 5,
    acceptedByUsers: [],
    rejectedByUsers: [],
    guesses: [],
  },
  {
    creatorId: "seed_s_32",
    creatorName: "S",
    creatorAvatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=160&auto=format&fit=crop&q=80",
    creatorAge: 32,
    creatorProfession: "Design Lead",
    creatorCity: "Bangalore",
    creatorNative: "Coimbatore",
    relationshipStatus: "Single",
    vibeTag: "Art & Vinyl",
    story: "I'm a hopeless plant lover and weekend café explorer. I journal, meditate and cherish slow mornings. Looking for someone who's kind, curious and ready to create beautiful memories together.",
    clueText: "Sketching ficus roots with watercolors near the old library steps",
    hintArea: "Cubbon Park, Bangalore",
    status: "OPEN",
    guessesCount: 3,
    savedCount: 8,
    acceptedByUsers: [],
    rejectedByUsers: [],
    guesses: [],
  },
  {
    creatorId: "seed_ananya_27",
    creatorName: "Ananya",
    creatorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&auto=format&fit=crop&q=80",
    creatorAge: 27,
    creatorProfession: "Writer & Film Curator",
    creatorCity: "Mumbai",
    creatorNative: "Pune",
    relationshipStatus: "Open to Connect",
    vibeTag: "Sunset & Chai",
    story: "Filter coffee addict, indie cinema aficionado, and monsoon road-tripper. Always up for searching for the best vintage books, slow evening strolls, and deep conversations about art and philosophy.",
    clueText: "Browsing poetry paperbacks at an indie bookstore with sea breeze outside",
    hintArea: "Bandra West, Mumbai",
    status: "OPEN",
    guessesCount: 1,
    savedCount: 4,
    acceptedByUsers: [],
    rejectedByUsers: [],
    guesses: [],
  },
];

// Helper: purge expired clues and saved records
async function purgeExpiredFindMe(mongo: any) {
  const now = new Date().toISOString();
  try {
    await Promise.all([
      mongo.collection("find_me_clues").deleteMany({
        expiresAt: { $exists: true, $lte: now },
      }),
      mongo.collection("find_me_saved").deleteMany({
        expiresAt: { $exists: true, $lte: now },
      }),
    ]);
  } catch (err) {
    console.error("Error purging expired Find Me cards:", err);
  }
}

// GET /api/home/find-me
export async function GET(req: Request) {
  try {
    const mongo = await getDb();
    await purgeExpiredFindMe(mongo);

    const { searchParams } = new URL(req.url);
    const view = searchParams.get("view"); // "saved" | "mine" | "deck"
    const userId = searchParams.get("userId");
    const currentUser = await getCurrentUser().catch(() => null);

    const now = new Date().toISOString();

    // 1. Saved Matches View: cards that the current user accepted/saved (that have not expired)
    if (view === "saved") {
      if (!currentUser) {
        return NextResponse.json({ success: true, clues: [] });
      }

      const savedRecords = await mongo
        .collection("find_me_saved")
        .find({
          userId: currentUser.id,
          expiresAt: { $gt: now },
        })
        .sort({ savedAt: -1 })
        .toArray();

      if (savedRecords.length === 0) {
        return NextResponse.json({ success: true, clues: [] });
      }

      const clueIds: ObjectId[] = savedRecords
        .map((r) => {
          try {
            return new ObjectId(r.clueId);
          } catch {
            return null;
          }
        })
        .filter((id): id is ObjectId => id !== null);

      const savedClues = await mongo
        .collection("find_me_clues")
        .find({
          _id: { $in: clueIds },
          expiresAt: { $gt: now },
        })
        .toArray();

      const formatted = savedClues.map((c) => ({
        ...c,
        id: c._id.toString(),
        _id: undefined,
        isSaved: true,
      }));

      return NextResponse.json({ success: true, clues: formatted });
    }

    // 2. My Beacons View: clues created by the current user or specified userId
    if (view === "mine" || userId) {
      const targetUserId = userId || currentUser?.id;
      if (!targetUserId) {
        return NextResponse.json({ success: true, clues: [] });
      }

      const myClues = await mongo
        .collection("find_me_clues")
        .find({
          creatorId: targetUserId,
          expiresAt: { $gt: now },
        })
        .sort({ createdAt: -1 })
        .toArray();

      const formatted = myClues.map((c) => ({
        ...c,
        id: c._id.toString(),
        _id: undefined,
        isOwner: true,
      }));

      return NextResponse.json({ success: true, clues: formatted });
    }

    // 3. Swipe Deck View: active cards to swipe on
    const totalCluesCount = await mongo.collection("find_me_clues").countDocuments({
      expiresAt: { $gt: now },
    });

    // If database has 0 active clues, seed initial sample story cards with 48h expiration
    if (totalCluesCount === 0) {
      const seedDuration = 48 * 3600 * 1000;
      const seedCards = SAMPLE_STORY_CARDS.map((card) => ({
        ...card,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + seedDuration).toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      await mongo.collection("find_me_clues").insertMany(seedCards);
    }

    // Query active non-expired clues
    const query: any = {
      expiresAt: { $gt: now },
    };

    if (currentUser) {
      // Exclude own cards
      query.creatorId = { $ne: currentUser.id };
      // Exclude already accepted or rejected cards
      query.acceptedByUsers = { $ne: currentUser.id };
      query.rejectedByUsers = { $ne: currentUser.id };
    }

    const clues = await mongo
      .collection("find_me_clues")
      .find(query)
      .sort({ createdAt: -1 })
      .limit(30)
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
    const auth = await requireVerifiedUser();
    if (auth.errorResponse) {
      return auth.errorResponse;
    }
    const currentUser = auth.user;

    const body = await req.json();
    const {
      clueText,
      hintArea,
      vibeTag,
      photoHintUrl,
      story,
      profession,
      age,
      nativeCity,
      currentCity,
      relationshipStatus,
      durationHours,
    } = body;

    if (!clueText || !hintArea) {
      return NextResponse.json({ error: "Clue and vicinity area are required" }, { status: 400 });
    }

    const mongo = await getDb();
    await purgeExpiredFindMe(mongo);

    const hours = Number(durationHours) || 24;
    const nowMs = Date.now();
    const expiresAt = new Date(nowMs + hours * 3600 * 1000).toISOString();

    const newClue = {
      creatorId: currentUser.id,
      creatorName: currentUser.displayName || currentUser.email.split("@")[0],
      creatorAvatar: currentUser.avatarUrl || null,
      creatorAge: Number(age) || null,
      creatorProfession: profession?.trim() || null,
      creatorCity: (currentCity || currentUser.city || hintArea || "").trim(),
      creatorNative: (nativeCity || "").trim() || null,
      relationshipStatus: (relationshipStatus || "Single").trim(),
      story: (story || clueText).trim(),
      clueText: clueText.trim(),
      hintArea: hintArea.trim(),
      vibeTag: vibeTag || "Coffee & Books",
      photoHintUrl: photoHintUrl || null,
      durationHours: hours,
      status: "OPEN", // OPEN, SOLVED, MATCHED
      guessesCount: 0,
      savedCount: 0,
      acceptedByUsers: [],
      rejectedByUsers: [],
      guesses: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt: expiresAt,
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

// PATCH /api/home/find-me (submit guess / reply to clue)
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
    await purgeExpiredFindMe(mongo);

    const clue = await mongo.collection("find_me_clues").findOne({ _id: new ObjectId(clueId) });

    if (!clue) {
      return NextResponse.json({ error: "Clue has expired or does not exist" }, { status: 404 });
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

    // Notification to creator
    try {
      await db.notification.create({
        data: {
          userId: clue.creatorId,
          type: "REQUEST_RECEIVED",
          title: `💘 New Find Me Guess: ${currentUser.displayName || "Someone"} solved your clue!`,
          body: `"${answerGuess.trim()}" — ${customMessage || "Wants to connect!"}`,
          actionUrl: `/chats`,
        },
      });
    } catch (notifErr) {
      console.warn("Could not create notification:", notifErr);
    }

    return NextResponse.json({
      success: true,
      message: "Guess & connection request sent! The explorer has been notified.",
    });
  } catch (error) {
    console.error("Error submitting Find Me guess:", error);
    return NextResponse.json({ error: "Failed to submit guess" }, { status: 500 });
  }
}

// DELETE /api/home/find-me (delete card or unsave)
export async function DELETE(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const clueId = searchParams.get("clueId");
    const action = searchParams.get("action"); // "unsave" | "delete"

    if (!clueId || !ObjectId.isValid(clueId)) {
      return NextResponse.json({ error: "Valid clueId is required" }, { status: 400 });
    }

    const mongo = await getDb();

    if (action === "unsave") {
      await mongo.collection("find_me_saved").deleteOne({
        userId: currentUser.id,
        clueId: new ObjectId(clueId),
      });
      await mongo.collection("find_me_clues").updateOne(
        { _id: new ObjectId(clueId) },
        {
          $pull: { acceptedByUsers: currentUser.id as any },
          $inc: { savedCount: -1 },
        }
      );
      return NextResponse.json({ success: true, message: "Removed from saved matches" });
    }

    // Creator deleting their own card: also delete any saved copies from other users!
    const deleteRes = await mongo.collection("find_me_clues").deleteOne({
      _id: new ObjectId(clueId),
      creatorId: currentUser.id,
    });

    if (deleteRes.deletedCount > 0) {
      // Remove all saved references for this card across other profiles
      await mongo.collection("find_me_saved").deleteMany({
        clueId: new ObjectId(clueId),
      });
      return NextResponse.json({ success: true, message: "Beacon deleted completely" });
    }

    return NextResponse.json({ error: "Could not delete clue or not authorized" }, { status: 403 });
  } catch (error) {
    console.error("Error deleting Find Me clue:", error);
    return NextResponse.json({ error: "Failed to delete clue" }, { status: 500 });
  }
}
