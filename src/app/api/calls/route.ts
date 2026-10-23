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
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId");

    // Fast-path: if looking for conversation call
    if (conversationId) {
      const activeCall = await getActiveCallByConversation(conversationId);
      return NextResponse.json({ activeCall });
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ activeCall: null, incomingCall: null });
    }

    // Global check for user's incoming call on any screen
    const incomingCall = await getActiveCallForUser(user.id);
    return NextResponse.json({ activeCall: incomingCall, incomingCall });
  } catch (error) {
    return NextResponse.json({ activeCall: null, incomingCall: null });
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

    const call = await startCall({
      conversationId,
      callerId: user.id,
      callerName,
      callerAvatar,
      isGroup: Boolean(isGroup),
      participantIds: participantIds || [],
      sdpOffer,
    });

    // Notify participants about the incoming voice call so it appears in their notifications
    const targetRecipientIds: string[] = (participantIds || []).filter((id: string) => id !== user.id);
    
    // If no participantIds passed, notify other participants in conversation
    if (targetRecipientIds.length === 0) {
      const conv = await db.conversation.findUnique({
        where: { id: conversationId },
        include: {
          activity: { select: { participants: { select: { userId: true } }, organizerId: true } },
          travelPlan: { select: { participants: { select: { userId: true } }, organizerId: true } },
        },
      });

      if (conv) {
        const pids = [
          ...(conv.activity?.participants.map((p) => p.userId) || []),
          ...(conv.travelPlan?.participants.map((p) => p.userId) || []),
          conv.activity?.organizerId,
          conv.travelPlan?.organizerId,
        ].filter((id): id is string => Boolean(id) && id !== user.id);

        for (const pid of Array.from(new Set(pids))) {
          targetRecipientIds.push(pid);
        }
      }
    }

    for (const recipientId of targetRecipientIds) {
      db.notification.create({
        data: {
          userId: recipientId,
          type: "NEW_MESSAGE",
          title: "📞 Incoming Voice Call",
          body: `${callerName} is calling you on Travally...`,
          actionUrl: `/chats/${conversationId}`,
        },
      }).catch((e) => console.error("Call notification error:", e));
    }

    return NextResponse.json({ call });
  } catch (error) {
    console.error("POST /api/calls error:", error);
    return NextResponse.json(
      { error: "Failed to initiate call" },
      { status: 500 }
    );
  }
}
