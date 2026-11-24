"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
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
  Volume1,
} from "lucide-react";
import { ringtone } from "@/lib/ringtone";

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
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
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
  const [needAudioUnlock, setNeedAudioUnlock] = useState(false);
  const [micSpeakingLevel, setMicSpeakingLevel] = useState(0);

  const [callId, setCallId] = useState<string | null>(initialCallId || null);

  const callIdRef = useRef<string | null>(initialCallId || null);
  const isInitializingRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const pendingIceCandidatesRef = useRef<any[]>([]);
  const appliedCandidatesRef = useRef<Set<string>>(new Set());
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Keep callIdRef in sync with prop updates
  useEffect(() => {
    if (initialCallId) {
      callIdRef.current = initialCallId;
      setCallId(initialCallId);
    }
  }, [initialCallId]);

  // Clean up all WebRTC media streams, audio ringtones & connections
  const cleanupWebRTC = useCallback(() => {
    ringtone.stop();
    if (pollRef.current) clearInterval(pollRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }

    if (pcRef.current) {
      try {
        pcRef.current.close();
      } catch {}
      pcRef.current = null;
    }

    isInitializingRef.current = false;
    appliedCandidatesRef.current.clear();
    pendingIceCandidatesRef.current = [];
    setMicSpeakingLevel(0);
  }, []);

  // Unlock browser audio upon any user interaction in modal
  const unlockAudio = useCallback(() => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current
        .play()
        .then(() => setNeedAudioUnlock(false))
        .catch(() => {});
    }
    if (audioContextRef.current && audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume().catch(() => {});
    }
  }, []);

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
      setNeedAudioUnlock(false);
      const targetId = initialCallId || null;
      callIdRef.current = targetId;
      setCallId(targetId);
      pendingIceCandidatesRef.current = [];
      appliedCandidatesRef.current.clear();

      // If outgoing call, play outgoing ring tone
      if (!isIncomingCall) {
        ringtone.playOutgoing();
      }
    } else {
      cleanupWebRTC();
    }

    const handleBeforeUnload = () => {
      const currentCallId = callIdRef.current;
      if (currentCallId) {
        navigator.sendBeacon(
          `/api/calls/${currentCallId}`,
          JSON.stringify({ action: "END" })
        );
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      cleanupWebRTC();
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isOpen, isIncomingCall, hasMultipleOthers, cleanupWebRTC]);

  // Handle call timer when CONNECTED
  useEffect(() => {
    if (callStatus === "CONNECTED") {
      ringtone.stop();
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    } else if (callStatus === "DECLINED" || callStatus === "ENDED") {
      ringtone.playCallEnded();
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

  // Start live microphone level analyzer for visual voice activity feedback
  const startMicLevelMeter = (stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.5;
      micAnalyserRef.current = analyser;

      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateMeter = () => {
        if (!analyser) return;
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setMicSpeakingLevel(Math.min(100, Math.round(avg * 1.5)));
        animFrameRef.current = requestAnimationFrame(updateMeter);
      };
      updateMeter();
    } catch (err) {
      console.warn("Could not start audio level meter:", err);
    }
  };

  // Setup WebRTC connection and signaling
  const initWebRTC = async (targetExistingId?: string) => {
    if (isInitializingRef.current) return;
    isInitializingRef.current = true;

    try {
      // 1. Get microphone access with robust fallback
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false,
        });
      } catch (err: any) {
        console.warn("Retrying microphone with basic constraints:", err);
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false,
          });
        } catch (err2: any) {
          console.error("Microphone access unavailable or denied:", err2);
          setMicError("Microphone permission required for outgoing audio.");
        }
      }

      if (stream) {
        localStreamRef.current = stream;
        stream.getAudioTracks().forEach((track) => {
          track.enabled = !isMuted;
        });
        startMicLevelMeter(stream);
      }

      // 2. Initialize RTCPeerConnection with STUN servers
      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcRef.current = pc;

      // Add local audio tracks if available
      if (stream) {
        stream.getAudioTracks().forEach((track) => {
          pc.addTrack(track, stream!);
        });
      }

      // Ensure transceiver direction is sendrecv
      try {
        const transceivers = pc.getTransceivers ? pc.getTransceivers() : [];
        const audioTransceiver = transceivers.find(
          (t) => t.receiver?.track?.kind === "audio"
        );
        if (audioTransceiver) {
          audioTransceiver.direction = "sendrecv";
        }
      } catch {}

      // Receive remote audio track
      pc.ontrack = (event) => {
        const remoteStream = event.streams[0] || new MediaStream([event.track]);
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = remoteStream;
          remoteAudioRef.current.volume = 1.0;
          remoteAudioRef.current.muted = !isSpeakerOn;
          const playPromise = remoteAudioRef.current.play();
          if (playPromise) {
            playPromise
              .then(() => setNeedAudioUnlock(false))
              .catch((e) => {
                console.warn("Audio autoplay blocked by browser policy:", e);
                setNeedAudioUnlock(true);
              });
          }
        }

        event.track.onunmute = () => {
          if (remoteAudioRef.current) {
            remoteAudioRef.current
              .play()
              .then(() => setNeedAudioUnlock(false))
              .catch(() => setNeedAudioUnlock(true));
          }
        };
      };

      // Monitor WebRTC connection states
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") {
          setCallStatus("CONNECTED");
          ringtone.stop();
        }
      };

      pc.oniceconnectionstatechange = () => {
        if (
          pc.iceConnectionState === "connected" ||
          pc.iceConnectionState === "completed"
        ) {
          setCallStatus("CONNECTED");
          ringtone.stop();
        }
      };

      // Resolve current call ID
      let resolvedCallId = targetExistingId || initialCallId || callIdRef.current;

      // Helper to flush buffered ICE candidates
      const flushCandidates = (targetId: string) => {
        if (pendingIceCandidatesRef.current.length > 0) {
          pendingIceCandidatesRef.current.forEach((cand) => {
            fetch(`/api/calls/${targetId}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "ICE_CANDIDATE",
                fromCaller: !isIncomingCall,
                candidate: cand,
              }),
            }).catch(() => {});
          });
          pendingIceCandidatesRef.current = [];
        }
      };

      // Handle ICE candidates with clean JSON serialization
      pc.onicecandidate = (event) => {
        if (event.candidate && event.candidate.candidate) {
          const cand = event.candidate.toJSON
            ? event.candidate.toJSON()
            : {
                candidate: event.candidate.candidate,
                sdpMid: event.candidate.sdpMid,
                sdpMLineIndex: event.candidate.sdpMLineIndex,
              };

          const activeId = callIdRef.current;
          if (activeId) {
            fetch(`/api/calls/${activeId}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "ICE_CANDIDATE",
                fromCaller: !isIncomingCall,
                candidate: cand,
              }),
            }).catch(() => {});
          } else {
            pendingIceCandidatesRef.current.push(cand);
          }
        }
      };

      // 3. Either create Offer (Caller) or create Answer (Recipient)
      if (isIncomingCall && resolvedCallId) {
        // RECIPIENT: Set remote offer and create answer
        callIdRef.current = resolvedCallId;
        setCallId(resolvedCallId);

        let offerToUse = incomingCallOffer;
        if (!offerToUse) {
          try {
            const res = await fetch(`/api/calls/${resolvedCallId}`);
            if (res.ok) {
              const data = await res.json();
              offerToUse = data.call?.sdpOffer;
            }
          } catch {}
        }

        if (offerToUse) {
          await pc.setRemoteDescription(new RTCSessionDescription(offerToUse));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          const answerPayload = {
            type: answer.type,
            sdp: answer.sdp,
          };

          await fetch(`/api/calls/${resolvedCallId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "ANSWER",
              sdpAnswer: answerPayload,
            }),
          });

          flushCandidates(resolvedCallId);
          setCallStatus("CONNECTED");
        }
      } else {
        // CALLER: Create offer and initiate call
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
        });
        await pc.setLocalDescription(offer);

        const offerPayload = {
          type: offer.type,
          sdp: offer.sdp,
        };

        const res = await fetch("/api/calls", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId,
            isGroup: hasMultipleOthers,
            participantIds: selectedIds,
            sdpOffer: offerPayload,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          resolvedCallId = data.call?.id;
          if (resolvedCallId) {
            callIdRef.current = resolvedCallId;
            setCallId(resolvedCallId);
            flushCandidates(resolvedCallId);
          }
        }
      }

      // 4. Poll call status & exchange signaling state
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(async () => {
        const currentActiveId = callIdRef.current;
        if (!currentActiveId) return;

        try {
          const res = await fetch(`/api/calls/${currentActiveId}`);
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
            }, 800);
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

          // Apply remote candidates ONLY if remote description is already set
          if (pc.currentRemoteDescription) {
            const candidatesToApply = isIncomingCall
              ? call.callerCandidates
              : call.recipientCandidates;

            if (candidatesToApply && candidatesToApply.length > 0) {
              for (const cand of candidatesToApply) {
                if (cand && cand.candidate) {
                  const candHash = cand.candidate;
                  if (!appliedCandidatesRef.current.has(candHash)) {
                    appliedCandidatesRef.current.add(candHash);
                    try {
                      await pc.addIceCandidate(new RTCIceCandidate(cand));
                    } catch (e) {
                      console.warn("Failed to add ICE candidate", e);
                    }
                  }
                }
              }
            }
          }
        } catch (e) {
          console.error("Signaling poll error:", e);
        }
      }, 800);
    } catch (err) {
      console.error("WebRTC initialization error:", err);
    } finally {
      isInitializingRef.current = false;
    }
  };

  // Trigger call initiation when entering ACTIVE_CALL
  useEffect(() => {
    if (isOpen && phase === "ACTIVE_CALL") {
      const targetId = initialCallId || callIdRef.current || undefined;
      initWebRTC(targetId);
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
    unlockAudio();
    setPhase("ACTIVE_CALL");
  };

  const handleEndCall = async () => {
    setCallStatus("ENDED");
    const activeId = callIdRef.current;
    cleanupWebRTC();

    if (activeId) {
      fetch(`/api/calls/${activeId}`, {
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

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainingSecs
      .toString()
      .padStart(2, "0")}`;
  };

  const activeCalledParticipants = otherParticipants.filter((p) =>
    selectedIds.includes(p.id)
  );

  return (
    <div
      onClick={unlockAudio}
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xl animate-fade-in select-none"
    >
      {/* Hidden HTML Audio Element to play remote WebRTC voice streams directly */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

      {/* PHASE 1: SELECT GROUP MEMBERS */}
      {phase === "SELECT_MEMBERS" && (
        <div className="w-full max-w-md bg-white dark:bg-[#111815] rounded-3xl border border-slate-200 dark:border-emerald-950/80 shadow-2xl p-6 space-y-5 animate-scale-in text-slate-900 dark:text-white">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-emerald-950/60">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <PhoneCall className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Start Group Voice Call
                </h3>
                <p className="text-xs text-slate-500">
                  Select companions to invite into this encrypted room.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-emerald-950/50 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center justify-between px-1 text-xs">
            <span className="font-bold text-slate-600 dark:text-slate-400">
              Members ({selectedIds.length}/{otherParticipants.length} selected)
            </span>
            <button
              type="button"
              onClick={toggleSelectAll}
              className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              {selectedIds.length === otherParticipants.length
                ? "Deselect All"
                : "Select All"}
            </button>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
            {otherParticipants.map((p) => {
              const isSelected = selectedIds.includes(p.id);
              return (
                <div
                  key={p.id}
                  onClick={() => toggleSelectMember(p.id)}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition cursor-pointer select-none ${
                    isSelected
                      ? "bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800"
                      : "bg-slate-50 dark:bg-[#16201b] border-slate-200/80 dark:border-emerald-950/60 opacity-60 hover:opacity-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white font-bold flex items-center justify-center text-sm shadow-xs overflow-hidden">
                      {p.avatarUrl ? (
                        <img
                          src={p.avatarUrl}
                          alt={p.displayName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        (p.displayName || "U").charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {p.displayName}
                      </h4>
                      <span className="text-[10px] text-slate-500">
                        {p.isHost ? "Expedition Host" : "Verified Companion"}
                      </span>
                    </div>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center border transition ${
                      isSelected
                        ? "bg-emerald-600 border-emerald-600 text-white"
                        : "border-slate-300 dark:border-slate-600"
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-emerald-950/60">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#18241f] transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleStartCall}
              disabled={selectedIds.length === 0}
              className="px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 transition-all active:scale-95 cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call Selected ({selectedIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* PHASE 2: ACTIVE CALL SCREEN */}
      {phase === "ACTIVE_CALL" && (
        <div className="w-full max-w-sm sm:max-w-md bg-gradient-to-b from-slate-900 via-[#0d1612] to-[#080d0a] text-white rounded-3xl border border-emerald-500/25 shadow-2xl p-6 sm:p-8 flex flex-col items-center justify-between min-h-[500px] animate-scale-in relative overflow-hidden">
          {/* Top Status Bar */}
          <div className="w-full flex items-center justify-between text-xs text-slate-400">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[11px] font-bold text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>P2P WebRTC Encrypted</span>
            </div>

            {callStatus === "CONNECTED" && (
              <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800/60">
                {formatDuration(callDuration)}
              </span>
            )}
          </div>

          {/* Caller / Participants Avatar Area */}
          <div className="flex flex-col items-center justify-center my-auto space-y-4 text-center">
            <div className="relative">
              {/* Ringing pulse animation rings */}
              {callStatus === "RINGING" && (
                <>
                  <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
                  <div className="absolute -inset-4 rounded-full border-2 border-emerald-500/30 animate-pulse" />
                </>
              )}

              {/* Voice speaking ripple when connected */}
              {callStatus === "CONNECTED" && micSpeakingLevel > 15 && (
                <div
                  className="absolute -inset-3 rounded-full border border-emerald-400/50 animate-ping pointer-events-none"
                  style={{ opacity: Math.min(1, micSpeakingLevel / 80) }}
                />
              )}

              {/* Avatar Grid / Single Avatar */}
              {activeCalledParticipants.length <= 1 ? (
                <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full p-1 bg-gradient-to-tr from-emerald-500 via-teal-400 to-amber-400 shadow-2xl shadow-emerald-500/20">
                  <div className="w-full h-full rounded-full bg-slate-900 overflow-hidden flex items-center justify-center text-3xl font-black text-emerald-400">
                    {activeCalledParticipants[0]?.avatarUrl ? (
                      <img
                        src={activeCalledParticipants[0].avatarUrl}
                        alt={activeCalledParticipants[0].displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      (activeCalledParticipants[0]?.displayName || "U")
                        .charAt(0)
                        .toUpperCase()
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 p-2 bg-white/5 rounded-3xl border border-white/10">
                  {activeCalledParticipants.slice(0, 4).map((p) => (
                    <div
                      key={p.id}
                      className="w-14 h-14 rounded-2xl bg-emerald-800/80 overflow-hidden flex items-center justify-center text-sm font-bold text-white border border-white/20"
                    >
                      {p.avatarUrl ? (
                        <img
                          src={p.avatarUrl}
                          alt={p.displayName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        (p.displayName || "U").charAt(0).toUpperCase()
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Names & Current State */}
            <div className="space-y-1">
              <h3 className="font-black text-xl sm:text-2xl text-white tracking-tight">
                {activeCalledParticipants.length === 1
                  ? activeCalledParticipants[0]?.displayName
                  : conversationTitle || "Group Companion Call"}
              </h3>
              <p className="text-xs font-semibold">
                {callStatus === "RINGING" && (
                  <span className="text-emerald-400 flex items-center justify-center gap-1.5 animate-pulse">
                    <Radio className="w-3.5 h-3.5" />
                    <span>Ringing companion...</span>
                  </span>
                )}
                {callStatus === "CONNECTED" && (
                  <span className="text-emerald-400 flex items-center justify-center gap-1.5 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>Live Audio Connected</span>
                  </span>
                )}
                {callStatus === "DECLINED" && (
                  <span className="text-rose-400 flex items-center justify-center gap-1.5 font-bold">
                    <PhoneOff className="w-3.5 h-3.5" />
                    <span>Call Declined</span>
                  </span>
                )}
                {callStatus === "ENDED" && (
                  <span className="text-slate-400 flex items-center justify-center gap-1.5">
                    <span>Call Ended</span>
                  </span>
                )}
              </p>
            </div>

            {/* Live voice activity indicator when connected */}
            {callStatus === "CONNECTED" && (
              <div className="flex items-center gap-1 h-4">
                <Volume1 className="w-3 h-3 text-emerald-400" />
                <span className="text-[10px] text-emerald-400 font-medium">
                  {isMuted
                    ? "Mic Muted"
                    : micSpeakingLevel > 15
                    ? "Transmitting voice..."
                    : "Microphone Active"}
                </span>
              </div>
            )}

            {/* Audio unlock prompt if browser autoplay blocked */}
            {needAudioUnlock && (
              <button
                type="button"
                onClick={unlockAudio}
                className="mt-2 px-4 py-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs flex items-center gap-2 shadow-lg animate-bounce cursor-pointer"
              >
                <Volume2 className="w-4 h-4" />
                <span>Tap to hear audio</span>
              </button>
            )}

            {micError && (
              <div className="p-3 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-[11px] text-rose-300 flex items-center gap-2 max-w-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{micError}</span>
              </div>
            )}
          </div>

          {/* Action Control Buttons (Mute, Speaker, End) */}
          <div className="w-full flex items-center justify-center gap-4 sm:gap-6 pt-6 border-t border-white/10">
            {/* Mute Button */}
            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center transition-all active:scale-95 shadow-md cursor-pointer group ${
                isMuted
                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-rose-500/10"
                  : "bg-white/10 text-white hover:bg-white/20 border border-white/15"
              }`}
              title={isMuted ? "Unmute microphone" : "Mute microphone"}
            >
              {isMuted ? (
                <MicOff className="w-5 h-5 text-rose-400" />
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
                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-rose-500/10"
                  : "bg-white/10 text-white hover:bg-white/20 border border-white/15"
              }`}
              title={isSpeakerOn ? "Turn speaker off" : "Turn speaker on"}
            >
              {isSpeakerOn ? (
                <Volume2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
              ) : (
                <VolumeX className="w-5 h-5 text-rose-400" />
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
