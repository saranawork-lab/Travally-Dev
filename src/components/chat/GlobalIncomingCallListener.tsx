"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { Phone, PhoneOff, Radio } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ringtone } from "@/lib/ringtone";
import { VoiceCallModal } from "@/components/chat/VoiceCallModal";

export const GlobalIncomingCallListener: React.FC = () => {
  const { currentUser } = useAuth();
  const pathname = usePathname();
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [incomingCallOffer, setIncomingCallOffer] = useState<any>(null);

  const prevCallIdRef = useRef<string | null>(null);

  // Poll for active incoming calls
  useEffect(() => {
    if (!currentUser) return;

    // Do not poll if user is actively in a full call modal
    if (isCallModalOpen) return;

    let isMounted = true;

    const checkIncomingCalls = async () => {
      if (typeof document !== "undefined" && document.hidden) return;
      try {
        const res = await fetch("/api/calls");
        if (!res.ok) return;

        const data = await res.json();
        const call = data.activeCall || data.incomingCall;

        if (!isMounted) return;

        if (call && call.status === "RINGING" && call.callerId !== currentUser.id) {
          if (prevCallIdRef.current !== call.id) {
            prevCallIdRef.current = call.id;
            setIncomingCall(call);
            // Play incoming ringtone
            ringtone.playIncoming();
          }
        } else {
          if (prevCallIdRef.current) {
            prevCallIdRef.current = null;
            setIncomingCall(null);
            ringtone.stop();
          }
        }
      } catch (err) {
        // network error ignore
      }
    };

    checkIncomingCalls();
    const interval = setInterval(checkIncomingCalls, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
      ringtone.stop();
    };
  }, [currentUser, isCallModalOpen]);

  const handleAccept = () => {
    if (!incomingCall) return;
    ringtone.stop();
    setActiveCallId(incomingCall.id);
    setIncomingCallOffer(incomingCall.sdpOffer);
    setIsCallModalOpen(true);
    setIncomingCall(null);
    prevCallIdRef.current = null;
  };

  const handleDecline = async () => {
    if (!incomingCall) return;
    ringtone.stop();
    const currentId = incomingCall.id;
    setIncomingCall(null);
    prevCallIdRef.current = null;

    try {
      await fetch(`/api/calls/${currentId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "DECLINE" }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  // If inside chat room, the chat page will render VoiceCallModal internally
  const isInsideSpecificChat = pathname?.startsWith("/chats/") && pathname !== "/chats";

  return (
    <>
      {/* Floating Incoming Call Banner */}
      {incomingCall && !isInsideSpecificChat && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-[92%] max-w-md animate-bounce-in select-none">
          <div className="bg-slate-900/95 dark:bg-[#0c1410]/95 backdrop-blur-2xl text-white rounded-3xl p-4 shadow-[0_20px_60px_rgba(0,0,0,0.5)] border border-emerald-500/40 flex items-center justify-between gap-3">
            {/* Caller Info */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-md">
                  {incomingCall.callerAvatar ? (
                    <img
                      src={incomingCall.callerAvatar}
                      alt={incomingCall.callerName}
                      className="w-full h-full object-cover rounded-[14px]"
                    />
                  ) : (
                    <div className="w-full h-full bg-emerald-900 flex items-center justify-center font-bold text-lg text-emerald-200 rounded-[14px]">
                      {(incomingCall.callerName || "U").charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                {/* Ringing wave pulse dot */}
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-slate-900"></span>
                </span>
              </div>

              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                  <Radio className="w-3 h-3 animate-pulse" />
                  <span>Incoming Voice Call...</span>
                </span>
                <h4 className="font-extrabold text-sm truncate text-white">
                  {incomingCall.callerName}
                </h4>
              </div>
            </div>

            {/* Action Buttons: Decline & Accept */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleDecline}
                className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-all duration-200 active:scale-90"
                title="Decline Call"
              >
                <PhoneOff className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleAccept}
                className="px-3.5 py-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/30 transition-all duration-200 active:scale-95 animate-pulse"
                title="Accept Voice Call"
              >
                <Phone className="w-4 h-4 fill-white" />
                <span>Answer</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full WebRTC Call Modal when answering from any screen */}
      {isCallModalOpen && activeCallId && (
        <VoiceCallModal
          isOpen={isCallModalOpen}
          onClose={() => {
            setIsCallModalOpen(false);
            setActiveCallId(null);
            setIncomingCallOffer(null);
          }}
          conversationId={incomingCall?.conversationId || ""}
          isGroup={false}
          otherParticipants={[
            {
              id: incomingCall?.callerId || "",
              displayName: incomingCall?.callerName || "Companion",
              avatarUrl: incomingCall?.callerAvatar,
            },
          ]}
          currentUser={currentUser}
          activeCallId={activeCallId}
          isIncomingCall={true}
          incomingCallOffer={incomingCallOffer}
        />
      )}
    </>
  );
};
