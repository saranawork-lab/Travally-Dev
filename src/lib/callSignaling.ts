// MongoDB + In-Memory hybrid WebRTC Call Signaling Manager
// Coordinates real-time P2P audio calling between users reliably across serverless workers.

import { getDb } from "@/lib/mongo";

export interface ActiveCall {
  id: string;
  conversationId: string;
  callerId: string;
  callerName: string;
  callerAvatar?: string;
  isGroup: boolean;
  participantIds: string[];
  status: "RINGING" | "CONNECTED" | "DECLINED" | "ENDED";
  sdpOffer?: any;
  sdpAnswer?: any;
  callerCandidates: any[];
  recipientCandidates: any[];
  createdAt: number;
  connectedAt?: number;
  endedAt?: number;
}

// In-memory cache for ultra-low latency within the same process
declare global {
  // eslint-disable-next-line no-var
  var __travally_active_calls: Map<string, ActiveCall> | undefined;
}

const activeCalls: Map<string, ActiveCall> =
  globalThis.__travally_active_calls || new Map();

if (process.env.NODE_ENV !== "production") {
  globalThis.__travally_active_calls = activeCalls;
}

export const startCall = async (params: {
  conversationId: string;
  callerId: string;
  callerName: string;
  callerAvatar?: string;
  isGroup: boolean;
  participantIds: string[];
  sdpOffer?: any;
}): Promise<ActiveCall> => {
  const now = Date.now();
  const id = `call_${now}_${Math.random().toString(36).substring(2, 9)}`;

  const newCall: ActiveCall = {
    id,
    conversationId: params.conversationId,
    callerId: params.callerId,
    callerName: params.callerName,
    callerAvatar: params.callerAvatar,
    isGroup: params.isGroup,
    participantIds: params.participantIds || [],
    status: "RINGING",
    sdpOffer: params.sdpOffer,
    callerCandidates: [],
    recipientCandidates: [],
    createdAt: now,
  };

  // Cache in-memory
  activeCalls.set(id, newCall);

  try {
    const mongo = await getDb();
    // End any lingering ringing calls for this conversation
    await mongo.collection("active_calls").updateMany(
      { conversationId: params.conversationId, status: { $ne: "ENDED" } },
      { $set: { status: "ENDED", endedAt: now } }
    );

    await mongo.collection("active_calls").insertOne({
      ...newCall,
      _id: id as any,
    });
  } catch (err) {
    console.error("startCall mongo error:", err);
  }

  return newCall;
};

export const getActiveCallByConversation = async (
  conversationId: string
): Promise<ActiveCall | null> => {
  try {
    const mongo = await getDb();
    const cutoff = Date.now() - 300000; // 5 min
    const doc = await mongo.collection("active_calls").findOne({
      conversationId,
      status: { $in: ["RINGING", "CONNECTED"] },
      createdAt: { $gt: cutoff },
    });

    if (doc) {
      return {
        id: doc.id || doc._id.toString(),
        conversationId: doc.conversationId,
        callerId: doc.callerId,
        callerName: doc.callerName,
        callerAvatar: doc.callerAvatar,
        isGroup: doc.isGroup,
        participantIds: doc.participantIds || [],
        status: doc.status,
        sdpOffer: doc.sdpOffer,
        sdpAnswer: doc.sdpAnswer,
        callerCandidates: doc.callerCandidates || [],
        recipientCandidates: doc.recipientCandidates || [],
        createdAt: doc.createdAt,
      };
    }
  } catch (err) {
    console.error("getActiveCallByConversation mongo error:", err);
  }

  // Fallback to in-memory
  let found: ActiveCall | null = null;
  activeCalls.forEach((call) => {
    if (
      !found &&
      call.conversationId === conversationId &&
      (call.status === "RINGING" || call.status === "CONNECTED")
    ) {
      found = call;
    }
  });
  return found;
};

export const hasAnyActiveCalls = async (): Promise<boolean> => {
  try {
    const mongo = await getDb();
    const cutoff = Date.now() - 45000;
    const count = await mongo.collection("active_calls").countDocuments({
      status: "RINGING",
      createdAt: { $gt: cutoff },
    });
    return count > 0;
  } catch {
    return activeCalls.size > 0;
  }
};

