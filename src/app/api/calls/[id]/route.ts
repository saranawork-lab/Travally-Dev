import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import {
  getCallById,
  answerCall,
  declineCall,
  endCall,
  addIceCandidate,
} from "@/lib/callSignaling";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const call = await getCallById(params.id);
    if (!call) {
      return NextResponse.json({ call: null, ended: true }, { status: 200 });
    }

    return NextResponse.json({ call });
  } catch (error) {
    console.error("GET /api/calls/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch call" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, sdpAnswer, candidate, fromCaller } = body;

    const call = await getCallById(params.id);
    if (!call) {
      return NextResponse.json(
        { call: null, ended: true, message: "Call has ended" },
        { status: 200 }
      );
    }

    let updated = call;

    switch (action) {
      case "ANSWER":
        updated = (await answerCall(params.id, user.id, sdpAnswer)) || call;
        break;

      case "DECLINE": {
        const wasRinging = call.status === "RINGING";
        updated = (await declineCall(params.id)) || call;

        // Log missed call notification for recipient
        if (wasRinging && call.conversationId) {
          try {
            await db.message.create({
              data: {
                conversationId: call.conversationId,
                senderId: call.callerId,
                content: `📞 Declined voice call from ${call.callerName}`,
              },
            });

            if (user.id !== call.callerId) {
              await db.notification.create({
                data: {
                  userId: user.id,
                  type: "NEW_MESSAGE",
                  title: "📞 Missed Call",
                  body: `You missed a voice call from ${call.callerName}`,
                  actionUrl: `/chats/${call.conversationId}`,
                },
              });
            }
          } catch (e) {
            console.error("Error creating missed call record:", e);
          }
        }
        break;
      }

      case "END": {
        const wasNeverConnected = call.status === "RINGING";
        updated = (await endCall(params.id)) || call;

        if (wasNeverConnected && call.conversationId) {
          try {
            await db.message.create({
              data: {
                conversationId: call.conversationId,
                senderId: call.callerId,
                content: `📞 Missed voice call from ${call.callerName}`,
              },
            });

            const recipientIds = call.participantIds.filter(
              (id) => id !== call.callerId
            );

            for (const recipientId of recipientIds) {
              await db.notification.create({
                data: {
                  userId: recipientId,
                  type: "NEW_MESSAGE",
                  title: "📞 Missed Call",
                  body: `Missed voice call from ${call.callerName}`,
                  actionUrl: `/chats/${call.conversationId}`,
                },
              });
            }
          } catch (e) {
            console.error("Error creating missed call notification:", e);
          }
        }
        break;
      }

      case "ICE_CANDIDATE":
        await addIceCandidate(params.id, Boolean(fromCaller), candidate);
        break;

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json({ call: updated });
  } catch (error) {
    console.error("POST /api/calls/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to process call action" },
      { status: 500 }
    );
  }
}
