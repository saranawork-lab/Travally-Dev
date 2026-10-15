import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/mongo";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";

// GET /api/home/treasure
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const filter = userId ? { creatorId: userId } : {};

    const db = await getDb();
    const treasures = await db
      .collection("treasure_drops")
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(60)
      .toArray();

    const formatted = treasures.map((t) => ({
      ...t,
      id: t._id.toString(),
      _id: undefined,
    }));

    return NextResponse.json({ success: true, treasures: formatted });
  } catch (error) {
    console.error("Error fetching treasure drops:", error);
    return NextResponse.json({ error: "Failed to fetch treasure drops" }, { status: 500 });
  }
}

// POST /api/home/treasure
export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required to hide a treasure" }, { status: 401 });
    }

    const body = await req.json();
    const { title, hintRiddle, latitude, longitude, locationName, difficulty, clueImageUrl } = body;

    if (!title || !hintRiddle || latitude === undefined || longitude === undefined) {
      return NextResponse.json({ error: "Title, hint riddle, and map coordinates are required" }, { status: 400 });
    }

    const lat = Number(latitude);
    const lng = Number(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json({ error: "Valid latitude and longitude are required" }, { status: 400 });
    }

    const db = await getDb();
    const newTreasure = {
      creatorId: currentUser.id,
      creatorName: currentUser.displayName || currentUser.email.split("@")[0],
      creatorAvatar: currentUser.avatarUrl || null,
      title: title.trim(),
      hintRiddle: hintRiddle.trim(),
      latitude: lat,
      longitude: lng,
      locationName: (locationName || "Mystery Spot").trim(),
      difficulty: difficulty || "MEDIUM", // EASY, MEDIUM, HARD
      clueImageUrl: clueImageUrl || null,
      solversCount: 0,
      solvedUserIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await db.collection("treasure_drops").insertOne(newTreasure);

    return NextResponse.json({
      success: true,
      treasure: {
        ...newTreasure,
        id: result.insertedId.toString(),
      },
    });
  } catch (error) {
    console.error("Error dropping treasure:", error);
    return NextResponse.json({ error: "Failed to drop treasure" }, { status: 500 });
  }
}

// PATCH /api/home/treasure (solve & claim)
export async function PATCH(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required to solve treasure" }, { status: 401 });
    }

    const body = await req.json();
    const { treasureId, solutionGuess } = body;

    if (!treasureId || !ObjectId.isValid(treasureId)) {
      return NextResponse.json({ error: "Valid treasure ID required" }, { status: 400 });
    }

    const db = await getDb();
    const treasure = await db.collection("treasure_drops").findOne({ _id: new ObjectId(treasureId) });

    if (!treasure) {
      return NextResponse.json({ error: "Treasure not found" }, { status: 404 });
    }

    const solvedUserIds: string[] = Array.isArray(treasure.solvedUserIds) ? treasure.solvedUserIds : [];
    if (solvedUserIds.includes(currentUser.id)) {
      return NextResponse.json({ error: "You have already discovered this treasure!" }, { status: 400 });
    }

    const updatedSolvers = [...solvedUserIds, currentUser.id];

    await db.collection("treasure_drops").updateOne(
      { _id: new ObjectId(treasureId) },
      {
        $set: {
          solvedUserIds: updatedSolvers,
          solversCount: updatedSolvers.length,
          updatedAt: new Date().toISOString(),
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: "Treasure found & logged into your explorer stats!",
      solversCount: updatedSolvers.length,
    });
  } catch (error) {
    console.error("Error solving treasure:", error);
    return NextResponse.json({ error: "Failed to record find" }, { status: 500 });
  }
}