export const getActiveCallForUser = async (userId: string): Promise<ActiveCall | null> => {
  try {
    const mongo = await getDb();
    const cutoff = Date.now() - 45000; // 45 seconds ringing timeout
    const doc = await mongo.collection("active_calls").findOne({
      status: "RINGING",
      callerId: { $ne: userId },
      $or: [
        { participantIds: { $size: 0 } },
        { participantIds: userId },
      ],
      createdAt: { $gt: cutoff },
    });

    if (doc) {
      return {
        id: doc.id || doc._id.toString(),
        conversationId: doc.conversationId,
        callerId: doc.callerId,
        callerName: doc.callerName,
        callerAvatar: doc.callerAvatar,
        isGroup: doc.isGroup,
        participantIds: doc.participantIds || [],
        status: doc.status,
        sdpOffer: doc.sdpOffer,
        sdpAnswer: doc.sdpAnswer,
        callerCandidates: doc.callerCandidates || [],
        recipientCandidates: doc.recipientCandidates || [],
        createdAt: doc.createdAt,
      };
    }
  } catch (err) {
    console.error("getActiveCallForUser mongo error:", err);
  }

  // Fallback in-memory check
  let found: ActiveCall | null = null;
  activeCalls.forEach((call) => {
    if (
      !found &&
      call.status === "RINGING" &&
      call.callerId !== userId &&
      (call.participantIds.length === 0 || call.participantIds.includes(userId))
    ) {
      found = call;
    }
  });
  return found;
};

export const getCallById = async (callId: string): Promise<ActiveCall | null> => {
  try {
    const mongo = await getDb();
    const doc = await mongo.collection("active_calls").findOne({
      $or: [{ id: callId }, { _id: callId as any }],
    });

    if (doc) {
      return {
        id: doc.id || doc._id.toString(),
        conversationId: doc.conversationId,
        callerId: doc.callerId,
        callerName: doc.callerName,
        callerAvatar: doc.callerAvatar,
        isGroup: doc.isGroup,
        participantIds: doc.participantIds || [],
        status: doc.status,
        sdpOffer: doc.sdpOffer,
        sdpAnswer: doc.sdpAnswer,
        callerCandidates: doc.callerCandidates || [],
        recipientCandidates: doc.recipientCandidates || [],
        createdAt: doc.createdAt,
      };
    }
  } catch (err) {
    console.error("getCallById mongo error:", err);
  }
  return activeCalls.get(callId) || null;
};

export const answerCall = async (
  callId: string,
  recipientId: string,
  sdpAnswer?: any
): Promise<ActiveCall | null> => {
  const updateData: any = {
    status: "CONNECTED",
    connectedAt: Date.now(),
  };
  if (sdpAnswer) updateData.sdpAnswer = sdpAnswer;

  try {
    const mongo = await getDb();
    await mongo.collection("active_calls").updateOne(
      { $or: [{ id: callId }, { _id: callId as any }] },
      { $set: updateData }
    );
  } catch (err) {
    console.error("answerCall mongo error:", err);
  }

  const mem = activeCalls.get(callId);
  if (mem) {
    mem.status = "CONNECTED";
    mem.connectedAt = Date.now();
    if (sdpAnswer) mem.sdpAnswer = sdpAnswer;
  }

  return getCallById(callId);
};

export const declineCall = async (callId: string): Promise<ActiveCall | null> => {
  const updateData = {
    status: "DECLINED",
    endedAt: Date.now(),
  };

  try {
    const mongo = await getDb();
    await mongo.collection("active_calls").updateOne(
      { $or: [{ id: callId }, { _id: callId as any }] },
      { $set: updateData }
    );
  } catch (err) {
    console.error("declineCall mongo error:", err);
  }

  const mem = activeCalls.get(callId);
  if (mem) {
    mem.status = "DECLINED";
    mem.endedAt = Date.now();
  }

  return getCallById(callId);
};

export const endCall = async (callId: string): Promise<ActiveCall | null> => {
  const updateData = {
    status: "ENDED",
    endedAt: Date.now(),
  };

  try {
    const mongo = await getDb();
    await mongo.collection("active_calls").updateOne(
      { $or: [{ id: callId }, { _id: callId as any }] },
      { $set: updateData }
    );
  } catch (err) {
    console.error("endCall mongo error:", err);
  }

  const mem = activeCalls.get(callId);
  if (mem) {
    mem.status = "ENDED";
    mem.endedAt = Date.now();
  }

  return getCallById(callId);
};

export const addIceCandidate = async (
  callId: string,
  fromCaller: boolean,
  candidate: any
): Promise<boolean> => {
  const pushField = fromCaller ? "callerCandidates" : "recipientCandidates";

  try {
    const mongo = await getDb();
    await mongo.collection("active_calls").updateOne(
      { $or: [{ id: callId }, { _id: callId as any }] },
      { $push: { [pushField]: candidate } as any }
    );
  } catch (err) {
    console.error("addIceCandidate mongo error:", err);
  }

  const mem = activeCalls.get(callId);
  if (mem) {
    if (fromCaller) {
      mem.callerCandidates.push(candidate);
    } else {
      mem.recipientCandidates.push(candidate);
    }
  }

  return true;
};
