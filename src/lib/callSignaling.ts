// In-memory real-time WebRTC Call Signaling Manager
// Coordinates P2P audio calling between users without requiring third-party paid services.

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

// Global store to survive hot reload in development
declare global {
  // eslint-disable-next-line no-var
  var __travally_active_calls: Map<string, ActiveCall> | undefined;
}

const activeCalls: Map<string, ActiveCall> =
  globalThis.__travally_active_calls || new Map();

if (process.env.NODE_ENV !== "production") {
  globalThis.__travally_active_calls = activeCalls;
}

// Auto-cleanup stale calls older than 5 minutes
const cleanupStaleCalls = () => {
  const now = Date.now();
  activeCalls.forEach((call, id) => {
    if (call.status === "ENDED" || call.status === "DECLINED") {
      if (now - (call.endedAt || call.createdAt) > 60000) {
        activeCalls.delete(id);
      }
    } else if (call.status === "RINGING" && now - call.createdAt > 45000) {
      // Ringing timeout (45s without answer) -> mark as ended/missed
      call.status = "ENDED";
      call.endedAt = now;
    } else if (now - call.createdAt > 300000) {
      activeCalls.delete(id);
    }
  });
};

export const startCall = (params: {
  conversationId: string;
  callerId: string;
  callerName: string;
  callerAvatar?: string;
  isGroup: boolean;
  participantIds: string[];
  sdpOffer?: any;
}): ActiveCall => {
  cleanupStaleCalls();

  // End any existing call in this conversation
  activeCalls.forEach((call) => {
    if (call.conversationId === params.conversationId && call.status !== "ENDED") {
      call.status = "ENDED";
      call.endedAt = Date.now();
    }
  });

  const id = `call_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const newCall: ActiveCall = {
    id,
    conversationId: params.conversationId,
    callerId: params.callerId,
    callerName: params.callerName,
    callerAvatar: params.callerAvatar,
    isGroup: params.isGroup,
    participantIds: params.participantIds,
    status: "RINGING",
    sdpOffer: params.sdpOffer,
    callerCandidates: [],
    recipientCandidates: [],
    createdAt: Date.now(),
  };

  activeCalls.set(id, newCall);
  return newCall;
};

export const getActiveCallByConversation = (
  conversationId: string
): ActiveCall | null => {
  cleanupStaleCalls();
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

export const hasAnyActiveCalls = (): boolean => {
  return activeCalls.size > 0;
};

export const getActiveCallForUser = (userId: string): ActiveCall | null => {
  if (activeCalls.size === 0) return null;
  cleanupStaleCalls();
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

export const getCallById = (callId: string): ActiveCall | null => {
  return activeCalls.get(callId) || null;
};

export const answerCall = (
  callId: string,
  recipientId: string,
  sdpAnswer?: any
): ActiveCall | null => {
  const call = activeCalls.get(callId);
  if (!call || call.status !== "RINGING") return null;

  call.status = "CONNECTED";
  call.connectedAt = Date.now();
  if (sdpAnswer) call.sdpAnswer = sdpAnswer;

  return call;
};

export const declineCall = (callId: string): ActiveCall | null => {
  const call = activeCalls.get(callId);
  if (!call) return null;

  call.status = "DECLINED";
  call.endedAt = Date.now();
  return call;
};

export const endCall = (callId: string): ActiveCall | null => {
  const call = activeCalls.get(callId);
  if (!call) return null;

  call.status = "ENDED";
  call.endedAt = Date.now();
  return call;
};

export const addIceCandidate = (
  callId: string,
  fromCaller: boolean,
  candidate: any
): boolean => {
  const call = activeCalls.get(callId);
  if (!call) return false;

  if (fromCaller) {
    call.callerCandidates.push(candidate);
  } else {
    call.recipientCandidates.push(candidate);
  }
  return true;
};
