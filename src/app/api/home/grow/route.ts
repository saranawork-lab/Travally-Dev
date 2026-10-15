import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/mongo";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";

// GET /api/home/grow
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const filter = userId ? { organizerId: userId } : {};

    const db = await getDb();
    const initiatives = await db
      .collection("grow_initiatives")
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    const formatted = initiatives.map((item) => ({
      ...item,
      id: item._id.toString(),
      _id: undefined,
    }));

    return NextResponse.json({ success: true, initiatives: formatted });
  } catch (error) {
    console.error("Error fetching grow initiatives:", error);
    return NextResponse.json({ error: "Failed to fetch initiatives" }, { status: 500 });
  }
}

// POST /api/home/grow
export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required to start a Grow initiative" }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, causeCategory, locationName, date, volunteersNeeded, imageUrl } = body;

    if (!title || !description || !locationName || !date) {
      return NextResponse.json({ error: "Title, description, location, and date are required" }, { status: 400 });
    }

    const db = await getDb();
    const newInitiative = {
      organizerId: currentUser.id,
      organizerName: currentUser.displayName || currentUser.email.split("@")[0],
      organizerAvatar: currentUser.avatarUrl || null,
      organizerCity: currentUser.city || null,
      title: title.trim(),
      description: description.trim(),
      causeCategory: causeCategory || "NATURE", // CLEAN_OCEAN, NATURE, PLANTATION, HUMANITY, ANIMAL_WELFARE, DISASTER_RELIEF
      locationName: locationName.trim(),
      date: date || null,
      volunteersNeeded: Number(volunteersNeeded) || 10,
      volunteersCount: 1,
      joinedUserIds: [currentUser.id],
      imageUrl: imageUrl || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await db.collection("grow_initiatives").insertOne(newInitiative);

    return NextResponse.json({
      success: true,
      initiative: {
        ...newInitiative,
        id: result.insertedId.toString(),
      },
    });
  } catch (error) {
    console.error("Error creating grow initiative:", error);
    return NextResponse.json({ error: "Failed to create initiative" }, { status: 500 });
  }
}

// PATCH /api/home/grow (join/leave volunteer initiative)
export async function PATCH(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required to join an initiative" }, { status: 401 });
    }

    const body = await req.json();
    const { initiativeId } = body;

    if (!initiativeId || !ObjectId.isValid(initiativeId)) {
      return NextResponse.json({ error: "Valid initiative ID required" }, { status: 400 });
    }

    const db = await getDb();
    const initiative = await db.collection("grow_initiatives").findOne({ _id: new ObjectId(initiativeId) });

    if (!initiative) {
      return NextResponse.json({ error: "Initiative not found" }, { status: 404 });
    }

    const joinedUserIds: string[] = Array.isArray(initiative.joinedUserIds) ? initiative.joinedUserIds : [];
    const hasJoined = joinedUserIds.includes(currentUser.id);

    const updatedUserIds = hasJoined
      ? joinedUserIds.filter((id) => id !== currentUser.id)
      : [...joinedUserIds, currentUser.id];

    await db.collection("grow_initiatives").updateOne(
      { _id: new ObjectId(initiativeId) },
      {
        $set: {
          joinedUserIds: updatedUserIds,
          volunteersCount: updatedUserIds.length,
          updatedAt: new Date().toISOString(),
        },
      }
    );

    return NextResponse.json({
      success: true,
      volunteersCount: updatedUserIds.length,
      hasJoined: !hasJoined,
    });
  } catch (error) {
    console.error("Error joining initiative:", error);
    return NextResponse.json({ error: "Failed to update initiative participation" }, { status: 500 });
  }
}
