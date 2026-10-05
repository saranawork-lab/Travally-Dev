import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import {
  startCall,
  getActiveCallByConversation,
  getActiveCallForUser,
} from "@/lib/callSignaling";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId");

    if (conversationId) {
      const activeCall = getActiveCallByConversation(conversationId);
      return NextResponse.json({ activeCall });
    }

    // Global check for user's incoming call on any screen
    const incomingCall = getActiveCallForUser(user.id);
    return NextResponse.json({ activeCall: incomingCall, incomingCall });
  } catch (error) {
    console.error("GET /api/calls error:", error);
    return NextResponse.json(
      { error: "Failed to fetch active call" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { conversationId, isGroup, participantIds, sdpOffer } = body;

    if (!conversationId) {
      return NextResponse.json(
        { error: "conversationId is required" },
        { status: 400 }
      );
    }

    const profile = await db.profile.findUnique({
      where: { userId: user.id },
    });

    const callerName =
      profile?.displayName || user.email?.split("@")[0] || "Travel Companion";
    const callerAvatar = profile?.avatarUrl || undefined;

    const call = startCall({
      conversationId,
      callerId: user.id,
      callerName,
      callerAvatar,
      isGroup: Boolean(isGroup),
      participantIds: participantIds || [],
      sdpOffer,
    });

    return NextResponse.json({ call });
  } catch (error) {
    console.error("POST /api/calls error:", error);
    return NextResponse.json(
      { error: "Failed to initiate call" },
      { status: 500 }
    );
  }
}
