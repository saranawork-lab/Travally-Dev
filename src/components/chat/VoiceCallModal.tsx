"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Phone,
  PhoneOff,
  PhoneCall,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Check,
  X,
  ShieldCheck,
  Radio,
  AlertCircle,
  Sparkles,
  MapPin,
} from "lucide-react";

export interface CallParticipant {
  id: string;
  displayName: string;
  avatarUrl?: string;
  isHost?: boolean;
}

interface VoiceCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationTitle?: string;
  conversationId: string;
  isGroup: boolean;
  otherParticipants: CallParticipant[];
  currentUser: any;
  activeCallId?: string | null;
  isIncomingCall?: boolean;
  incomingCallOffer?: any;
  onCallEnded?: (durationSecs: number, participantNames: string[]) => void;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun.cloudflare.com:3478" },
    { urls: "stun:stun.services.mozilla.com" },
  ],
  iceCandidatePoolSize: 10,
};

export const VoiceCallModal: React.FC<VoiceCallModalProps> = ({
  isOpen,
  onClose,
  conversationTitle,
  conversationId,
  isGroup,
  otherParticipants,
  currentUser,
  activeCallId: initialCallId,
  isIncomingCall = false,
  incomingCallOffer,
  onCallEnded,
}) => {
  const hasMultipleOthers = otherParticipants.length > 1;
  const [phase, setPhase] = useState<"SELECT_MEMBERS" | "ACTIVE_CALL">(
    isIncomingCall || !hasMultipleOthers ? "ACTIVE_CALL" : "SELECT_MEMBERS"
  );

  const [selectedIds, setSelectedIds] = useState<string[]>(
    otherParticipants.map((p) => p.id)
  );

  const [callStatus, setCallStatus] = useState<
    "RINGING" | "CONNECTED" | "DECLINED" | "ENDED"
  >("RINGING");
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [micError, setMicError] = useState<string | null>(null);

  const [callId, setCallId] = useState<string | null>(initialCallId || null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  // Clean up all WebRTC media streams & connections
  const cleanupWebRTC = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (timerRef.current) clearInterval(timerRef.current);

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
  };

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedIds(otherParticipants.map((p) => p.id));
      setPhase(
        isIncomingCall || !hasMultipleOthers ? "ACTIVE_CALL" : "SELECT_MEMBERS"
      );
      setCallStatus("RINGING");
      setCallDuration(0);
      setIsMuted(false);
      setIsSpeakerOn(true);
      setMicError(null);
      setCallId(initialCallId || null);
    } else {
      cleanupWebRTC();
    }
    return () => {
      cleanupWebRTC();
    };
  }, [isOpen, initialCallId, isIncomingCall]);

  // Handle call timer when CONNECTED
  useEffect(() => {
    if (callStatus === "CONNECTED") {
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [callStatus]);

  // Handle Mute Mic toggle
  useEffect(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !isMuted;
      });
    }
  }, [isMuted]);

  // Handle Speaker toggle
  useEffect(() => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = !isSpeakerOn;
    }
  }, [isSpeakerOn]);

  // Setup WebRTC connection and signaling
  const initWebRTC = async (existingCallId?: string) => {
    try {
      // 1. Get microphone access
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        localStreamRef.current = stream;
      } catch (err: any) {
        console.warn("Microphone access unavailable or denied:", err);
        setMicError("Microphone permission required for outgoing audio.");
      }

      // 2. Initialize RTCPeerConnection with Google STUN
      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcRef.current = pc;

      // Add local audio tracks if available
      if (stream) {
        stream.getAudioTracks().forEach((track) => {
          pc.addTrack(track, stream!);
        });
      }

      // Receive remote audio track
      pc.ontrack = (event) => {
        if (remoteAudioRef.current && event.streams[0]) {
          remoteAudioRef.current.srcObject = event.streams[0];
          remoteAudioRef.current.play().catch(() => {});
        }
      };

      let currentCallId = existingCallId || callId;

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && currentCallId) {
          fetch(`/api/calls/${currentCallId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "ICE_CANDIDATE",
              fromCaller: !isIncomingCall,
              candidate: event.candidate,
            }),
          }).catch(() => {});
        }
      };

      // 3. Either create Offer (Caller) or create Answer (Recipient)
      if (isIncomingCall && incomingCallOffer && currentCallId) {
        // RECIPIENT: Set remote offer and create answer
        await pc.setRemoteDescription(
          new RTCSessionDescription(incomingCallOffer)
        );
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        await fetch(`/api/calls/${currentCallId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "ANSWER",
            sdpAnswer: answer,
          }),
        });

        setCallStatus("CONNECTED");
      } else {
        // CALLER: Create offer and initiate call
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
        });
        await pc.setLocalDescription(offer);

        const res = await fetch("/api/calls", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId,
            isGroup: hasMultipleOthers,
            participantIds: selectedIds,
            sdpOffer: offer,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          currentCallId = data.call?.id;
          setCallId(currentCallId);
        }
      }

      // 4. Poll call status & exchange signaling state
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(async () => {
        if (!currentCallId) return;

        try {
          const res = await fetch(`/api/calls/${currentCallId}`);
          if (!res.ok) return;

          const data = await res.json();
          const call = data.call;
          if (!call) return;

          if (call.status === "DECLINED") {
            setCallStatus("DECLINED");
            setTimeout(() => {
              handleEndCall();
            }, 1800);
            return;
          }

          if (call.status === "ENDED") {
            setCallStatus("ENDED");
            setTimeout(() => {
              onClose();
            }, 600);
            return;
          }

          // If caller waiting for recipient answer
          if (!isIncomingCall && call.status === "CONNECTED" && call.sdpAnswer) {
            if (pc.signalingState !== "stable" && !pc.currentRemoteDescription) {
              await pc.setRemoteDescription(
                new RTCSessionDescription(call.sdpAnswer)
              );
            }
            setCallStatus("CONNECTED");
          }

          // Apply remote candidates
          const candidatesToApply = isIncomingCall
            ? call.callerCandidates
            : call.recipientCandidates;

          if (candidatesToApply && candidatesToApply.length > 0) {
            for (const cand of candidatesToApply) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(cand));
              } catch {
                // ignore duplicate candidate
              }
            }
          }
        } catch (e) {
          console.error("Signaling poll error:", e);
        }
      }, 1200);
    } catch (err) {
      console.error("WebRTC initialization error:", err);
    }
  };

  // Trigger call initiation when entering ACTIVE_CALL
  useEffect(() => {
    if (isOpen && phase === "ACTIVE_CALL") {
      initWebRTC(callId || undefined);
    }
  }, [isOpen, phase]);

  if (!isOpen) return null;

  const toggleSelectMember = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === otherParticipants.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(otherParticipants.map((p) => p.id));
    }
  };

  const handleStartCall = () => {
    if (selectedIds.length === 0) return;
    setPhase("ACTIVE_CALL");
  };

  const handleEndCall = async () => {
    setCallStatus("ENDED");
    cleanupWebRTC();

    if (callId) {
      fetch(`/api/calls/${callId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "END" }),
      }).catch(() => {});
    }

    const participatingNames = otherParticipants
      .filter((p) => selectedIds.includes(p.id))
      .map((p) => p.displayName);

    if (onCallEnded) {
      onCallEnded(callDuration, participatingNames);
    }

    setTimeout(() => {
      onClose();
    }, 400);
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const activeCallingParticipants = otherParticipants.filter((p) =>
    selectedIds.includes(p.id)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-fade-in select-none">
      {/* Hidden audio element for receiving remote peer audio */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

      {/* ── PHASE 1: GROUP CALL PARTICIPANT SELECTOR ── */}
      {phase === "SELECT_MEMBERS" ? (
        <div className="w-full max-w-md bg-white dark:bg-[#111815] rounded-3xl border border-slate-200 dark:border-emerald-950/80 shadow-2xl p-5 sm:p-6 space-y-4 animate-scale-up">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-emerald-950/60">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Start Group Voice Call
              </h2>
              <p className="text-xs text-slate-500">
                Choose who you want to include in this voice call
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#18241f] transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between py-1">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {selectedIds.length} of {otherParticipants.length} selected
            </span>
            <button
              type="button"
              onClick={toggleSelectAll}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              {selectedIds.length === otherParticipants.length
                ? "Deselect All"
                : "Select All"}
            </button>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 scrollbar-none">
            {otherParticipants.map((member) => {
              const isChecked = selectedIds.includes(member.id);
              return (
                <label
                  key={member.id}
                  onClick={() => toggleSelectMember(member.id)}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                    isChecked
                      ? "bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800/80 shadow-xs"
                      : "bg-slate-50/50 dark:bg-[#16201b]/50 border-slate-200/80 dark:border-emerald-950/60 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {member.avatarUrl ? (
                      <img
                        src={member.avatarUrl}
                        alt={member.displayName}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-500/20"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-bold text-sm flex items-center justify-center shadow-xs">
                        {member.displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {member.displayName}
                        </span>
                        {member.isHost && (
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300">
                            Host
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        Group Traveler
                      </span>
                    </div>
                  </div>

                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                      isChecked
                        ? "bg-emerald-500 text-white shadow-xs"
                        : "border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-[#1a2620]"
                    }`}
                  >
                    {isChecked && <Check className="w-4 h-4 stroke-[3]" />}
                  </div>
                </label>
              );
            })}
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-emerald-950/60">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1a2620] transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleStartCall}
              disabled={selectedIds.length === 0}
              className="px-6 py-2.5 rounded-full text-xs font-extrabold text-emerald-950 dark:text-emerald-200 bg-gradient-to-r from-emerald-100 via-teal-50 to-emerald-100 dark:from-emerald-950/80 dark:to-teal-950/70 hover:from-emerald-200 hover:to-teal-100 border border-emerald-300/90 dark:border-emerald-700 shadow-xs transition disabled:opacity-40 flex items-center gap-2"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-300" />
              <span>Start Call ({selectedIds.length})</span>
            </button>
          </div>
        </div>
      ) : (
        /* ── PHASE 2: ACTIVE VOICE CALL OVERLAY (LUMINOUS SPATIAL AUDIO CAPSULE) ── */
        <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-[38px] sm:rounded-[44px] p-6 sm:p-8 flex flex-col items-center justify-between min-h-[440px] sm:min-h-[480px] animate-scale-up overflow-hidden backdrop-blur-2xl bg-gradient-to-b from-white/95 via-emerald-50/60 to-teal-50/85 dark:from-[#0d1613]/95 dark:via-[#08100d]/95 dark:to-[#040806]/98 border border-white/80 dark:border-emerald-500/25 shadow-[0_25px_80px_-15px_rgba(16,185,129,0.25),0_10px_30px_-5px_rgba(0,0,0,0.05)] dark:shadow-[0_30px_90px_-15px_rgba(0,0,0,0.9),0_0_40px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/20 text-slate-900 dark:text-white">
          {/* Ambient Aura Background */}
          <div className="absolute -top-28 inset-x-0 h-56 bg-gradient-to-b from-emerald-400/20 via-teal-400/10 to-transparent blur-3xl pointer-events-none animate-aura-breathe" />
          <div className="absolute -bottom-24 -left-20 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top header status */}
          <div className="w-full flex items-center justify-between z-10 text-xs">
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/25 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300 font-bold text-[11px] shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>WebRTC Direct Audio</span>
            </div>

            <div className="flex items-center gap-2">
              {callStatus === "RINGING" ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 font-semibold text-xs animate-pulse">
                  <Radio className="w-3.5 h-3.5" />
                  <span>Ringing...</span>
                </div>
              ) : callStatus === "DECLINED" ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-bold text-xs">
                  <PhoneOff className="w-3.5 h-3.5" />
                  <span>Call Declined</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 dark:bg-white/10 border border-slate-200/80 dark:border-white/10 text-slate-800 dark:text-emerald-300 font-mono text-xs font-bold tracking-wider shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{formatTimer(callDuration)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Call participants visual area */}
          <div className="my-auto w-full flex flex-col items-center justify-center py-5 z-10">
            {!hasMultipleOthers || activeCallingParticipants.length === 1 ? (
              /* Single 1:1 call layout */
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="relative my-2">
                  {/* Concentric Sonic Radar Rings */}
                  <div className="absolute -inset-6 rounded-full border border-emerald-400/25 dark:border-emerald-400/30 animate-radar-ripple pointer-events-none" />
                  <div className="absolute -inset-3 rounded-full border border-teal-400/35 dark:border-teal-400/40 animate-ping opacity-50 pointer-events-none" />
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-emerald-500/20 to-teal-400/20 blur-md" />

                  {activeCallingParticipants[0]?.avatarUrl ? (
                    <img
                      src={activeCallingParticipants[0]?.avatarUrl}
                      alt={activeCallingParticipants[0]?.displayName}
                      className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover relative z-10 ring-4 ring-white dark:ring-[#131c18] shadow-2xl"
                    />
                  ) : (
                    <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-400 text-white font-black text-3xl sm:text-4xl flex items-center justify-center relative z-10 ring-4 ring-white dark:ring-[#131c18] shadow-2xl">
                      {(
                        activeCallingParticipants[0]?.displayName || "U"
                      ).charAt(0).toUpperCase()}
                    </div>
                  )}

                  {/* Corner Voice Beacon */}
                  <div className="absolute -bottom-1 -right-1 z-20 w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md ring-2 ring-white dark:ring-[#08110e]">
                    <Phone className="w-4 h-4 animate-pulse" />
                  </div>
                </div>

                <div className="mt-2">
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                    {activeCallingParticipants[0]?.displayName ||
                      conversationTitle ||
                      "Travel Companion"}
                  </h2>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
                    {callStatus === "RINGING"
                      ? isIncomingCall
                        ? "Incoming voice invitation..."
                        : "Waiting for answer..."
                      : callStatus === "DECLINED"
                      ? "User declined the call"
                      : "Voice Connected"}
                  </p>
                </div>

                {/* Animated Frequency Equalizer Bars */}
                <div className="flex items-center justify-center gap-1.5 h-8 my-3">
                  {[0.35, 0.65, 0.95, 0.55, 0.85, 1.0, 0.7, 0.9, 0.75, 0.6, 0.85, 0.45, 0.7, 0.35].map(
                    (scale, i) => (
                      <span
                        key={i}
                        className="w-1 sm:w-1.5 rounded-full bg-gradient-to-t from-emerald-600 via-emerald-500 to-teal-400 dark:from-emerald-400 dark:to-teal-300 transition-all"
                        style={{
                          height: `${Math.round(scale * 28)}px`,
                          animation:
                            callStatus === "CONNECTED"
                              ? "audioWave 1.1s ease-in-out infinite"
                              : callStatus === "RINGING"
                              ? "audioWave 1.8s ease-in-out infinite"
                              : "none",
                          animationDelay: `${i * 80}ms`,
                          opacity: callStatus === "CONNECTED" ? 1 : 0.4,
                        }}
                      />
                    )
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 tracking-wide uppercase">
                  <Sparkles className="w-3 h-3" />
                  <span>
                    {callStatus === "CONNECTED"
                      ? "Encrypted HD Voice Stream"
                      : "Establishing peer-to-peer connection..."}
                  </span>
                </div>
              </div>
            ) : (
              /* Group Call Grid layout */
              <div className="w-full space-y-4">
                <h3 className="text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  Group Call • {activeCallingParticipants.length + 1} Travelers
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {/* Self card */}
                  <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 flex flex-col items-center text-center shadow-xs">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-600 to-teal-700 text-white font-bold flex items-center justify-center text-sm mb-2 shadow-xs ring-2 ring-emerald-500/30">
                      {(currentUser?.displayName || "You").charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-full">
                      You {isMuted ? "(Muted)" : ""}
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-semibold">
                      {isMuted ? "Mic Off" : "Active"}
                    </span>
                  </div>

                  {/* Remote participants */}
                  {activeCallingParticipants.map((member) => (
                    <div
                      key={member.id}
                      className="p-3.5 rounded-2xl bg-white/70 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 flex flex-col items-center text-center shadow-xs"
                    >
                      {member.avatarUrl ? (
                        <img
                          src={member.avatarUrl}
                          alt={member.displayName}
                          className="w-12 h-12 rounded-full object-cover mb-2 ring-2 ring-emerald-500/40"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-teal-800 text-white font-bold flex items-center justify-center text-sm mb-2 shadow-xs">
                          {member.displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-full">
                        {member.displayName}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                        {callStatus === "RINGING"
                          ? "Ringing..."
                          : "Connected 🎙️"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mic Permission notice if applicable */}
            {micError && (
              <div className="mt-4 px-3.5 py-2 rounded-2xl bg-amber-50 dark:bg-amber-500/15 border border-amber-300 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2 text-center">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{micError}</span>
              </div>
            )}
          </div>

          {/* Bottom Call Controls Floating Island Dock */}
          <div className="w-full flex items-center justify-center gap-5 sm:gap-7 z-10 pt-4 mt-2 border-t border-slate-200/80 dark:border-white/10">
            {/* Mute Mic Button */}
            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center transition-all active:scale-95 shadow-md cursor-pointer group ${
                isMuted
                  ? "bg-rose-50 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-500/40 shadow-rose-500/10"
                  : "bg-white dark:bg-white/10 text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/20 border border-slate-200 dark:border-white/15 shadow-slate-200/50"
              }`}
              title={isMuted ? "Unmute microphone" : "Mute microphone"}
            >
              {isMuted ? (
                <MicOff className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              ) : (
                <Mic className="w-5 h-5 group-hover:scale-110 transition-transform" />
              )}
              <span className="text-[10px] font-bold mt-1">
                {isMuted ? "Unmute" : "Mute"}
              </span>
            </button>

            {/* Speaker / Volume Button */}
            <button
              type="button"
              onClick={() => setIsSpeakerOn(!isSpeakerOn)}
              className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center transition-all active:scale-95 shadow-md cursor-pointer group ${
                !isSpeakerOn
                  ? "bg-rose-50 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-500/40 shadow-rose-500/10"
                  : "bg-white dark:bg-white/10 text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/20 border border-slate-200 dark:border-white/15 shadow-slate-200/50"
              }`}
              title={isSpeakerOn ? "Turn speaker off" : "Turn speaker on"}
            >
              {isSpeakerOn ? (
                <Volume2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
              ) : (
                <VolumeX className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              )}
              <span className="text-[10px] font-bold mt-1">Speaker</span>
            </button>

            {/* End Call Button */}
            <button
              type="button"
              onClick={handleEndCall}
              className="w-16 h-14 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white flex flex-col items-center justify-center transition-all active:scale-90 shadow-xl shadow-rose-600/35 hover:shadow-rose-600/50 cursor-pointer"
              title="End voice call"
            >
              <PhoneOff className="w-5 h-5" />
              <span className="text-[10px] font-extrabold mt-0.5">End</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

