import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/chats/[id]
 * Updates conversation / group details (e.g., group profile picture, title).
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: conversationId } = params;
    const body = await req.json();
    const { imageUrl, title } = body;

    const conversation = await db.conversation.findUnique({
      where: { id: conversationId },
      include: {
        activity: true,
        travelPlan: true,
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const isHost =
      (conversation.activity && conversation.activity.organizerId === user.id) ||
      (conversation.travelPlan && conversation.travelPlan.organizerId === user.id) ||
      user.role === "ADMIN";

    if (!isHost) {
      return NextResponse.json(
        { error: "Only the group host or organizer has permission to edit group settings." },
        { status: 403 }
      );
    }

    if (imageUrl) {
      if (conversation.activityId) {
        await db.activity.update({
          where: { id: conversation.activityId },
          data: { imageUrl },
        });
      } else if (conversation.travelPlanId) {
        await db.travelPlan.update({
          where: { id: conversation.travelPlanId },
          data: { imageUrl },
        });
      }
    }

    if (title && title.trim()) {
      await db.conversation.update({
        where: { id: conversationId },
        data: { title: title.trim() },
      });
    }

    return NextResponse.json({ success: true, imageUrl, title });
  } catch (error) {
    console.error("PATCH chat error:", error);
    return NextResponse.json({ error: "Failed to update group" }, { status: 500 });
  }
}
