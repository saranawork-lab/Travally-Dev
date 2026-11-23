"use client";

import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Send,
  ArrowLeft,
  Users,
  Compass,
  ShieldAlert,
  UserX,
  Check,
  CheckCheck,
  Image as ImageIcon,
  Phone,
  PhoneOff,
  PhoneMissed,
  PhoneCall,
  Video,
  Smile,
  Keyboard,
  Plus,
  Mic,
  MapPin,
  X,
  ChevronDown,
  CornerDownRight,
  ExternalLink,
  PanelLeftOpen,
  PanelLeftClose,
  Lock,
  Clock,
  Radio,
  Trash2,
  Copy,
  Share2,
  Ban,
  ShieldCheck,
  Info,
  Reply,
  Forward,
  Pin,
  PinOff,
  CheckSquare,
} from "lucide-react";
import { formatTimeAgo, formatMessageTime, formatDate } from "@/lib/utils";
import { ReportModal } from "@/components/common/ReportModal";
import { ProfileModal } from "@/components/profile/ProfileModal";
import { RealisticEmoji } from "@/components/chat/RealisticEmoji";
import { EmojiPickerPopover } from "@/components/chat/EmojiPickerPopover";
import { VoiceCallModal, CallParticipant } from "@/components/chat/VoiceCallModal";
import { VoiceNotePlayer } from "@/components/chat/VoiceNotePlayer";
import { AttachmentPopover } from "@/components/chat/AttachmentPopover";
import { ShareLocationModal } from "@/components/chat/ShareLocationModal";
import { LiveLocationModal } from "@/components/chat/LiveLocationModal";
import { LiveLocationMiniMap } from "@/components/chat/LiveLocationMiniMap";
import { MessageStatusBeacon, type MessageDeliveryStatus } from "@/components/chat/MessageStatusBeacon";
import { E2EESecurityModal } from "@/components/chat/E2EESecurityModal";
import { ChatsSidebar } from "@/components/chat/ChatsSidebar";
import { GroupMembersDrawer } from "@/components/chat/GroupMembersDrawer";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { encryptChatMessage, decryptChatMessage, isE2EEMessage } from "@/lib/crypto";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { getTripImage, getActivityImage } from "@/lib/images";

// Quick reactions shown on the floating pill
const QUICK_REACTIONS = ["❤️", "😂", "😮", "😢", "🔥", "👍"];

// Accurate grapheme segmenter for emojis (prevent splitting variation selectors or compound emojis)
const splitEmojis = (text: string): string[] => {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const segmenter = new (Intl as any).Segmenter("en", { granularity: "grapheme" });
    return Array.from(segmenter.segment(text.trim()))
      .map((s: any) => s.segment.trim())
      .filter((s: string) => s.length > 0);
  }
  return Array.from(text.trim()).filter((c) => c.trim().length > 0);
};

// Helper to test if a message contains only 1-3 emojis and no alphanumeric text
const isStandaloneEmoji = (text: string): boolean => {
  if (!text) return false;
  const trimmed = text.trim();
  if (trimmed.length === 0 || trimmed.length > 24) return false;
  // If string contains letters or numbers, it's not standalone emoji
  if (/[a-zA-Z0-9\u0600-\u06FF\u0400-\u04FF\u4E00-\u9FFF]/.test(trimmed)) {
    return false;
  }
  const chars = splitEmojis(trimmed);
  return chars.length >= 1 && chars.length <= 4;
};

interface MessagePayload {
  text: string;
  isDeleted?: boolean;
  deletedForEveryone?: boolean;
  deletedFor?: string[];
  deletedAt?: string;
  replyTo?: {
    id: string;
    senderName: string;
    text: string;
  };
  reactions?: Record<string, string[]>;
  mediaType?: "PHOTO" | "LOCATION" | "TRIP" | "LIVE_LOCATION" | "AUDIO";
  mediaData?: any;
}

const parseMessageContent = (raw: string): MessagePayload => {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      if ("isDeleted" in parsed) {
        return {
          text: parsed.text || "This message was deleted",
          isDeleted: true,
          deletedForEveryone: Boolean(parsed.deletedForEveryone),
          deletedFor: parsed.deletedFor,
          deletedAt: parsed.deletedAt,
        };
      }
      if ("text" in parsed || "mediaType" in parsed) {
        return parsed;
      }
    }
  } catch {
    // raw plain text
  }
  return { text: raw };
};

interface CallLogInfo {
  type: "declined" | "missed" | "ended" | "call";
  title: string;
  subtitle: string;
  actionText: string;
  isMissed: boolean;
}

const isCallMessage = (text: string): boolean => {
  if (!text) return false;
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();
  return (
    trimmed.startsWith("📞") ||
    lower.includes("voice call") ||
    lower.includes("missed call") ||
    lower.includes("declined call")
  );
};

const parseCallLog = (rawText: string): CallLogInfo => {
  const text = (rawText || "").replace(/^📞\s*/, "").trim();
  const lower = text.toLowerCase();

  if (lower.startsWith("declined voice call") || lower.startsWith("declined call")) {
    const fromPart = text.replace(/^declined (voice )?call\s*(from\s*)?/i, "").trim();
    return {
      type: "declined",
      title: "Declined Voice Call",
      subtitle: fromPart ? `from ${fromPart}` : "Call was declined",
      actionText: "Call Back",
      isMissed: true,
    };
  }

  if (lower.startsWith("missed voice call") || lower.startsWith("missed call")) {
    const fromPart = text.replace(/^missed (voice )?call\s*(from\s*)?/i, "").trim();
    return {
      type: "missed",
      title: "Missed Voice Call",
      subtitle: fromPart ? `from ${fromPart}` : "You missed this call",
      actionText: "Call Back",
      isMissed: true,
    };
  }

  if (lower.startsWith("voice call ended") || lower.startsWith("call ended")) {
    const details = text.replace(/^(voice )?call ended\s*[•\-–]?\s*/i, "").trim();
    return {
      type: "ended",
      title: "Voice Call Ended",
      subtitle: details || "Call ended",
      actionText: "Call Again",
      isMissed: false,
    };
  }

  return {
    type: "call",
    title: "Voice Call",
    subtitle: text || "Voice call",
    actionText: "Call Back",
    isMissed: lower.includes("missed") || lower.includes("declined"),
  };
};

// Fast in-memory cache maps for instantaneous chat room opening
const memoryConvMap = new Map<string, any>();
const memoryMsgsMap = new Map<string, any[]>();

export default function ActiveChatPage() {
  const { t } = useLanguage();
  const params = useParams();
  const router = useRouter();
  const conversationId = params?.id as string;

  const [conversation, setConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const { currentUser: authUser } = useAuth();
  const [currentUser, setCurrentUser] = useState<any>(authUser || null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const cachedConv = sessionStorage.getItem(`travally_chat_conv_${conversationId}`);
        if (cachedConv) {
          const parsed = JSON.parse(cachedConv);
          setConversation(parsed);
          setLoading(false);
        }
        const cachedMsgs = sessionStorage.getItem(`travally_chat_msgs_${conversationId}`);
        if (cachedMsgs) {
          setMessages(JSON.parse(cachedMsgs));
        }
      } catch {}
    }
  }, [conversationId]);

  useEffect(() => {
    if (authUser) {
      setCurrentUser(authUser);
    } else if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("travally_auth_user");
        if (cached) setCurrentUser(JSON.parse(cached));
      } catch {}
    }
  }, [authUser]);

  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [isChatExpired, setIsChatExpired] = useState(false);

  // Profile modal states (to view other user profile from header)
  const [selectedProfileUser, setSelectedProfileUser] = useState<any>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Floating Action States
  // Floating Action & Long-Press Message States
  const [selectedMessage, setSelectedMessage] = useState<{ msg: any; parsed: MessagePayload } | null>(null);
  const [isDeletingMsg, setIsDeletingMsg] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const [swipingMsgId, setSwipingMsgId] = useState<string | null>(null);
  const [swipeOffset, setSwipeOffset] = useState<number>(0);

  const [activeReactionMsgId, setActiveReactionMsgId] = useState<string | null>(null);
  const [heartBurstMsgId, setHeartBurstMsgId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<{ id: string; senderName: string; text: string } | null>(null);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isAttachmentOpen, setIsAttachmentOpen] = useState(false);
  const [isShareLocationOpen, setIsShareLocationOpen] = useState(false);
  const [activeLiveModalData, setActiveLiveModalData] = useState<any | null>(null);
  const liveLocationWatchIdRef = useRef<number | null>(null);
  const lastLiveBroadcastRef = useRef<number>(0);

  // WhatsApp-style Photo sender states (max 3 photos, caption, preview modal)
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [pendingPhotos, setPendingPhotos] = useState<string[]>([]);
  const [activePhotoIndex, setActivePhotoIndex] = useState<number>(0);
  const [photoCaption, setPhotoCaption] = useState<string>("");
  const [isPhotoPreviewOpen, setIsPhotoPreviewOpen] = useState<boolean>(false);
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);

  // WhatsApp-style message hover actions, unified context menu with reactions, multi-pin messages & select mode
  interface PinnedItem {
    id: string;
    text: string;
    senderName: string;
    pinnedBy: string;
    pinnedAt: number;
  }
  const [contextMenuMsg, setContextMenuMsg] = useState<{
    msg: any;
    parsed: MessagePayload;
    direction?: "down" | "up";
  } | null>(null);
  const [messageInfoTarget, setMessageInfoTarget] = useState<{ msg: any; parsed: MessagePayload } | null>(null);
  const [pinnedMessages, setPinnedMessages] = useState<PinnedItem[]>([]);
  const [activePinIndex, setActivePinIndex] = useState<number>(0);
  const [deleteTargetMsg, setDeleteTargetMsg] = useState<{ msg: any; parsed: MessagePayload } | null>(null);
  const [isSelectMode, setIsSelectMode] = useState<boolean>(false);
  const [selectedMsgIds, setSelectedMsgIds] = useState<Set<string>>(new Set());

  // Restore and persist pinned messages per conversation
  useEffect(() => {
    if (!conversationId) return;
    try {
      const saved = localStorage.getItem(`travally_pinned_${conversationId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setPinnedMessages(parsed);
        }
      }
    } catch {}
  }, [conversationId]);

  // Handle toggling pins with 5-pins-per-person limit in group and 1-to-1 chats
  const handleTogglePin = (targetMsg: any, targetParsed: MessagePayload, targetSenderName: string) => {
    const currentUserId = currentUser?.id || "me";
    setPinnedMessages((prev) => {
      // If already pinned, unpin it
      if (prev.some((p) => p.id === targetMsg.id)) {
        const updated = prev.filter((p) => p.id !== targetMsg.id);
        try {
          localStorage.setItem(`travally_pinned_${conversationId}`, JSON.stringify(updated));
        } catch {}
        return updated;
      }

      // Max 5 pins per person
      const myPins = prev.filter((p) => p.pinnedBy === currentUserId);
      let updatedBase = prev;
      if (myPins.length >= 5) {
        const oldestId = myPins[myPins.length - 1].id;
        updatedBase = prev.filter((p) => p.id !== oldestId);
      }

      const snippet =
        targetParsed.text ||
        (targetParsed.mediaType === "PHOTO"
          ? "📷 Photo"
          : targetParsed.mediaType === "LOCATION"
          ? "📍 Location"
          : targetParsed.mediaType === "TRIP"
          ? "🎒 Trip itinerary"
          : "Shared message");

      const newPin: PinnedItem = {
        id: targetMsg.id,
        text: snippet,
        senderName: targetSenderName,
        pinnedBy: currentUserId,
        pinnedAt: Date.now(),
      };

      const updated = [newPin, ...updatedBase];
      try {
        localStorage.setItem(`travally_pinned_${conversationId}`, JSON.stringify(updated));
      } catch {}
      return updated;
    });
    setActivePinIndex(0);
    setContextMenuMsg(null);
  };

  // Viewport-aware context menu trigger (optimizes direction: down if space available, up if constrained)
  const handleOpenContextMenu = (e: React.MouseEvent, msg: any, parsed: MessagePayload) => {
    e.stopPropagation();
    if (contextMenuMsg?.msg?.id === msg.id) {
      setContextMenuMsg(null);
      return;
    }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const direction: "down" | "up" = spaceBelow < 320 && rect.top > 300 ? "up" : "down";
    setContextMenuMsg({ msg, parsed, direction });
  };

  // Click outside to dismiss context menu
  useEffect(() => {
    if (!contextMenuMsg) return;

    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.closest && target.closest("[data-chat-actions]")) return;
      setContextMenuMsg(null);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [contextMenuMsg]);

  // Safety & E2EE modals
  const [securityModalOpen, setSecurityModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState({ id: "", name: "" });

  // Sidebar & Members Drawer States
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isMembersDrawerOpen, setIsMembersDrawerOpen] = useState(false);

  // Restore sidebar state preference
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("travally_chats_sidebar");
      if (saved === "collapsed") {
        setIsSidebarCollapsed(true);
      }
    }
  }, []);

  // Scroll and Typing States
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [typingUsers, setTypingUsers] = useState<
    Array<{ userId: string; displayName: string; avatarUrl?: string }>
  >([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingSignalSentRef = useRef<number>(0);

  const sendTypingStatus = (typing: boolean) => {
    if (!conversationId) return;
    fetch(`/api/chats/${conversationId}/typing`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isTyping: typing }),
    }).catch(() => {});
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInputMessage(val);

    if (val.trim()) {
      const now = Date.now();
      if (now - lastTypingSignalSentRef.current > 2500) {
        lastTypingSignalSentRef.current = now;
        sendTypingStatus(true);
      }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        sendTypingStatus(false);
      }, 3500);
    } else {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      sendTypingStatus(false);
    }
  };

  // WebRTC Voice Call States
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [isIncomingCall, setIsIncomingCall] = useState(false);
  const [incomingCallOffer, setIncomingCallOffer] = useState<any>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const recognitionRef = useRef<any>(null);

  // WhatsApp-style Voice Message Recording States
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [liveWaveform, setLiveWaveform] = useState<number[]>(() =>
    Array(20).fill(12)
  );
  const [recordingTooltip, setRecordingTooltip] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const recordIntervalRef = useRef<any>(null);
  const recordStartTimeRef = useRef<number>(0);
  const isCancelledRef = useRef<boolean>(false);
  const sampledWaveformRef = useRef<number[]>([]);
  const audioChunksRef = useRef<Blob[]>([]);

  // Double-tap vs Long-press detection refs
  const tapCountRef = useRef<number>(0);
  const lastTapTimeRef = useRef<number>(0);
  const micLongPressTimerRef = useRef<any>(null);
  const tooltipTimeoutRef = useRef<any>(null);

  const showInstructionToast = (msg: string) => {
    if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
    setRecordingTooltip(msg);
    tooltipTimeoutRef.current = setTimeout(() => {
      setRecordingTooltip(null);
    }, 3000);
  };

  // 1. Double-Tap Voice Typing (Speech-to-Text directly into chat input box)
  const startSpeechRecognition = () => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      showInstructionToast(
        "Live speech typing is not supported in this browser. Try Chrome/Safari/Edge."
      );
      return;
    }

    if (isTranscribing) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsTranscribing(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang =
        typeof navigator !== "undefined" && navigator.language
          ? navigator.language
          : "en-US";

      const initialBase = inputMessage;

      // Instant UI & haptic feedback upon double-tap trigger
      setIsTranscribing(true);
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        try {
          navigator.vibrate([40, 50, 40]);
        } catch {}
      }
      showInstructionToast("🎙️ Voice typing active — Speak now! Tap mic to stop.");

      recognition.onstart = () => {
        setIsTranscribing(true);
      };

      recognition.onresult = (event: any) => {
        let finalStr = "";
        let interimStr = "";

        for (let i = 0; i < event.results.length; i++) {
          const chunk = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalStr += (finalStr ? " " : "") + chunk.trim();
          } else {
            interimStr += chunk;
          }
        }

        const speechOutput = (finalStr + (interimStr ? " " + interimStr : "")).trim();
        const fullMessage = initialBase.trim()
          ? `${initialBase.trim()} ${speechOutput}`
          : speechOutput;

        setInputMessage(fullMessage);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsTranscribing(false);
        if (event.error === "not-allowed") {
          showInstructionToast("Microphone access denied in browser settings");
        }
      };

      recognition.onend = () => {
        setIsTranscribing(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      setIsTranscribing(false);
    }
  };

  // 2. WhatsApp-style Long-Press Voice Recording & Direct Send
  const startVoiceRecording = async () => {
    if (isTranscribing) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsTranscribing(false);
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showInstructionToast("Microphone recording not supported");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      audioStreamRef.current = stream;

      const mimeTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/mp4",
        "audio/aac",
      ];
      let selectedMimeType = "";
      for (const mt of mimeTypes) {
        if (
          typeof MediaRecorder !== "undefined" &&
          MediaRecorder.isTypeSupported(mt)
        ) {
          selectedMimeType = mt;
          break;
        }
      }

      const options = selectedMimeType ? { mimeType: selectedMimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      sampledWaveformRef.current = [];
      isCancelledRef.current = false;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      // Real-time Soundwave Graph Visualizer via Web Audio API
      try {
        const AudioCtx =
          window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = new AudioCtx();
          audioContextRef.current = audioCtx;
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);
          analyserRef.current = analyser;

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateWaveform = () => {
            if (!analyserRef.current) return;
            analyserRef.current.getByteFrequencyData(dataArray);

            const barsCount = 20;
            const step = Math.max(1, Math.floor(dataArray.length / barsCount));
            const newWave: number[] = [];

            for (let i = 0; i < barsCount; i++) {
              const val = dataArray[i * step] || 0;
              const normalized = Math.max(
                12,
                Math.min(100, Math.round((val / 255) * 100))
              );
              newWave.push(normalized);
            }

            setLiveWaveform(newWave);

            if (Math.random() < 0.25 && sampledWaveformRef.current.length < 24) {
              const avg = Math.round(
                newWave.reduce((a, b) => a + b, 0) / newWave.length
              );
              sampledWaveformRef.current.push(avg);
            }

            animFrameRef.current = requestAnimationFrame(updateWaveform);
          };

          animFrameRef.current = requestAnimationFrame(updateWaveform);
        }
      } catch (audioCtxErr) {
        console.warn("Audio visualizer unavailable:", audioCtxErr);
      }

      mediaRecorder.start(100);
      recordStartTimeRef.current = Date.now();
      setIsRecordingVoice(true);
      setRecordingDuration(0);

      recordIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error("Failed to start voice recording:", err);
      if (err.name === "NotAllowedError") {
        showInstructionToast("Microphone access denied in browser settings");
      } else {
        showInstructionToast("Could not access microphone");
      }
    }
  };

  const stopVoiceRecording = (cancelled = false) => {
    isCancelledRef.current = cancelled;

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (recordIntervalRef.current) {
      clearInterval(recordIntervalRef.current);
      recordIntervalRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }

    const mediaRecorder = mediaRecorderRef.current;
    if (!mediaRecorder || mediaRecorder.state === "inactive") {
      setIsRecordingVoice(false);
      return;
    }

    const elapsedMs = Date.now() - recordStartTimeRef.current;

    // Buffer of 220ms ensures the final syllable is NOT cut off when released
    setTimeout(() => {
      try {
        if (mediaRecorder.state !== "inactive") {
          mediaRecorder.requestData();
        }
      } catch {}

      mediaRecorder.onstop = () => {
        if (audioStreamRef.current) {
          audioStreamRef.current.getTracks().forEach((track) => track.stop());
          audioStreamRef.current = null;
        }

        setIsRecordingVoice(false);

        if (isCancelledRef.current) {
          audioChunksRef.current = [];
          return;
        }

        // Accidental brief tap protection (< 500ms)
        if (elapsedMs < 500) {
          showInstructionToast("Hold to record voice message, release to send");
          audioChunksRef.current = [];
          return;
        }

        const rawMime = mediaRecorder.mimeType || "audio/webm";
        const mimeType = rawMime.split(";")[0]; // Clean MIME without codecs parameter
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

        if (audioBlob.size < 500) {
          audioChunksRef.current = [];
          return;
        }

        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          const durationSeconds = Math.max(1, Math.round(elapsedMs / 1000));
          const waveform =
            sampledWaveformRef.current.length >= 8
              ? sampledWaveformRef.current
              : undefined;

          await handleSendMessage({
            text: "🎤 Voice message",
            mediaType: "AUDIO",
            mediaData: {
              audioUrl: base64Audio,
              duration: durationSeconds,
              waveform,
            },
          });
        };
        reader.readAsDataURL(audioBlob);
      };

      try {
        mediaRecorder.stop();
      } catch (err) {
        console.error("Error stopping mediaRecorder:", err);
        setIsRecordingVoice(false);
      }
    }, 220);
  };

  const handleMicPointerDown = (e: React.PointerEvent) => {
    // If speech-to-text is already running, tap stops it
    if (isTranscribing) {
      startSpeechRecognition();
      return;
    }

    const now = Date.now();
    const timeSinceLastTap = now - lastTapTimeRef.current;

    // Double-tap check (< 400ms)
    if (timeSinceLastTap < 400 && tapCountRef.current >= 1) {
      if (micLongPressTimerRef.current) {
        clearTimeout(micLongPressTimerRef.current);
        micLongPressTimerRef.current = null;
      }
      tapCountRef.current = 0;
      lastTapTimeRef.current = 0;
      startSpeechRecognition();
      return;
    }

    // First tap: set tap count and start long-press timer
    tapCountRef.current = 1;
    lastTapTimeRef.current = now;

    // Long-press threshold: 350ms ensures natural double-taps are not prematurely cut off
    micLongPressTimerRef.current = setTimeout(() => {
      tapCountRef.current = 0;
      startVoiceRecording();
    }, 350);
  };

  const handleMicPointerUp = () => {
    if (micLongPressTimerRef.current) {
      clearTimeout(micLongPressTimerRef.current);
      micLongPressTimerRef.current = null;
    }

    if (isRecordingVoice) {
      // Released long-press: automatically send the voice message!
      stopVoiceRecording(false);
    } else {
      // Single tap timeout after double-tap window expires
      setTimeout(() => {
        if (tapCountRef.current === 1 && !isTranscribing && !isRecordingVoice) {
          tapCountRef.current = 0;
          showInstructionToast(
            "Hold to record voice message • Double-tap to voice type"
          );
        }
      }, 420);
    }
  };

  const handleMicPointerCancel = () => {
    if (micLongPressTimerRef.current) {
      clearTimeout(micLongPressTimerRef.current);
      micLongPressTimerRef.current = null;
    }
    if (isRecordingVoice) {
      stopVoiceRecording(true);
    }
  };

  const formatRecordingTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const decryptedCacheRef = useRef<Map<string, string>>(new Map());
  const lastMessageCreatedAtRef = useRef<string | null>(null);

  // High-performance decrypted message cache: Prevents redundant re-decryptions on every cycle
  const decryptFast = async (msg: any): Promise<string> => {
    if (decryptedCacheRef.current.has(msg.id)) {
      return decryptedCacheRef.current.get(msg.id)!;
    }
    let plainText = msg.content;
    if (isE2EEMessage(msg.content)) {
      plainText = await decryptChatMessage(msg.content, conversationId);
    }
    decryptedCacheRef.current.set(msg.id, plainText);
    return plainText;
  };

  // Fetch current user and chat data with fast delta sync and transparent E2EE decryption
  const fetchChatData = async () => {
    try {
      const lastCreated = lastMessageCreatedAtRef.current;
      const url = lastCreated
        ? `/api/chats/${conversationId}/messages?since=${encodeURIComponent(lastCreated)}`
        : `/api/chats/${conversationId}/messages`;

      const res = await fetch(url);
      if (res.status === 410) {
        setIsChatExpired(true);
        return;
      }
      if (res.status === 403) {
        setAccessDenied(true);
        return;
      }
      if (res.ok) {
        const data = await res.json();

        if (data.isDelta) {
          const rawDelta = data.messages || [];
          if (rawDelta.length > 0) {
            const newDecrypted = await Promise.all(
              rawDelta.map(async (msg: any) => ({
                ...msg,
                content: await decryptFast(msg),
              }))
            );

            setMessages((prev) => {
              // Deduplicate against optimistic placeholders or existing messages
              const existingIds = new Set(prev.map((m) => m.id));
              const filtered = newDecrypted.filter((m: any) => !existingIds.has(m.id));
              if (filtered.length === 0) return prev;
              return [...prev, ...filtered];
            });

            const latest = rawDelta[rawDelta.length - 1];
            if (latest?.createdAt) {
              lastMessageCreatedAtRef.current = latest.createdAt;
            }
          }
        } else {
          // Full initial load
          if (data.conversation) {
            setConversation(data.conversation);
            memoryConvMap.set(conversationId, data.conversation);
            try {
              sessionStorage.setItem(`travally_chat_conv_${conversationId}`, JSON.stringify(data.conversation));
            } catch {}
          }
          const rawMessages = data.messages || [];
          const decryptedList = await Promise.all(
            rawMessages.map(async (msg: any) => ({
              ...msg,
              content: await decryptFast(msg),
            }))
          );
          setMessages(decryptedList);
          memoryMsgsMap.set(conversationId, decryptedList);
          try {
            sessionStorage.setItem(`travally_chat_msgs_${conversationId}`, JSON.stringify(decryptedList.slice(-50)));
          } catch {}

          if (rawMessages.length > 0) {
            const latest = rawMessages[rawMessages.length - 1];
            if (latest?.createdAt) {
              lastMessageCreatedAtRef.current = latest.createdAt;
            }
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser) {
      fetch("/api/auth/me")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.user) setCurrentUser(data.user);
        })
        .catch(() => {});
    }

    if (conversationId) {
      fetchChatData();
      // Delta sync polling at 2500ms — fast enough for real-time feel, avoids server exhaustion
      const interval = setInterval(() => {
        if (typeof document !== "undefined" && document.hidden) return;
        fetchChatData();
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [conversationId]);

  // Poll for typing status every 2000ms
  useEffect(() => {
    if (!conversationId) return;

    const fetchTyping = async () => {
      if (typeof document !== "undefined" && document.hidden) return;
      try {
        const res = await fetch(`/api/chats/${conversationId}/typing`);
        if (res.ok) {
          const data = await res.json();
          setTypingUsers(data.typingUsers || []);
        }
      } catch {
        // network error
      }
    };

    fetchTyping();
    const interval = setInterval(fetchTyping, 2000);
    return () => {
      clearInterval(interval);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      sendTypingStatus(false);
    };
  }, [conversationId]);

  // Auto-scroll when typing indicator appears and user is near bottom
  useEffect(() => {
    if (typingUsers.length > 0 && !showScrollBottom) {
      const el = messagesContainerRef.current;
      if (el) {
        el.scrollTo({
          top: el.scrollHeight,
          behavior: "smooth",
        });
      }
    }
  }, [typingUsers.length, showScrollBottom]);

  // Poll for incoming WebRTC voice calls
  useEffect(() => {
    if (!conversationId || !currentUser) return;

    const checkCalls = async () => {
      if (typeof document !== "undefined" && document.hidden) return;
      if (isCallModalOpen) return;

      try {
        const res = await fetch(`/api/calls?conversationId=${conversationId}`);
        if (!res.ok) return;
        const data = await res.json();
        const call = data.activeCall;

        if (call && call.status === "RINGING") {
          // If we are recipient and our modal is not already open, trigger incoming call dialog
          if (call.callerId !== currentUser.id && !isCallModalOpen) {
            setIncomingCall(call);
          }
        } else if (call && call.status === "CONNECTED") {
          if (!isCallModalOpen) {
            setIncomingCall(null);
          }
        } else {
          setIncomingCall(null);
        }
      } catch {
        // ignore network error
      }
    };

    checkCalls();
    // Throttled to 5000ms — calls are rare events, no need for aggressive polling
    const callInterval = setInterval(checkCalls, 5000);
    return () => clearInterval(callInterval);
  }, [conversationId, currentUser, isCallModalOpen]);

  const handleAcceptIncomingCall = () => {
    if (!incomingCall) return;
    setActiveCallId(incomingCall.id);
    setIsIncomingCall(true);
    setIncomingCallOffer(incomingCall.sdpOffer);
    setIsCallModalOpen(true);
    setIncomingCall(null);
  };

  const handleDeclineIncomingCall = () => {
    if (!incomingCall) return;
    fetch(`/api/calls/${incomingCall.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "DECLINE" }),
    }).catch(() => {});
    setIncomingCall(null);
  };

  const handleStartVoiceCall = () => {
    setActiveCallId(null);
    setIsIncomingCall(false);
    setIncomingCallOffer(null);
    setIsCallModalOpen(true);
  };

  const prevMessagesCountRef = useRef<number>(0);
  const isInitialLoadRef = useRef<boolean>(true);

  // Strictly container-scoped scroll to bottom (NEVER scrolls the window)
  const scrollToBottom = (smooth = true) => {
    const el = messagesContainerRef.current;
    if (!el) return;
    el.scrollTo({
      top: el.scrollHeight,
      behavior: smooth ? "smooth" : "auto",
    });
    setShowScrollBottom(false);
    setUnreadCount(0);
  };

  // Auto-scroll ONLY when new messages arrive or on initial load
  useEffect(() => {
    if (messages.length === 0) return;

    if (isInitialLoadRef.current) {
      // Instant scroll on first load
      scrollToBottom(false);
      isInitialLoadRef.current = false;
      prevMessagesCountRef.current = messages.length;
      return;
    }

    // Only scroll if new messages were actually appended
    if (messages.length > prevMessagesCountRef.current) {
      if (!showScrollBottom) {
        scrollToBottom(true);
      } else {
        setUnreadCount((prev) => prev + (messages.length - prevMessagesCountRef.current));
      }
    }
    prevMessagesCountRef.current = messages.length;
  }, [messages.length, showScrollBottom]);

  // Track scroll position for "Scroll to Bottom" button
  const handleScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setShowScrollBottom(!isNearBottom);
    if (isNearBottom) setUnreadCount(0);
  };

  // Auto-expanding textarea
  useLayoutEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputMessage]);

  // Send message with instant split-second optimistic rendering
  const handleSendMessage = async (customPayload?: MessagePayload) => {
    if (isTranscribing && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      setIsTranscribing(false);
    }

    const textToSend = customPayload ? customPayload.text : inputMessage.trim();
    if (!textToSend && !customPayload?.mediaType) return;
    if (sending) return;

    setSending(true);

    const payload: MessagePayload = customPayload || {
      text: textToSend,
      replyTo: replyingTo || undefined,
    };

    if (!customPayload) {
      setInputMessage("");
      setReplyingTo(null);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      sendTypingStatus(false);
    }

    const plaintextJson = JSON.stringify(payload);
    const tempId = `optimistic_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    // ⚡ INSTANT OPTIMISTIC UI: Appears on user's screen in 0 milliseconds!
    const optimisticMsg = {
      id: tempId,
      conversationId,
      senderId: currentUser?.id,
      sender: {
        id: currentUser?.id,
        email: currentUser?.email,
        profile: {
          displayName: currentUser?.displayName || currentUser?.email?.split("@")[0] || "Me",
          avatarUrl: currentUser?.avatarUrl,
          isVerified: currentUser?.isVerified,
        },
      },
      content: plaintextJson,
      createdAt: new Date().toISOString(),
      readBy: JSON.stringify([currentUser?.id]),
      status: "sending" as const,
      isOptimistic: true,
    };

    decryptedCacheRef.current.set(tempId, plaintextJson);

    // Immediately render in local messages state (split-second!)
    setMessages((prev) => [...prev, optimisticMsg]);
    scrollToBottom(true);

    try {
      // Encrypt with 256-bit AES-GCM
      const encryptedContent = await encryptChatMessage(plaintextJson, conversationId);

      const res = await fetch(`/api/chats/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: encryptedContent }),
      });

      if (res.ok) {
        const data = await res.json();
        const serverMsg = {
          ...data.message,
          content: plaintextJson,
          status: "sent" as const,
        };
        decryptedCacheRef.current.set(serverMsg.id, plaintextJson);

        if (serverMsg.createdAt) {
          lastMessageCreatedAtRef.current = serverMsg.createdAt;
        }

        // Seamlessly update optimistic message to confirmed server message
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? serverMsg : m))
        );
      } else {
        const err = await res.json();
        console.error("Message send error:", err);
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, status: "failed" } : m))
        );
      }
    } catch (err) {
      console.error("Message send network error:", err);
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, status: "failed" } : m))
      );
    } finally {
      setSending(false);
    }
  };

  // Toggle Reaction on a message
  const handleToggleReaction = async (
    messageId: string,
    emoji: string,
    _clickEvent?: React.MouseEvent
  ) => {
    // Optimistic UI update
    const currentUserName = currentUser?.displayName || currentUser?.email?.split("@")[0] || "Me";
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId) return m;
        const parsed = parseMessageContent(m.content);
        const reactions = { ...(parsed.reactions || {}) };
        const users = reactions[emoji] || [];

        if (users.includes(currentUserName)) {
          reactions[emoji] = users.filter((u) => u !== currentUserName);
          if (reactions[emoji].length === 0) delete reactions[emoji];
        } else {
          reactions[emoji] = [...users, currentUserName];
        }

        parsed.reactions = reactions;
        return { ...m, content: JSON.stringify(parsed) };
      })
    );

    setActiveReactionMsgId(null);

    try {
      await fetch(`/api/chats/${conversationId}/messages`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, emoji }),
      });
    } catch (e) {
      console.error("Failed to patch reaction:", e);
    }
  };

  const lastMessageTapRef = useRef<{ id: string; time: number }>({ id: "", time: 0 });
  const reactionDockTimeoutRef = useRef<any>(null);

  // Double-tap Instagram/WhatsApp style quick react with ❤️ and pop open reaction dock
  const handleDoubleTap = (messageId: string, e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      try {
        e.preventDefault();
        e.stopPropagation();
      } catch {}
    }
    setHeartBurstMsgId(messageId);
    setTimeout(() => setHeartBurstMsgId(null), 900);
    handleToggleReaction(messageId, "❤️");

    // Open WhatsApp-style floating reaction dock for quick emoji switching
    setActiveReactionMsgId(messageId);
    if (reactionDockTimeoutRef.current) clearTimeout(reactionDockTimeoutRef.current);
    reactionDockTimeoutRef.current = setTimeout(() => {
      setActiveReactionMsgId((curr) => (curr === messageId ? null : curr));
    }, 4500);

    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(35);
    }
  };

  // Long-press and context menu handlers with WhatsApp-style swipe-to-reply
  const handleTouchStart = (msg: any, parsed: MessagePayload, e: React.TouchEvent) => {
    if (parsed.isDeleted) return;
    const clientY = e.touches[0].clientY;
    touchStartPosRef.current = { x: e.touches[0].clientX, y: clientY };
    setSwipingMsgId(msg.id);
    setSwipeOffset(0);

    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      // Long-press on mobile: enter multi-select mode and select this message directly
      setIsSelectMode(true);
      setSelectedMsgIds((prev) => {
        const next = new Set(prev);
        if (next.has(msg.id)) {
          next.delete(msg.id);
          if (next.size === 0) setIsSelectMode(false);
        } else {
          next.add(msg.id);
        }
        return next;
      });
      setContextMenuMsg(null);
      setActiveReactionMsgId(null);
      setSwipingMsgId(null);
      setSwipeOffset(0);
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 420);
  };

  const handleTouchMove = (msg: any, parsed: MessagePayload, e: React.TouchEvent) => {
    if (!touchStartPosRef.current) return;
    const dx = e.touches[0].clientX - touchStartPosRef.current.x;
    const dy = Math.abs(e.touches[0].clientY - touchStartPosRef.current.y);

    // Cancel long-press when movement is detected
    if (Math.abs(dx) > 8 || dy > 8) {
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    }

    // If vertical scroll is dominant, cancel horizontal swipe
    if (dy > 12 && dy > Math.abs(dx)) {
      setSwipeOffset(0);
      return;
    }

    // Drag rightwards (WhatsApp swipe gesture)
    if (dx > 0) {
      const damped = Math.min(dx * 0.75, 75);
      setSwipingMsgId(msg.id);
      setSwipeOffset(damped);
    }
  };

  const handleTouchEnd = (msg: any, parsed: MessagePayload, e?: React.TouchEvent) => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);

    if (swipingMsgId === msg.id && swipeOffset > 42) {
      const isMe =
        msg.senderId === currentUser?.id ||
        msg.sender?.id === currentUser?.id ||
        msg.sender?.email === currentUser?.email;
      const senderName = isMe
        ? "You"
        : msg.sender?.displayName ||
          msg.sender?.name ||
          msg.sender?.email?.split("@")[0] ||
          "Traveler";
      setReplyingTo({
        id: msg.id,
        senderName,
        text: parsed.text || parsed.mediaType || "Message",
      });
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(30);
      }
      setSwipingMsgId(null);
      setSwipeOffset(0);
      touchStartPosRef.current = null;
      return;
    }

    setSwipingMsgId(null);
    setSwipeOffset(0);

    // Touch Double-Tap Detection:
    if (!parsed.isDeleted && touchStartPosRef.current) {
      const now = Date.now();
      const isSameMsg = lastMessageTapRef.current.id === msg.id;
      const diff = now - lastMessageTapRef.current.time;

      if (isSameMsg && diff > 40 && diff < 380) {
        // Double-tap detected on touch screen!
        lastMessageTapRef.current = { id: "", time: 0 };
        handleDoubleTap(msg.id, e);
        touchStartPosRef.current = null;
        return;
      }

      lastMessageTapRef.current = { id: msg.id, time: now };
    }

    touchStartPosRef.current = null;
  };

  useEffect(() => {
    const handleDismissReactionDock = () => {
      setActiveReactionMsgId(null);
    };
    window.addEventListener("click", handleDismissReactionDock);
    return () => window.removeEventListener("click", handleDismissReactionDock);
  }, []);

  const handleContextMenu = (msg: any, parsed: MessagePayload, e: React.MouseEvent) => {
    e.preventDefault();
    if (parsed.isDeleted) return;
    const spaceBelow = window.innerHeight - e.clientY;
    const direction: "down" | "up" = spaceBelow < 320 && e.clientY > 300 ? "up" : "down";
    setContextMenuMsg({ msg, parsed, direction });
  };

  const handleForwardMessage = (text: string) => {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title: "Travally message", text }).catch(() => {});
    } else {
      setInputMessage(text);
      textareaRef.current?.focus();
    }
  };

  const handleBatchCopySelected = () => {
    const texts = messages
      .filter((m) => selectedMsgIds.has(m.id))
      .map((m) => {
        try {
          return parseMessageContent(m.content).text || "";
        } catch {
          return m.content;
        }
      })
      .filter(Boolean)
      .join("\n\n");
    if (texts) {
      navigator.clipboard?.writeText(texts);
    }
    setSelectedMsgIds(new Set());
    setIsSelectMode(false);
  };

  const handleBatchDeleteSelected = async () => {
    const ids = Array.from(selectedMsgIds);
    if (ids.length === 0) return;
    for (const id of ids) {
      await handleDeleteMessage(id, "me");
    }
    setSelectedMsgIds(new Set());
    setIsSelectMode(false);
  };

  const handleCopyText = (text?: string, msgId?: string) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    if (msgId) {
      setCopiedMsgId(msgId);
      setTimeout(() => setCopiedMsgId(null), 2000);
    }
    setSelectedMessage(null);
  };

  const handleDeleteMessage = async (messageId: string, deleteType: "everyone" | "me") => {
    try {
      setIsDeletingMsg(true);
      // Optimistic update
      if (deleteType === "everyone") {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? {
                  ...m,
                  content: JSON.stringify({
                    isDeleted: true,
                    deletedForEveryone: true,
                    text: "This message was deleted",
                    deletedAt: new Date().toISOString(),
                  }),
                }
              : m
          )
        );
      } else {
        // Delete for me: immediately remove from current view
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
      }

      setSelectedMessage(null);

      const res = await fetch(`/api/chats/${conversationId}/messages`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, deleteType }),
      });

      if (!res.ok) {
        const data = await res.json();
        console.error("Delete message error:", data.error);
      }
    } catch (err) {
      console.error("Failed to delete message:", err);
    } finally {
      setIsDeletingMsg(false);
    }
  };

  // Attachment Handler (Photo, Location, Trip / Activity Itinerary Pin)
  const handleSelectAttachment = (type: "PHOTO" | "LOCATION" | "TRIP") => {
    if (type === "PHOTO") {
      photoInputRef.current?.click();
    } else if (type === "LOCATION") {
      setIsShareLocationOpen(true);
    } else if (type === "TRIP") {
      if (conversation?.travelPlan) {
        const tp = conversation.travelPlan;
        const start = tp.startDate ? formatDate(tp.startDate) : "";
        const end = tp.endDate ? formatDate(tp.endDate) : "";
        const dateStr = start && end ? `${start} – ${end}` : start || "Flexible dates";
        const budgetStr =
          tp.budgetMin && tp.budgetMax
            ? `₹${tp.budgetMin.toLocaleString("en-IN")} – ₹${tp.budgetMax.toLocaleString("en-IN")} per traveler`
            : "Shared expense";
        handleSendMessage({
          text: "Trip Itinerary Pin",
          mediaType: "TRIP",
          mediaData: {
            title: tp.destination || "Trip Itinerary",
            dates: dateStr,
            budget: budgetStr,
            tripId: tp.id || conversation.travelPlanId,
          },
        });
      } else if (conversation?.activity) {
        const act = conversation.activity;
        const actDate = act.date ? formatDate(act.date) : "Upcoming";
        const dateStr = act.startTime ? `${actDate} at ${act.startTime}` : actDate;
        handleSendMessage({
          text: "Activity Itinerary Pin",
          mediaType: "TRIP",
          mediaData: {
            title: act.title || "Companion Activity",
            dates: dateStr,
            budget: act.locationName || "Meetup Location",
            activityId: act.id || conversation.activityId,
          },
        });
      }
    }
  };

  // WhatsApp-style Photo Files Selected Handler (max 3 at a time silently, no text mention)
  const handlePhotoFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFiles = Array.from(e.target.files || []);
    if (rawFiles.length === 0) return;
    const files = rawFiles.slice(0, 3);
    const readers = files.map((file) => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    });
    const loaded = await Promise.all(readers);
    setPendingPhotos(loaded);
    setActivePhotoIndex(0);
    setPhotoCaption("");
    setIsPhotoPreviewOpen(true);
    e.target.value = "";
  };

  // WhatsApp-style Send Photos
  const handleSendPendingPhotos = async () => {
    if (pendingPhotos.length === 0) return;
    const photosToSend = [...pendingPhotos];
    const captionToSend = photoCaption.trim();
    setIsPhotoPreviewOpen(false);
    setPendingPhotos([]);
    setPhotoCaption("");

    await handleSendMessage({
      text: captionToSend || (photosToSend.length === 1 ? "📷 Photo" : `📷 ${photosToSend.length} photos`),
      mediaType: "PHOTO",
      mediaData: {
        url: photosToSend[0],
        urls: photosToSend,
        caption: captionToSend || undefined,
      },
    });
  };

  // WhatsApp-style Live Location Handlers
  const handleShareLiveLocation = async (locData: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    heading?: number;
    durationMinutes: number;
    note?: string;
    address?: string;
  }) => {
    const liveUntil = new Date(Date.now() + locData.durationMinutes * 60 * 1000).toISOString();
    await handleSendMessage({
      text: locData.note || "📍 Sharing live location",
      mediaType: "LIVE_LOCATION",
      mediaData: {
        sessionId: `live_${Date.now()}`,
        latitude: locData.latitude,
        longitude: locData.longitude,
        accuracy: locData.accuracy,
        heading: locData.heading,
        liveUntil,
        durationMinutes: locData.durationMinutes,
        isActive: true,
        note: locData.note || "",
        address: locData.address || "Live GPS Location",
        startedAt: new Date().toISOString(),
      },
    });
  };

  const handleSendCurrentLocation = async (locData: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    address: string;
    mapLink: string;
  }) => {
    await handleSendMessage({
      text: `📍 Location: ${locData.address}`,
      mediaType: "LOCATION",
      mediaData: {
        title: locData.address,
        address: `Accurate to ±${Math.round(locData.accuracy || 15)}m`,
        mapLink: locData.mapLink,
        latitude: locData.latitude,
        longitude: locData.longitude,
      },
    });
  };

  const handleStopSharingLiveLocation = async (messageId: string) => {
    // 1. Optimistic local update
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === messageId) {
          try {
            const parsed = parseMessageContent(m.content);
            if (parsed.mediaType === "LIVE_LOCATION" && parsed.mediaData) {
              parsed.mediaData.isActive = false;
              parsed.mediaData.endedAt = new Date().toISOString();
              return { ...m, content: JSON.stringify(parsed) };
            }
          } catch {}
        }
        return m;
      })
    );

    // 2. Stop watch if this was our active broadcast
    if (liveLocationWatchIdRef.current !== null && typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.clearWatch(liveLocationWatchIdRef.current);
      liveLocationWatchIdRef.current = null;
    }

    // 3. Inform server
    try {
      await fetch(`/api/chats/${conversationId}/live-location`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId }),
      });
    } catch (err) {
      console.warn("Failed to stop live location on server:", err);
    }
  };

  // Background Live Location GPS Watcher for sender
  useEffect(() => {
    if (!currentUser?.id || !conversationId || typeof window === "undefined" || !("geolocation" in navigator)) {
      return;
    }

    // Check if current user has any active LIVE_LOCATION message
    const now = Date.now();
    let activeLiveMsg: any = null;

    for (const msg of messages) {
      if (msg.senderId === currentUser.id) {
        try {
          const parsed = parseMessageContent(msg.content);
          if (
            parsed.mediaType === "LIVE_LOCATION" &&
            parsed.mediaData?.isActive &&
            parsed.mediaData?.liveUntil &&
            new Date(parsed.mediaData.liveUntil).getTime() > now
          ) {
            activeLiveMsg = { msg, parsed };
            break;
          }
        } catch {}
      }
    }

    if (activeLiveMsg && liveLocationWatchIdRef.current === null) {
      const activeMsgId = activeLiveMsg.msg.id;
      const activeLiveUntil = activeLiveMsg.parsed.mediaData.liveUntil;

      liveLocationWatchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const currentTime = Date.now();
          if (currentTime - lastLiveBroadcastRef.current < 7000) return; // throttle 7s
          lastLiveBroadcastRef.current = currentTime;

          const { latitude, longitude, accuracy, heading } = pos.coords;

          // Update message coordinates locally
          setMessages((prev) =>
            prev.map((m) => {
              if (m.id === activeMsgId) {
                try {
                  const p = parseMessageContent(m.content);
                  if (p.mediaType === "LIVE_LOCATION" && p.mediaData) {
                    p.mediaData.latitude = latitude;
                    p.mediaData.longitude = longitude;
                    p.mediaData.accuracy = accuracy;
                    p.mediaData.heading = heading || 0;
                    return { ...m, content: JSON.stringify(p) };
                  }
                } catch {}
              }
              return m;
            })
          );

          // Broadcast to server
          fetch(`/api/chats/${conversationId}/live-location`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messageId: activeMsgId,
              latitude,
              longitude,
              accuracy,
              heading,
              liveUntil: activeLiveUntil,
              isActive: true,
            }),
          }).catch(() => {});
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 5000 }
      );
    } else if (!activeLiveMsg && liveLocationWatchIdRef.current !== null) {
      navigator.geolocation.clearWatch(liveLocationWatchIdRef.current);
      liveLocationWatchIdRef.current = null;
    }

    return () => {
      if (liveLocationWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(liveLocationWatchIdRef.current);
        liveLocationWatchIdRef.current = null;
      }
    };
  }, [messages, currentUser?.id, conversationId]);

  // Block & Report Handlers
  const handleBlockUser = async (targetUserId: string, targetName: string) => {
    if (!confirm(`Are you sure you want to block ${targetName}?`)) return;

    try {
      const res = await fetch("/api/safety/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockedId: targetUserId }),
      });
      if (res.ok) {
        alert(`${targetName} has been blocked.`);
        router.push("/chats");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (accessDenied) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-[#090d0b]">
        <div className="max-w-md w-full px-6 py-12 text-center bg-white dark:bg-[#111815] border border-slate-200 dark:border-emerald-950/70 rounded-3xl shadow-2xl space-y-5">
          <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950/50 rounded-full flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8 text-rose-500" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
            {t.privateGateTitle}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {t.privateGateDesc}
          </p>
          <Link
            href="/discover"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.returnToDiscover}</span>
          </Link>
        </div>
      </div>
    );
  }

  if (isChatExpired) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-[#090d0b]">
        <div className="max-w-md w-full px-6 py-12 text-center bg-white dark:bg-[#111815] border border-slate-200 dark:border-emerald-950/70 rounded-3xl shadow-2xl space-y-5">
          <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950/50 rounded-full flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400">
            <Clock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
            {t.chatExpiredTitle}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {t.chatExpiredDesc}
          </p>
          <Link
            href="/chats"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.returnToChats}</span>
          </Link>
        </div>
      </div>
    );
  }

  const isTravel =
    conversation?.type === "TRAVEL" ||
    Boolean(conversation?.travelPlanId) ||
    Boolean(conversation?.travelPlan);
  const isActivity = !isTravel;

  const hasConnectedTripOrActivity = Boolean(
    conversation?.travelPlan ||
    conversation?.travelPlanId ||
    conversation?.activity ||
    conversation?.activityId
  );

  // Extract participants for Voice Call (both 1:1 and Group)
  const rawParticipants =
    conversation?.activity?.participants ||
    conversation?.travelPlan?.participants ||
    conversation?.participants ||
    [];

  const organizer = conversation?.activity?.organizer || conversation?.travelPlan?.organizer;
  const organizerId = conversation?.activity?.organizerId || conversation?.travelPlan?.organizerId;

  const otherParticipants: CallParticipant[] = [];

  if (organizer && organizer.id !== currentUser?.id) {
    otherParticipants.push({
      id: organizer.id,
      displayName: organizer.profile?.displayName || organizer.email?.split("@")[0] || "Host Organizer",
      avatarUrl: organizer.profile?.avatarUrl,
      isHost: true,
    });
  }

  rawParticipants.forEach((p: any) => {
    const userId = p.userId || p.user?.id;
    if (userId && userId !== currentUser?.id && userId !== organizerId) {
      const u = p.user;
      otherParticipants.push({
        id: userId,
        displayName: u?.profile?.displayName || u?.email?.split("@")[0] || "Traveler",
        avatarUrl: u?.profile?.avatarUrl,
        isHost: false,
      });
    }
  });

  // Fallback if otherParticipants is empty
  if (otherParticipants.length === 0) {
    otherParticipants.push({
      id: "partner-1",
      displayName: "Travel Companion",
      isHost: false,
    });
  }

  const isDirectChat =
    conversation?.type === "DIRECT" ||
    Boolean(conversation?.otherUser) ||
    (!conversation?.activity && !conversation?.travelPlan && otherParticipants.length <= 1);

  const directTitle =
    conversation?.otherUser?.displayName ||
    otherParticipants[0]?.displayName ||
    (conversation?.title?.includes("&")
      ? conversation.title
          .split("&")
          .map((s: string) => s.trim())
          .find((s: string) => s !== currentUser?.displayName && s !== currentUser?.email?.split("@")[0])
      : conversation?.title) ||
    "Travel Companion";

  const directAvatarUrl = conversation?.otherUser?.avatarUrl || otherParticipants[0]?.avatarUrl;
  const groupImageUrl =
    conversation?.activity?.imageUrl ||
    conversation?.travelPlan?.imageUrl ||
    (conversation?.travelPlan ? getTripImage(conversation.travelPlan) : conversation?.activity ? getActivityImage(conversation.activity) : null);
  const isDirectVerified = Boolean(conversation?.otherUser?.isVerified);
  const isGroupRoom = !isDirectChat;

  const handleCallEnded = (durationSecs: number, participantNames: string[]) => {
    if (durationSecs > 0) {
      const minutes = Math.floor(durationSecs / 60);
      const seconds = durationSecs % 60;
      const durationStr = `${minutes > 0 ? `${minutes}m ` : ""}${seconds}s`;
      handleSendMessage({
        text: `📞 Voice call ended • ${durationStr} (${participantNames.join(", ")})`,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex flex-row h-[100dvh] w-full bg-[#f8fafc] dark:bg-[#090d0b] text-slate-900 dark:text-slate-100 overflow-hidden font-sans select-none">
      {/* ── COLLAPSIBLE CHATS SIDEBAR (DESKTOP + MOBILE DRAWER) ── */}
      <ChatsSidebar
        activeConversationId={conversationId}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => {
          const next = !isSidebarCollapsed;
          setIsSidebarCollapsed(next);
          if (typeof window !== "undefined") {
            localStorage.setItem("travally_chats_sidebar", next ? "collapsed" : "expanded");
          }
        }}
        isMobileDrawerOpen={isMobileDrawerOpen}
        onCloseMobileDrawer={() => setIsMobileDrawerOpen(false)}
      />

      {/* ── ACTIVE CHAT ROOM CONTAINER ── */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-[#f8fafc] dark:bg-[#090d0b] relative overflow-hidden">
        {/* ── CHAT TOP APP BAR (TELEGRAM STYLE) ── */}
        <header className="relative z-20 flex items-center justify-between px-2.5 sm:px-6 py-2.5 sm:py-3 bg-white/90 dark:bg-[#111815]/90 backdrop-blur-2xl border-b border-slate-200/80 dark:border-emerald-950/70 shadow-sm shrink-0 gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            {/* Back to Inbox Link */}
            <Link
              href="/chats"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center bg-slate-100 dark:bg-[#18241f] hover:bg-slate-200 dark:hover:bg-[#203029] text-slate-600 dark:text-slate-300 transition-colors shrink-0"
              title="All Chats"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            {/* Expand Chats Sidebar button (ONLY shown when sidebar is collapsed on desktop) */}
            {isSidebarCollapsed && (
              <button
                type="button"
                suppressHydrationWarning
                onClick={() => {
                  setIsSidebarCollapsed(false);
                  if (typeof window !== "undefined") {
                    localStorage.setItem("travally_chats_sidebar", "expanded");
                  }
                }}
                className="hidden md:flex w-8 h-8 sm:w-9 sm:h-9 rounded-full items-center justify-center transition-colors shrink-0 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-100"
                title="Expand Chats Sidebar"
                aria-label="Expand Chats Sidebar"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>
            )}

            {/* Group or Direct Chat Profile Avatar & Active Status */}
            <button
              type="button"
              onClick={() => {
                if (isDirectChat) {
                  const targetId = conversation?.otherUser?.id || otherParticipants[0]?.id;
                  if (targetId && targetId !== "partner-1") {
                    router.push(`/profile/${targetId}?from=/chats/${conversationId}`);
                  }
                } else {
                  setIsMembersDrawerOpen(true);
                }
              }}
              className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1 text-left hover:opacity-85 transition p-1 -ml-1 rounded-xl cursor-pointer"
              title={isDirectChat ? `View ${directTitle}'s profile` : "Click to view all group members & details"}
            >
              {isDirectChat ? (
                <div suppressHydrationWarning className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full shrink-0 shadow-xs ring-1 ring-slate-200/80 dark:ring-emerald-500/20 overflow-hidden bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white font-black text-xs sm:text-sm">
                  {directAvatarUrl ? (
                    <img
                      src={directAvatarUrl}
                      alt={directTitle}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{directTitle.charAt(0).toUpperCase()}</span>
                  )}
                </div>
              ) : groupImageUrl ? (
                <div suppressHydrationWarning className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-2xl shrink-0 shadow-xs ring-1 ring-slate-200/80 dark:ring-emerald-500/20 overflow-hidden">
                  <img
                    src={groupImageUrl}
                    alt={conversation?.title || "Group"}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div
                  suppressHydrationWarning
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center shrink-0 border shadow-xs ${
                    isActivity
                      ? "bg-gradient-to-br from-emerald-100 via-teal-50 to-emerald-100 dark:from-emerald-950/80 dark:to-teal-900/60 text-emerald-700 dark:text-emerald-300 border-emerald-300/80 dark:border-emerald-700/60"
                      : "bg-gradient-to-br from-orange-100 via-amber-50 to-orange-100 dark:from-orange-950/80 dark:to-amber-900/60 text-orange-700 dark:text-orange-300 border-orange-300/80 dark:border-orange-700/60"
                  }`}
                >
                  {isActivity ? (
                    <Users className="w-4 sm:w-5 h-4 sm:h-5" />
                  ) : (
                    <Compass className="w-4 sm:w-5 h-4 sm:h-5" />
                  )}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <h1 className="text-xs sm:text-base font-extrabold text-slate-900 dark:text-white truncate">
                    {isDirectChat ? directTitle : (conversation?.title || "Loading Group...")}
                  </h1>
                  {isDirectChat && isDirectVerified && (
                    <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5 text-[10px] sm:text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    Active now
                  </span>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  {isDirectChat ? (
                    <span className="text-slate-500 dark:text-slate-400 font-medium">
                      Direct chat
                    </span>
                  ) : (
                    <span className="text-slate-500 dark:text-slate-400 hover:text-emerald-500 transition font-medium underline underline-offset-2 truncate">
                      {conversation?.activity?.participants?.length || conversation?.travelPlan?.participants?.length || otherParticipants.length + 1} members
                    </span>
                  )}
                </div>
              </div>
            </button>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Voice Call Button (Compact icon on mobile, with text on desktop) */}
            <button
              type="button"
              onClick={handleStartVoiceCall}
              className="w-8 h-8 sm:w-auto sm:px-3 sm:py-1.5 rounded-full bg-gradient-to-r from-emerald-100 via-teal-50 to-emerald-100 dark:from-emerald-950/80 dark:to-teal-900/60 text-emerald-900 dark:text-emerald-200 border border-emerald-300/80 dark:border-emerald-700/60 text-xs font-bold transition hover:from-emerald-200 hover:to-teal-100 shadow-xs active:scale-95 flex items-center justify-center gap-1.5 shrink-0"
              title="Start Voice Call"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-300 shrink-0" />
              <span className="hidden sm:inline">{t.callBtn}</span>
            </button>

            {conversation?.activity && (
              <Link
                href={`/activities/${conversation.activity.id}`}
                className="text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-[#18241f] hover:bg-slate-200 dark:hover:bg-[#203029] px-3.5 py-1.5 rounded-full transition-colors hidden sm:inline-flex items-center gap-1"
              >
                <span>Activity</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </Link>
            )}

            {conversation?.trip && (
              <Link
                href={`/travel/${conversation.trip.id}`}
                className="text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-[#18241f] hover:bg-slate-200 dark:hover:bg-[#203029] px-3.5 py-1.5 rounded-full transition-colors hidden sm:inline-flex items-center gap-1"
              >
                <span>Trip Info</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </Link>
            )}
          </div>
        </header>

        {/* ── MULTI-PIN MESSAGE BANNER (DOCKED RIGHT UNDER HEADER, LIFTED UP 20%) ── */}
        {pinnedMessages.length > 0 && (() => {
          const currentPin = pinnedMessages[Math.min(activePinIndex, pinnedMessages.length - 1)] || pinnedMessages[0];
          return (
            <div className="px-3 pt-1.5 pb-0 sm:px-4 max-w-4xl mx-auto w-full z-20">
              <div
                onClick={() => {
                  const el = document.getElementById(`msg-${currentPin.id}`);
                  if (el) {
                    el.scrollIntoView({ behavior: "smooth", block: "center" });
                    el.classList.add("ring-2", "ring-emerald-500", "rounded-2xl");
                    setTimeout(() => {
                      el.classList.remove("ring-2", "ring-emerald-500", "rounded-2xl");
                    }, 1800);
                  }
                  // When clicked: advance to next pin and scroll there
                  if (pinnedMessages.length > 1) {
                    setActivePinIndex((prev) => (prev + 1) % pinnedMessages.length);
                  }
                }}
                className="px-3 py-1 rounded-2xl bg-white/95 dark:bg-[#15221c]/95 backdrop-blur-md border border-slate-200/90 dark:border-emerald-950/80 shadow-xs flex items-center justify-between gap-2.5 text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-[#1a2b23] transition-colors select-none group"
                title={
                  pinnedMessages.length > 1
                    ? `Pin ${activePinIndex + 1} of ${pinnedMessages.length} (Click to scroll & cycle to next pin)`
                    : "Click to scroll to pinned message"
                }
              >
                <div className="flex items-center gap-2 truncate min-w-0">
                  <div className="relative flex items-center justify-center shrink-0">
                    <Pin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    {pinnedMessages.length > 1 && (
                      <span className="absolute -top-1.5 -right-2 text-[8px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-1 rounded-full border border-emerald-500/30">
                        {activePinIndex + 1}/{pinnedMessages.length}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 truncate text-[11px] sm:text-xs min-w-0">
                    <strong className="text-slate-800 dark:text-slate-200 shrink-0 font-bold">
                      {currentPin.senderName}:
                    </strong>
                    <span className="text-slate-500 dark:text-slate-400 truncate">
                      {currentPin.text}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {pinnedMessages.length > 1 && (
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors hidden sm:inline">
                      Tap to cycle
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPinnedMessages((prev) => {
                        const updated = prev.filter((p) => p.id !== currentPin.id);
                        try {
                          localStorage.setItem(`travally_pinned_${conversationId}`, JSON.stringify(updated));
                        } catch {}
                        return updated;
                      });
                      if (activePinIndex >= pinnedMessages.length - 1) {
                        setActivePinIndex(Math.max(0, pinnedMessages.length - 2));
                      }
                    }}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 cursor-pointer transition-colors"
                    title="Unpin this message"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

      {/* ── MESSAGES FEED (INSTAGRAM & TELEGRAM COMBINED) ── */}
      <main
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain p-3 sm:p-4 space-y-2 relative w-full max-w-full"
      >

        {/* ── 7-DAY RETENTION VALIDITY NOTICE ── */}
        <div className="flex flex-col items-center gap-1.5 pt-1 pb-3 px-3 max-w-sm sm:max-w-md mx-auto text-center select-none animate-fade-in">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-slate-200/60 dark:bg-white/5 border border-slate-300/40 dark:border-white/10 text-slate-500 dark:text-slate-400 text-[9.5px] font-medium">
            <Clock className="w-2.5 h-2.5 text-slate-400 shrink-0" />
            <span>
              {conversation?.retentionInfo?.statusLabel ||
                "Chats automatically delete 7 days after event completion"}
            </span>
          </div>
        </div>
        {loading || !currentUser ? (
          <div className="flex h-full items-center justify-center">
            <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center space-y-3 px-4">
            {isDirectChat ? (
              <div suppressHydrationWarning className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-md">
                <div suppressHydrationWarning className="w-full h-full rounded-full overflow-hidden bg-white dark:bg-[#111815] flex items-center justify-center">
                  {directAvatarUrl ? (
                    <img src={directAvatarUrl} alt={directTitle} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                      {directTitle.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-50 dark:bg-emerald-950/40 rounded-3xl flex items-center justify-center shadow-inner">
                <Users className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-600 dark:text-emerald-400" />
              </div>
            )}
            <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">
              {isDirectChat ? directTitle : "Private chat activated!"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
              {isDirectChat
                ? "This is the start of your direct message history with this traveler."
                : "Say hello, confirm timing, or react with emojis to break the ice."}
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = Boolean(
              currentUser?.id &&
              (msg.senderId === currentUser.id || msg.sender?.id === currentUser.id)
            );
            const senderName =
              msg.sender?.profile?.displayName ||
              (conversation?.otherUser?.id === msg.senderId ? conversation.otherUser.displayName : null) ||
              msg.sender?.email?.split("@")[0] ||
              "Member";
            const senderAvatarUrl =
              msg.sender?.profile?.avatarUrl ||
              (conversation?.otherUser?.id === msg.senderId ? conversation.otherUser.avatarUrl : null);

            const parsed = parseMessageContent(msg.content);

            // Hide trip/activity itinerary pins in direct chats where there is no connected trip or activity
            if (!hasConnectedTripOrActivity && parsed.mediaType === "TRIP") {
              return null;
            }

            const isEmojiOnly = isStandaloneEmoji(parsed.text) && !parsed.mediaType && !parsed.replyTo;
            const isCallLog = !parsed.isDeleted && !parsed.mediaType && isCallMessage(parsed.text);
            const reactions = parsed.reactions || {};
            const reactionKeys = Object.keys(reactions);

            // Delivery & Read status logic (WhatsApp 3-stage model: Sent -> Delivered -> Read)
            const readList: string[] = (() => {
              try {
                return JSON.parse(msg.readBy || "[]");
              } catch {
                return [];
              }
            })();
            // A message is read if any recipient is in readList or if there are subsequent replies from others
            const isReadByOthers = readList.some((id) => id !== msg.senderId);
            const hasSubsequentReply = messages.slice(idx + 1).some((m) => m.senderId !== msg.senderId);
            const isRead = isReadByOthers || hasSubsequentReply;
            const isDelivered = Date.now() - new Date(msg.createdAt).getTime() > 2000;
            const deliveryStatus: MessageDeliveryStatus =
              msg.status === "sending"
                ? "sending"
                : isRead
                ? "read"
                : isDelivered
                ? "delivered"
                : "sent";

            const otherParticipantName = messages.find((m) => m.senderId !== currentUser?.id)?.sender?.profile?.displayName || "Companion";

            // If message was deleted by current user for themselves, do not render
            if (parsed.deletedFor && Array.isArray(parsed.deletedFor) && parsed.deletedFor.includes(currentUser?.id)) {
              return null;
            }

            const isHeartBursting = heartBurstMsgId === msg.id;

            return (
              <div
                key={msg.id}
                id={`msg-${msg.id}`}
                className={`flex w-full ${isMe ? "justify-end" : "justify-start"} group/msg relative transition-all ${
                  contextMenuMsg?.msg?.id === msg.id ? "z-50" : "z-1"
                }`}
              >
                <div
                  className={`flex max-w-[85%] sm:max-w-[calc(100%-68px)] items-end gap-2 relative ${
                    isMe ? "flex-row-reverse" : "flex-row"
                  } ${contextMenuMsg?.msg?.id === msg.id ? "z-50" : "z-1"}`}
                >
                  {/* Sender Avatar for Received messages — ONLY shown in group chats (links to profile) */}
                  {!isMe && !isDirectChat && (
                    <Link
                      href={`/profile/${msg.senderId || msg.sender?.id}?from=/chats/${conversationId}`}
                      className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700/60 flex items-center justify-center text-[10px] font-bold text-emerald-800 dark:text-emerald-300 ring-1 ring-emerald-500/30 shrink-0 mb-1 shadow-sm overflow-hidden hover:opacity-80 transition cursor-pointer"
                      title={`View ${senderName}'s profile`}
                    >
                      {senderAvatarUrl ? (
                        <img
                          src={senderAvatarUrl}
                          alt={senderName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        senderName.charAt(0).toUpperCase()
                      )}
                    </Link>
                  )}

                  <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} min-w-0`}>
                    {!isMe && !isDirectChat && (
                      <Link
                        href={`/profile/${msg.senderId || msg.sender?.id}?from=/chats/${conversationId}`}
                        className="text-[11px] font-bold text-slate-500 dark:text-slate-400 ml-2 mb-0.5 hover:underline cursor-pointer"
                        title={`View ${senderName}'s profile`}
                      >
                        {senderName}
                      </Link>
                    )}

                    {/* ── DOUBLE-TAP TELEGRAM HEART BURST OVERLAY ── */}
                    {isHeartBursting && (
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-40 animate-telegram-pop">
                        <RealisticEmoji emoji="❤️" size={96} animate={true} />
                      </div>
                    )}

                    {/* ── FLOATING QUICK REACTIONS DOCK (Triggered by Double-Tap) ── */}
                    {activeReactionMsgId === msg.id && (
                      <div
                        data-chat-actions="true"
                        className={`absolute bottom-full mb-2 z-50 flex items-center gap-1.5 p-1.5 rounded-full bg-white/95 dark:bg-[#16221c]/95 backdrop-blur-2xl border border-slate-200/90 dark:border-emerald-700/60 shadow-[0_8px_30px_rgba(0,0,0,0.18)] animate-in zoom-in-95 fade-in duration-150 select-none ${
                          isMe ? "right-0" : "left-0"
                        }`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {["❤️", "👍", "😂", "😮", "🔥", "🙏"].map((em) => {
                          const isAlreadyReacted = (parsed.reactions?.[em] || []).includes(
                            currentUser?.displayName || currentUser?.email?.split("@")[0] || ""
                          );
                          return (
                            <button
                              key={em}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleReaction(msg.id, em);
                                setActiveReactionMsgId(null);
                              }}
                              className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-130 active:scale-95 cursor-pointer ${
                                isAlreadyReacted
                                  ? "bg-emerald-100 dark:bg-emerald-900/60 ring-2 ring-emerald-500/50 scale-110"
                                  : "hover:bg-slate-100 dark:hover:bg-white/10"
                              }`}
                              title={`React ${em}`}
                            >
                              <RealisticEmoji emoji={em} size={18} animate={true} />
                            </button>
                          );
                        })}

                        {/* More emojis (+) button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveReactionMsgId(null);
                            setIsEmojiPickerOpen(true);
                          }}
                          className="w-6.5 h-6.5 rounded-full bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-all hover:scale-110 cursor-pointer ml-0.5"
                          title="More reactions"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* ── BUBBLE CONTAINER (TOUCH LONG-PRESS / RIGHT-CLICK TO SELECT + SWIPE TO REPLY) ── */}
                    <div
                      className="relative flex items-center group/bubble"
                      style={{
                        transform: swipingMsgId === msg.id ? `translateX(${swipeOffset}px)` : "translateX(0px)",
                        transition: swipingMsgId === msg.id ? "none" : "transform 0.22s cubic-bezier(0.2, 0, 0, 1)",
                      }}
                    >
                      {/* Selection Checkbox in Select Mode */}
                      {isSelectMode && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMsgIds((prev) => {
                              const next = new Set(prev);
                              if (next.has(msg.id)) next.delete(msg.id);
                              else next.add(msg.id);
                              return next;
                            });
                          }}
                          className={`mr-2.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                            selectedMsgIds.has(msg.id)
                              ? "bg-emerald-600 border-emerald-600 text-white"
                              : "border-slate-300 dark:border-slate-600 bg-transparent"
                          }`}
                        >
                          {selectedMsgIds.has(msg.id) && <Check className="w-3 h-3 stroke-[3]" />}
                        </button>
                      )}

                      {/* Swipe reply indicator popping on left */}
                      {swipingMsgId === msg.id && swipeOffset > 8 && (
                        <div
                          className="absolute -left-9 flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950/90 text-emerald-600 dark:text-emerald-400 shadow-sm pointer-events-none transition-transform"
                          style={{
                            opacity: Math.min(1, swipeOffset / 35),
                            transform: `scale(${Math.min(1.1, swipeOffset / 35)}) rotate(${swipeOffset > 42 ? "0deg" : "-20deg"})`,
                          }}
                        >
                          <CornerDownRight className="w-4 h-4" />
                        </div>
                      )}

                      {/* ── HOVER / TAP ACTION BUTTONS AT SIDE OF BUBBLE (CHEVRON OPTIONS) ── */}
                      {!isSelectMode && !parsed.isDeleted && (
                        <div
                          data-chat-actions="true"
                          className={`flex absolute top-1.5 items-center gap-1 opacity-70 sm:opacity-0 sm:group-hover/bubble:opacity-100 focus-within:opacity-100 transition-all duration-150 z-20 ${
                            isMe ? "right-[calc(100%+6px)]" : "left-[calc(100%+6px)]"
                          }`}
                        >
                          {/* ⌵ Context Menu Trigger */}
                          <button
                            type="button"
                            onClick={(e) => handleOpenContextMenu(e, msg, parsed)}
                            className="w-6.5 h-6.5 rounded-full flex items-center justify-center bg-white/90 dark:bg-[#18241f]/90 backdrop-blur-md text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-[#203029] border border-slate-200/80 dark:border-white/10 shadow-xs hover:shadow-sm transition-all hover:scale-110 active:scale-95 cursor-pointer"
                            title="Message options"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {/* ── UNIFIED VIEWPORT-OPTIMIZED CONTEXT MENU DROPDOWN ── */}
                      {contextMenuMsg?.msg?.id === msg.id && (
                        <div
                          data-chat-actions="true"
                          className="absolute z-50 w-[180px] min-w-[175px] max-w-[calc(100vw-32px)] p-1 rounded-2xl bg-white/95 dark:bg-[#121c17]/95 backdrop-blur-2xl border border-slate-200/90 dark:border-emerald-800/50 shadow-[0_12px_36px_rgba(0,0,0,0.14),0_2px_8px_rgba(0,0,0,0.06)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.7)] animate-scale-up text-xs select-none max-h-[min(380px,calc(100vh-100px))] overflow-y-auto no-scrollbar"
                          style={{
                            top: contextMenuMsg?.direction === "up" ? "auto" : "100%",
                            bottom: contextMenuMsg?.direction === "up" ? "100%" : "auto",
                            [isMe ? "right" : "left"]: "0px",
                            marginTop: contextMenuMsg?.direction === "up" ? "0px" : "6px",
                            marginBottom: contextMenuMsg?.direction === "up" ? "6px" : "0px",
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* 1. Quick Reactions Tray at top of Dropdown */}
                          <div className="flex items-center justify-between gap-1 px-1 py-1 mb-1 rounded-xl bg-slate-100/80 dark:bg-emerald-950/40 border border-slate-200/60 dark:border-emerald-800/30">
                            {["👍", "❤️", "😂", "😮", "🙏"].map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleReaction(msg.id, emoji);
                                  setContextMenuMsg(null);
                                }}
                                className="w-6 h-6 rounded-md hover:scale-125 active:scale-95 transition-transform flex items-center justify-center hover:bg-white dark:hover:bg-emerald-900/50 shadow-xs cursor-pointer"
                                title={`React ${emoji}`}
                              >
                                <RealisticEmoji emoji={emoji} size={16} />
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setContextMenuMsg(null);
                                setIsEmojiPickerOpen(true);
                              }}
                              className="w-5.5 h-5.5 rounded-md bg-slate-200/80 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-all hover:scale-110 cursor-pointer"
                              title="More reactions"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="h-px bg-slate-200/70 dark:bg-emerald-900/30 my-0.5 mx-1" />

                          {/* 2. Message info */}
                          <button
                            type="button"
                            onClick={() => {
                              setMessageInfoTarget({ msg, parsed });
                              setContextMenuMsg(null);
                            }}
                            className="w-full px-2.5 py-1.5 rounded-xl flex items-center gap-2.5 hover:bg-slate-100/90 dark:hover:bg-emerald-950/50 text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors cursor-pointer text-left group"
                          >
                            <Info className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 shrink-0" />
                            <span className="text-xs font-medium">Message info</span>
                          </button>

                          {/* 3. Reply */}
                          <button
                            type="button"
                            onClick={() => {
                              setReplyingTo({
                                id: msg.id,
                                senderName: isMe ? "You" : senderName,
                                text: parsed.text || parsed.mediaType || "Message",
                              });
                              setContextMenuMsg(null);
                              textareaRef.current?.focus();
                            }}
                            className="w-full px-2.5 py-1.5 rounded-xl flex items-center gap-2.5 hover:bg-slate-100/90 dark:hover:bg-emerald-950/50 text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors cursor-pointer text-left group"
                          >
                            <Reply className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 shrink-0" />
                            <span className="text-xs font-medium">Reply</span>
                          </button>

                          {/* 4. Copy */}
                          {parsed.text && (
                            <button
                              type="button"
                              onClick={() => {
                                handleCopyText(parsed.text, msg.id);
                                setContextMenuMsg(null);
                              }}
                              className="w-full px-2.5 py-1.5 rounded-xl flex items-center gap-2.5 hover:bg-slate-100/90 dark:hover:bg-emerald-950/50 text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors cursor-pointer text-left group"
                            >
                              <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 shrink-0" />
                              <span className="text-xs font-medium">Copy</span>
                            </button>
                          )}

                          {/* 5. Forward */}
                          <button
                            type="button"
                            onClick={() => {
                              handleForwardMessage(parsed.text || parsed.mediaType || "Shared message");
                              setContextMenuMsg(null);
                            }}
                            className="w-full px-2.5 py-1.5 rounded-xl flex items-center gap-2.5 hover:bg-slate-100/90 dark:hover:bg-emerald-950/50 text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors cursor-pointer text-left group"
                          >
                            <Forward className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 shrink-0" />
                            <span className="text-xs font-medium">Forward</span>
                          </button>

                          {/* 6. Pin / Unpin (up to 5 pins per person) */}
                          <button
                            type="button"
                            onClick={() => {
                              handleTogglePin(msg, parsed, isMe ? "You" : senderName);
                            }}
                            className="w-full px-2.5 py-1.5 rounded-xl flex items-center gap-2.5 hover:bg-slate-100/90 dark:hover:bg-emerald-950/50 text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors cursor-pointer text-left group"
                          >
                            {pinnedMessages.some((p) => p.id === msg.id) ? (
                              <>
                                <PinOff className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Unpin</span>
                              </>
                            ) : (
                              <>
                                <Pin className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 shrink-0" />
                                <span className="text-xs font-medium">Pin</span>
                              </>
                            )}
                          </button>

                          {/* 7. Select */}
                          <button
                            type="button"
                            onClick={() => {
                              setIsSelectMode(true);
                              setSelectedMsgIds(new Set([msg.id]));
                              setContextMenuMsg(null);
                            }}
                            className="w-full px-2.5 py-1.5 rounded-xl flex items-center gap-2.5 hover:bg-slate-100/90 dark:hover:bg-emerald-950/50 text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors cursor-pointer text-left group"
                          >
                            <CheckSquare className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 shrink-0" />
                            <span className="text-xs font-medium">Select</span>
                          </button>

                          <div className="h-px bg-slate-200/70 dark:bg-emerald-900/30 my-0.5 mx-1" />

                          {/* 8. Delete */}
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteTargetMsg({ msg, parsed });
                              setContextMenuMsg(null);
                            }}
                            className="w-full px-2.5 py-1.5 rounded-xl flex items-center gap-2.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 transition-colors cursor-pointer text-left group"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <span className="text-xs font-medium">Delete</span>
                          </button>
                        </div>
                      )}

                      <div
                        onClick={(e) => {
                          if (isSelectMode) {
                            e.stopPropagation();
                            setSelectedMsgIds((prev) => {
                              const next = new Set(prev);
                              if (next.has(msg.id)) {
                                next.delete(msg.id);
                                if (next.size === 0) setIsSelectMode(false);
                              } else {
                                next.add(msg.id);
                              }
                              return next;
                            });
                          }
                        }}
                        onDoubleClick={(e) => {
                          if (!isSelectMode) handleDoubleTap(msg.id, e);
                        }}
                        onTouchStart={(e) => handleTouchStart(msg, parsed, e)}
                        onTouchMove={(e) => handleTouchMove(msg, parsed, e)}
                        onTouchEnd={(e) => handleTouchEnd(msg, parsed, e)}
                        onContextMenu={(e) => {
                          if (!isSelectMode) handleContextMenu(msg, parsed, e);
                        }}
                        className={`relative group rounded-[20px] transition-all select-text cursor-pointer ${
                          isSelectMode && selectedMsgIds.has(msg.id)
                            ? isTravel
                              ? "ring-2 ring-orange-500 bg-orange-500/15 dark:bg-orange-500/25 scale-[1.01]"
                              : "ring-2 ring-emerald-500 bg-emerald-500/15 dark:bg-emerald-500/25 scale-[1.01]"
                            : selectedMessage?.msg?.id === msg.id
                            ? isTravel
                              ? "ring-2 ring-orange-500/50 scale-[1.01]"
                              : "ring-2 ring-emerald-500/50 scale-[1.01]"
                            : ""
                        } ${
                        isEmojiOnly || isCallLog
                          ? "bg-transparent p-0 shadow-none border-0"
                          : isMe
                          ? isTravel
                            ? "bg-gradient-to-br from-orange-100 via-amber-50 to-orange-100 dark:from-orange-950/70 dark:to-amber-950/60 text-slate-800 dark:text-slate-100 border border-orange-200/90 dark:border-orange-800/60 shadow-xs rounded-br-[4px] px-3 pt-1.5 pb-1 min-w-[70px]"
                            : "bg-gradient-to-br from-emerald-100 via-teal-50 to-emerald-100 dark:from-emerald-950/70 dark:to-teal-950/60 text-slate-800 dark:text-slate-100 border border-emerald-200/90 dark:border-emerald-800/60 shadow-xs rounded-br-[4px] px-3 pt-1.5 pb-1 min-w-[70px]"
                          : "bg-white dark:bg-[#16201b] text-slate-800 dark:text-slate-100 border border-slate-200/90 dark:border-emerald-950/80 shadow-xs rounded-bl-[4px] px-3 pt-1.5 pb-1 min-w-[65px]"
                      }`}
                    >
                      {/* Quoted Reply Block */}
                      {parsed.replyTo && (
                        <div
                          onClick={() => {
                            const target = document.getElementById(`msg-${parsed.replyTo?.id}`);
                            target?.scrollIntoView({ behavior: "smooth", block: "center" });
                          }}
                          className={`mb-1 p-1.5 rounded-lg text-xs cursor-pointer border-l-2 transition-colors ${
                            isMe
                              ? isTravel
                                ? "bg-white/80 dark:bg-black/20 border-orange-400 text-slate-800 dark:text-slate-200 hover:bg-white"
                                : "bg-white/80 dark:bg-black/20 border-emerald-400 text-slate-800 dark:text-slate-200 hover:bg-white"
                              : "bg-slate-100 dark:bg-[#1d2b24] border-emerald-500 text-slate-700 dark:text-slate-300 hover:bg-slate-200/70"
                          }`}
                        >
                          <strong className="block text-[10.5px] font-bold opacity-90">
                            {parsed.replyTo.senderName}
                          </strong>
                          <p className="line-clamp-1 text-[10.5px] opacity-75">
                            {parsed.replyTo.text}
                          </p>
                        </div>
                      )}

                      {/* Standalone Telegram Animated Moving Emoji or Call Event Card or Text or Deleted Message */}
                      {parsed.isDeleted ? (
                        <div className="flex items-center gap-1.5 py-1 px-1 text-slate-400 dark:text-slate-500 italic text-xs select-none">
                          <Ban className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>This message was deleted</span>
                        </div>
                      ) : isEmojiOnly ? (
                        <div
                          className="flex items-center gap-2 py-0.5 px-0.5 select-none"
                          title="Telegram Animated Emoji (Tap to pop!)"
                        >
                          {splitEmojis(parsed.text).map((em, idx) => (
                            <RealisticEmoji
                              key={idx}
                              emoji={em}
                              size={68}
                              animate={true}
                            />
                          ))}
                        </div>
                      ) : isCallLog ? (
                        (() => {
                          const callInfo = parseCallLog(parsed.text);
                          return (
                            <div className={`w-full min-w-[240px] max-w-[310px] rounded-[20px] p-3 border transition-all shadow-xs ${
                              callInfo.isMissed
                                ? isMe
                                  ? "bg-gradient-to-br from-rose-50/95 via-rose-50/60 to-amber-50/50 dark:from-[#251519] dark:via-[#1e171a] dark:to-[#1a1719] border-rose-200/90 dark:border-rose-900/60"
                                  : "bg-white dark:bg-[#1a1719] border-rose-200/80 dark:border-rose-900/50"
                                : isMe
                                  ? "bg-gradient-to-br from-emerald-50/95 via-teal-50/60 to-emerald-50/50 dark:from-[#12231b] dark:via-[#15201b] dark:to-[#12231b] border-emerald-200/90 dark:border-emerald-900/60"
                                  : "bg-white dark:bg-[#15201b] border-emerald-200/80 dark:border-emerald-900/50"
                            }`}>
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                                  callInfo.isMissed
                                    ? "bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-900/60"
                                    : "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-900/60"
                                }`}>
                                  {callInfo.isMissed ? (
                                    <PhoneMissed className="w-5 h-5 shrink-0" />
                                  ) : (
                                    <PhoneCall className="w-5 h-5 shrink-0" />
                                  )}
                                </div>

                                <div className="min-w-0 flex-1">
                                  <h4 className="text-[13px] font-bold text-slate-800 dark:text-slate-100 leading-tight truncate">
                                    {callInfo.title}
                                  </h4>
                                  <p className="text-[11.5px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5 leading-normal">
                                    {callInfo.subtitle}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-slate-200/60 dark:border-slate-800/80">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStartVoiceCall();
                                  }}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11.5px] font-semibold transition shadow-xs active:scale-95 cursor-pointer hover:brightness-105 ${
                                    callInfo.isMissed
                                      ? "bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-rose-500/20"
                                      : "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-emerald-500/20"
                                  }`}
                                >
                                  <Phone className="w-3 h-3 shrink-0" />
                                  <span>{callInfo.actionText}</span>
                                </button>

                                <div className="inline-flex items-center gap-1 text-[9px] font-medium text-slate-400 dark:text-slate-500 select-none">
                                  <span title={formatTimeAgo(msg.createdAt)}>
                                    {formatMessageTime(msg.createdAt)}
                                  </span>
                                  {isMe && (
                                    <MessageStatusBeacon
                                      status={deliveryStatus}
                                      size={12}
                                      recipientName={otherParticipantName}
                                      timestamp={formatMessageTime(msg.createdAt)}
                                    />
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })()
                      ) : parsed.mediaType === "AUDIO" && parsed.mediaData?.audioUrl ? (
                        <div className="flex flex-col gap-1 min-w-0">
                          <VoiceNotePlayer
                            audioUrl={parsed.mediaData.audioUrl}
                            duration={parsed.mediaData.duration}
                            waveform={parsed.mediaData.waveform}
                            isMe={isMe}
                            isTravel={isTravel}
                          />
                          <div
                            className={`inline-flex items-center gap-0.5 ml-auto pl-1.5 self-end shrink-0 select-none pb-0.5 ${
                              isMe
                                ? isTravel
                                  ? "text-orange-950/60 dark:text-orange-300/60"
                                  : "text-emerald-950/60 dark:text-emerald-300/60"
                                : "text-slate-400 dark:text-slate-500"
                            }`}
                          >
                            <span
                              className="text-[8.5px] font-medium tracking-tight whitespace-nowrap"
                              title={formatTimeAgo(msg.createdAt)}
                            >
                              {formatMessageTime(msg.createdAt)}
                            </span>
                            {isMe && (
                              <MessageStatusBeacon
                                status={deliveryStatus}
                                size={12}
                                recipientName={otherParticipantName}
                                timestamp={formatMessageTime(msg.createdAt)}
                              />
                            )}
                          </div>
                        </div>
                      ) : (parsed.mediaType === "TRIP" || parsed.mediaType === "LOCATION") && parsed.text && parsed.text !== "📍 Location Pin" ? (
                        <div className="text-[12px] font-bold text-slate-800 dark:text-slate-100 opacity-90 px-0.5 pt-0.5">
                          {parsed.text}
                        </div>
                      ) : !parsed.mediaType ? (
                        <div className="flex items-end justify-between gap-x-2 min-w-0">
                          <span className="whitespace-pre-wrap text-[13px] sm:text-[13.5px] leading-snug font-normal break-words select-text">
                            {parsed.text}
                          </span>
                          <span
                            className={`inline-flex items-center gap-0.5 ml-auto pl-1.5 self-end shrink-0 select-none pb-0.5 ${
                              isMe
                                ? isTravel
                                  ? "text-orange-950/60 dark:text-orange-300/60"
                                  : "text-emerald-950/60 dark:text-emerald-300/60"
                                : "text-slate-400 dark:text-slate-500"
                            }`}
                          >
                            <span
                              className="text-[8.5px] font-medium tracking-tight whitespace-nowrap"
                              title={formatTimeAgo(msg.createdAt)}
                            >
                              {formatMessageTime(msg.createdAt)}
                            </span>
                            {isMe && (
                              <MessageStatusBeacon
                                status={deliveryStatus}
                                size={12}
                                recipientName={otherParticipantName}
                                timestamp={formatMessageTime(msg.createdAt)}
                              />
                            )}
                          </span>
                        </div>
                      ) : null}

                      {/* Media Container: Photo (WhatsApp-style layout supporting up to 3 photos) */}
                      {!parsed.isDeleted && parsed.mediaType === "PHOTO" && (parsed.mediaData?.urls?.length || parsed.mediaData?.url) && (() => {
                        const photos: string[] = parsed.mediaData.urls?.length ? parsed.mediaData.urls : [parsed.mediaData.url];
                        return (
                          <div className="mt-2 rounded-2xl overflow-hidden shadow-sm max-w-sm">
                            {photos.length === 1 ? (
                              <img
                                src={photos[0]}
                                alt="Shared photo"
                                onClick={() => setViewingPhoto(photos[0])}
                                className="w-full max-h-72 object-cover hover:scale-[1.02] transition-transform duration-300 cursor-pointer"
                              />
                            ) : photos.length === 2 ? (
                              <div className="grid grid-cols-2 gap-1 bg-black/10">
                                {photos.map((p, i) => (
                                  <img
                                    key={i}
                                    src={p}
                                    alt={`Photo ${i + 1}`}
                                    onClick={() => setViewingPhoto(p)}
                                    className="w-full h-44 object-cover hover:scale-[1.02] transition-transform duration-300 cursor-pointer"
                                  />
                                ))}
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 gap-1 bg-black/10">
                                <img
                                  src={photos[0]}
                                  alt="Photo 1"
                                  onClick={() => setViewingPhoto(photos[0])}
                                  className="row-span-2 w-full h-full min-h-[160px] max-h-72 object-cover hover:scale-[1.02] transition-transform duration-300 cursor-pointer"
                                />
                                <img
                                  src={photos[1]}
                                  alt="Photo 2"
                                  onClick={() => setViewingPhoto(photos[1])}
                                  className="w-full h-28 object-cover hover:scale-[1.02] transition-transform duration-300 cursor-pointer"
                                />
                                <img
                                  src={photos[2]}
                                  alt="Photo 3"
                                  onClick={() => setViewingPhoto(photos[2])}
                                  className="w-full h-28 object-cover hover:scale-[1.02] transition-transform duration-300 cursor-pointer"
                                />
                              </div>
                            )}
                            {parsed.mediaData.caption && (
                              <p className="p-2 text-xs opacity-90 leading-relaxed font-normal whitespace-pre-wrap">
                                {parsed.mediaData.caption}
                              </p>
                            )}
                          </div>
                        );
                      })()}

                      {/* Media Container: WhatsApp-style Live Location Card */}
                      {!parsed.isDeleted && parsed.mediaType === "LIVE_LOCATION" && parsed.mediaData && (() => {
                        const isExpired = parsed.mediaData.liveUntil
                          ? new Date(parsed.mediaData.liveUntil).getTime() <= Date.now()
                          : false;
                        const isCurrentlyActive = Boolean(parsed.mediaData.isActive) && !isExpired;
                        const formattedLiveUntil = parsed.mediaData.liveUntil
                          ? formatMessageTime(parsed.mediaData.liveUntil)
                          : "";

                        return (
                          <div
                            className={`mt-2 p-3 rounded-2xl border ${
                              isTravel
                                ? "border-orange-200/90 dark:border-orange-800/60"
                                : "border-emerald-200/90 dark:border-emerald-800/60"
                            } bg-white/95 dark:bg-[#16221c] text-slate-800 dark:text-slate-200 shadow-sm space-y-2.5 max-w-[280px] sm:max-w-xs`}
                          >
                            {/* Live Badge Status Bar */}
                            <div className="flex items-center justify-between gap-2">
                              {isCurrentlyActive ? (
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-700/60">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                                  <span>Live until {formattedLiveUntil}</span>
                                </div>
                              ) : (
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-[#1a2620] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-emerald-950/60">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  <span>Live location ended</span>
                                </div>
                              )}
                              {parsed.mediaData.accuracy && isCurrentlyActive && (
                                <span className="text-[10px] text-slate-400 font-mono">
                                  ±{Math.round(parsed.mediaData.accuracy)}m
                                </span>
                              )}
                            </div>

                            {/* Mini Map View */}
                            <LiveLocationMiniMap
                              latitude={parsed.mediaData.latitude}
                              longitude={parsed.mediaData.longitude}
                              accuracy={parsed.mediaData.accuracy}
                              displayName={senderName}
                              avatarUrl={senderAvatarUrl || undefined}
                              isActive={isCurrentlyActive}
                              onClick={() => {
                                setActiveLiveModalData({
                                  messageId: msg.id,
                                  latitude: parsed.mediaData.latitude,
                                  longitude: parsed.mediaData.longitude,
                                  accuracy: parsed.mediaData.accuracy,
                                  displayName: senderName,
                                  avatarUrl: senderAvatarUrl,
                                  liveUntil: parsed.mediaData.liveUntil,
                                  isActive: isCurrentlyActive,
                                  note: parsed.mediaData.note,
                                  address: parsed.mediaData.address,
                                });
                              }}
                            />

                            {/* Note / Caption if present */}
                            {parsed.mediaData.note && (
                              <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 px-0.5 leading-snug">
                                {parsed.mediaData.note}
                              </p>
                            )}

                            {/* Card Footer Actions */}
                            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-emerald-950/40">
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveLiveModalData({
                                    messageId: msg.id,
                                    latitude: parsed.mediaData.latitude,
                                    longitude: parsed.mediaData.longitude,
                                    accuracy: parsed.mediaData.accuracy,
                                    displayName: senderName,
                                    avatarUrl: senderAvatarUrl,
                                    liveUntil: parsed.mediaData.liveUntil,
                                    isActive: isCurrentlyActive,
                                    note: parsed.mediaData.note,
                                    address: parsed.mediaData.address,
                                  });
                                }}
                                className={`text-[11px] font-bold ${
                                  isTravel
                                    ? "text-orange-600 dark:text-orange-400"
                                    : "text-emerald-600 dark:text-emerald-400"
                                } hover:underline flex items-center gap-1 cursor-pointer`}
                              >
                                <span>View live location</span>
                                <ExternalLink className="w-3 h-3" />
                              </button>

                              {isMe && isCurrentlyActive && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStopSharingLiveLocation(msg.id);
                                  }}
                                  className="text-[11px] font-bold text-rose-500 hover:text-rose-600 hover:underline cursor-pointer"
                                >
                                  Stop sharing
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Media Container: Location Pin Card */}
                      {!parsed.isDeleted && parsed.mediaType === "LOCATION" && parsed.mediaData && (
                        <div
                          className={`mt-2 p-3 rounded-2xl border ${
                            isTravel
                              ? "border-orange-200/90 dark:border-orange-800/60"
                              : "border-emerald-200/90 dark:border-emerald-800/60"
                          } bg-white/80 dark:bg-[#18241f] text-slate-800 dark:text-slate-200 shadow-xs flex items-start gap-3`}
                        >
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                              isTravel
                                ? "bg-gradient-to-br from-orange-100 via-amber-50 to-orange-100 text-orange-700 border border-orange-300/80"
                                : "bg-gradient-to-br from-emerald-100 via-teal-50 to-emerald-100 text-emerald-700 border border-emerald-300/80"
                            }`}
                          >
                            <MapPin className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <strong className="block text-xs font-bold truncate text-slate-900 dark:text-white">
                              {parsed.mediaData.title}
                            </strong>
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-1">
                              {parsed.mediaData.address}
                            </p>
                            <a
                              href={parsed.mediaData.mapLink}
                              target="_blank"
                              rel="noreferrer"
                              className={`text-[10px] font-bold ${
                                isTravel
                                  ? "text-orange-600 dark:text-orange-400"
                                  : "text-emerald-600 dark:text-emerald-400"
                              } hover:underline mt-1 inline-block`}
                            >
                              Open in Maps →
                            </a>
                          </div>
                        </div>
                      )}

                      {/* Media Container: Trip / Activity Card Snippet */}
                      {!parsed.isDeleted && parsed.mediaType === "TRIP" && parsed.mediaData && (
                        <div
                          onClick={() => {
                            if (parsed.mediaData.tripId) {
                              router.push(`/travel/${parsed.mediaData.tripId}`);
                            } else if (parsed.mediaData.activityId) {
                              router.push(`/activities/${parsed.mediaData.activityId}`);
                            } else if (conversation?.travelPlanId || conversation?.travelPlan?.id) {
                              router.push(`/travel/${conversation.travelPlanId || conversation.travelPlan.id}`);
                            } else if (conversation?.activityId || conversation?.activity?.id) {
                              router.push(`/activities/${conversation.activityId || conversation.activity.id}`);
                            }
                          }}
                          className={`mt-2 p-3 rounded-2xl border ${
                            isTravel
                              ? "border-orange-200/90 dark:border-orange-800/60 hover:border-orange-400"
                              : "border-emerald-200/90 dark:border-emerald-800/60 hover:border-emerald-400"
                          } bg-white/80 dark:bg-[#18241f] text-slate-800 dark:text-slate-200 shadow-xs flex items-start gap-3 cursor-pointer transition hover:shadow-md`}
                          title="Click to view itinerary"
                        >
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-100 via-teal-50 to-emerald-100 text-emerald-700 border border-emerald-300/80 flex items-center justify-center shrink-0 shadow-xs">
                            <Compass className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <strong className="block text-xs font-bold truncate text-slate-900 dark:text-white">
                              {parsed.mediaData.title}
                            </strong>
                            <p className="text-[11px] text-slate-600 dark:text-slate-400">
                              {parsed.mediaData.dates}
                            </p>
                            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 block mt-0.5">
                              {parsed.mediaData.budget}
                            </span>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0 self-center" />
                        </div>
                      )}

                      {/* ── IN-BUBBLE TIMESTAMP & STATUS INDICATOR (For media messages & deleted placeholders) ── */}
                      {!isEmojiOnly && (parsed.mediaType || parsed.isDeleted) && parsed.mediaType !== "AUDIO" && (
                        <div
                          className={`flex items-center justify-end gap-1 mt-1 select-none ${
                            isMe
                              ? isTravel
                                ? "text-orange-900/60 dark:text-orange-300/60"
                                : "text-emerald-900/60 dark:text-emerald-300/60"
                              : "text-slate-400 dark:text-slate-500"
                          }`}
                        >
                          <span
                            className="text-[9px] font-medium tracking-tight whitespace-nowrap"
                            title={formatTimeAgo(msg.createdAt)}
                          >
                            {formatMessageTime(msg.createdAt)}
                          </span>
                          {isMe && (
                            <MessageStatusBeacon
                              status={deliveryStatus}
                              size={14}
                              recipientName={otherParticipantName}
                              timestamp={formatMessageTime(msg.createdAt)}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                    {/* ── REACTION CHIPS DOCKED AT BOTTOM OF BUBBLE ── */}
                    {!parsed.isDeleted && reactionKeys.length > 0 && contextMenuMsg?.msg?.id !== msg.id && (
                      <div
                        className={`flex flex-wrap items-center gap-1 mt-0.5 z-10 ${
                          isMe ? "justify-end" : "justify-start"
                        }`}
                      >
                        {reactionKeys.map((emoji) => {
                          const reactors = reactions[emoji];
                          const hasReacted = reactors.includes(
                            currentUser?.displayName || currentUser?.email?.split("@")[0] || ""
                          );

                          return (
                            <button
                              key={emoji}
                              type="button"
                              onClick={(e) => handleToggleReaction(msg.id, emoji, e)}
                              title={`Reacted by: ${reactors.join(", ")}`}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold shadow-xs transition-all transform hover:scale-110 active:scale-95 ${
                                hasReacted
                                  ? isTravel
                                    ? "bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-800"
                                    : "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                                  : "bg-white dark:bg-[#16201b] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-emerald-950/60 hover:bg-slate-50"
                              }`}
                            >
                              <RealisticEmoji emoji={emoji} size={16} animate={true} />
                              {reactors.length > 1 && (
                                <span className="text-[11px] font-bold">{reactors.length}</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Emoji-only timestamp & status footer */}
                    {isEmojiOnly && (
                      <div
                        className={`flex items-center gap-1 mt-0.5 px-0.5 text-[10px] font-medium text-slate-400 dark:text-slate-500 ${
                          isMe ? "justify-end" : "justify-start"
                        }`}
                      >
                        <span title={formatTimeAgo(msg.createdAt)}>{formatMessageTime(msg.createdAt)}</span>
                        {isMe && (
                          <MessageStatusBeacon
                            status={deliveryStatus}
                            size={14}
                            recipientName={otherParticipantName}
                            timestamp={formatMessageTime(msg.createdAt)}
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* ── LIVE INSTAGRAM-STYLE TYPING INDICATOR ── */}
        <TypingIndicator typingUsers={typingUsers} isGroupChat={!isDirectChat} />

        <div ref={messagesEndRef} className="h-4" />
      </main>

      {/* ── FLOATING SCROLL TO BOTTOM BUTTON WITH UNREAD BADGE ── */}
      {showScrollBottom && (
        <button
          type="button"
          onClick={() => scrollToBottom(true)}
          className="absolute bottom-20 sm:bottom-22 right-2.5 sm:right-3.5 z-30 w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-full bg-white/95 dark:bg-[#15221c]/95 backdrop-blur-md border border-slate-200/90 dark:border-emerald-800/40 shadow-lg text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
          aria-label="Scroll to bottom"
        >
          <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          {unreadCount > 0 && (
            <span
              className={`absolute -top-1 -right-1 min-w-[14px] h-3.5 px-1 rounded-full ${
                isTravel ? "bg-orange-500" : "bg-emerald-500"
              } text-white text-[8px] font-bold shadow-sm inline-flex items-center justify-center`}
            >
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* ── BOTTOM INPUT BAR & CONTROLS ── */}
      <footer className="relative z-20 px-3 sm:px-6 pb-3 pt-1 bg-transparent border-t-0 shadow-none">
        {/* Reply Quote Preview Banner */}
        {replyingTo && (
          <div
            className={`max-w-4xl mx-auto mb-2 px-3.5 py-2 rounded-2xl bg-white dark:bg-[#18241f] border-l-4 ${
              isTravel ? "border-orange-500" : "border-emerald-500"
            } border border-slate-200/80 dark:border-emerald-950/70 shadow-md flex items-center justify-between text-xs animate-slide-up`}
          >
            <div className="min-w-0 flex-1">
              <span
                className={`text-[11px] font-bold ${
                  isTravel ? "text-orange-600 dark:text-orange-400" : "text-emerald-600 dark:text-emerald-400"
                } block`}
              >
                Replying to {replyingTo.senderName}
              </span>
              <p className="text-slate-600 dark:text-slate-300 line-clamp-1 text-[11px]">
                {replyingTo.text}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setReplyingTo(null)}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="max-w-4xl mx-auto flex items-end gap-2 relative">
          {/* Hidden multi-image file input for WhatsApp-style photo sending */}
          <input
            type="file"
            ref={photoInputRef}
            accept="image/*"
            multiple
            className="hidden"
            onChange={handlePhotoFilesSelected}
          />

          {/* Attachment Menu Popover */}
          <AttachmentPopover
            isOpen={isAttachmentOpen}
            onClose={() => setIsAttachmentOpen(false)}
            onSelectAttachment={handleSelectAttachment}
            showItineraryPin={hasConnectedTripOrActivity}
            itineraryType={conversation?.activity || conversation?.activityId ? "ACTIVITY" : "TRAVEL"}
          />

          {isRecordingVoice ? (
            /* WhatsApp-style Live Audio Recording Bar with Soundwave Visualizer Graph */
            <div className="flex-1 bg-gradient-to-r from-rose-50 via-white to-rose-50 dark:from-[#25151a] dark:via-[#1c181a] dark:to-[#25151a] rounded-2xl border border-rose-300 dark:border-rose-900/70 shadow-sm flex items-center justify-between px-3 py-1.5 min-h-[46px] animate-in fade-in duration-150">
              {/* Cancel Button */}
              <button
                type="button"
                onClick={() => stopVoiceRecording(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-100/70 dark:text-rose-400 dark:hover:bg-rose-950/60 transition cursor-pointer shrink-0"
                title="Cancel voice recording"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Cancel</span>
              </button>

              {/* Pulsing Red Dot & Timer */}
              <div className="flex items-center gap-1.5 select-none shrink-0 px-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                  {formatRecordingTimer(recordingDuration)}
                </span>
              </div>

              {/* Real-Time Live Waveform Graph Animation */}
              <div className="flex items-center gap-[2.5px] h-7 px-2 overflow-hidden flex-1 justify-center max-w-[160px] sm:max-w-[220px]">
                {liveWaveform.map((val, idx) => {
                  const heightPx = Math.max(
                    4,
                    Math.min(26, Math.round((val / 100) * 26))
                  );
                  return (
                    <div
                      key={idx}
                      style={{ height: `${heightPx}px` }}
                      className="w-1 bg-rose-500 dark:bg-rose-400 rounded-full transition-all duration-75"
                    />
                  );
                })}
              </div>

              {/* Release to Send Note */}
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 select-none hidden md:block shrink-0">
                Release to send
              </div>
            </div>
          ) : (
            <>
              {/* Attachment Toggle (+) */}
              <button
                type="button"
                data-attachment-toggle="true"
                onClick={() => {
                  setIsAttachmentOpen(!isAttachmentOpen);
                  setIsEmojiPickerOpen(false);
                }}
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-transform active:scale-95 ${
                  isAttachmentOpen
                    ? isTravel
                      ? "bg-gradient-to-br from-orange-100 via-amber-50 to-orange-100 text-orange-700 dark:from-orange-950/80 dark:to-amber-900/60 dark:text-orange-300 border border-orange-300/80 dark:border-orange-700/60 shadow-xs"
                      : "bg-gradient-to-br from-emerald-100 via-teal-50 to-emerald-100 text-emerald-800 dark:from-emerald-950/80 dark:to-teal-900/60 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-700/60 shadow-xs"
                    : "bg-white dark:bg-[#18241f] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#203029] border border-slate-200/90 dark:border-emerald-950/80 shadow-xs"
                }`}
                title="Attach photo, location, or voice"
              >
                <Plus
                  className={`w-5 h-5 transition-transform ${
                    isAttachmentOpen ? "rotate-45" : ""
                  }`}
                />
              </button>

              {/* Auto-expanding Input Box */}
              <div
                className={`flex-1 bg-white dark:bg-[#16201b] rounded-2xl border ${
                  isTranscribing
                    ? "border-emerald-500 ring-2 ring-emerald-500/50 shadow-md"
                    : "border-slate-200/90 dark:border-emerald-950/80"
                } shadow-sm focus-within:ring-2 ${
                  isTravel
                    ? "focus-within:ring-orange-500/30 focus-within:border-orange-500"
                    : "focus-within:ring-emerald-500/30 focus-within:border-emerald-500"
                } transition-all flex flex-col justify-end px-3 py-1.5 min-h-[46px] overflow-hidden`}
              >
                {/* Visual Listening Banner when voice typing is active */}
                {isTranscribing && (
                  <div className="w-full flex items-center justify-between pb-1.5 mb-1 border-b border-emerald-200 dark:border-emerald-800/60 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 animate-in fade-in duration-150">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      <span>🎙️ Listening... Speak now!</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => startSpeechRecognition()}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 font-bold hover:bg-emerald-200 transition cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                )}

                <div className="w-full flex items-end">
                  <textarea
                    ref={textareaRef}
                    value={inputMessage}
                    onChange={handleInputChange}
                    onBlur={() => sendTypingStatus(false)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder={
                      isTranscribing
                        ? "Speak now, words will appear here..."
                        : t.tapToMessage
                    }
                    className="flex-1 max-h-32 bg-transparent text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none resize-none leading-relaxed py-1.5"
                    rows={1}
                  />

                  {/* Emoji / Keyboard Toggle inside bar */}
                  <button
                    type="button"
                    data-emoji-toggle="true"
                    onClick={() => {
                      if (isEmojiPickerOpen) {
                        setIsEmojiPickerOpen(false);
                        textareaRef.current?.focus();
                      } else {
                        setIsEmojiPickerOpen(true);
                        setIsAttachmentOpen(false);
                      }
                    }}
                    className={`p-1.5 rounded-xl transition-all shrink-0 active:scale-90 ${
                      isEmojiPickerOpen
                        ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60"
                        : isTravel
                        ? "text-slate-400 hover:text-orange-500"
                        : "text-slate-400 hover:text-emerald-500"
                    }`}
                    title={isEmojiPickerOpen ? "Switch to keyboard" : "Emoji picker"}
                  >
                    {isEmojiPickerOpen ? (
                      <Keyboard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Smile className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Dynamic Action Button: Send message when text exists, or WhatsApp-style Hold-to-Record / Double-Tap Voice Button */}
          {inputMessage.trim() && !isRecordingVoice ? (
            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={sending}
              className={`w-11 h-11 rounded-2xl ${
                isTravel
                  ? "bg-gradient-to-br from-orange-100 via-amber-50 to-orange-100 hover:from-orange-200 hover:to-amber-100 text-orange-700 dark:from-orange-950/80 dark:to-amber-900/60 dark:text-orange-300 border border-orange-300/80 dark:border-orange-700/60"
                  : "bg-gradient-to-br from-emerald-100 via-teal-50 to-emerald-100 hover:from-emerald-200 hover:to-teal-100 text-emerald-800 dark:from-emerald-950/80 dark:to-teal-900/60 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-700/60"
              } shadow-xs flex items-center justify-center shrink-0 transition-transform active:scale-95 disabled:opacity-50 cursor-pointer`}
              title="Send message"
            >
              <Send className="w-5 h-5 ml-0.5" />
            </button>
          ) : (
            <div className="relative shrink-0">
              {/* Floating Instruction Tooltip */}
              {recordingTooltip && (
                <div className="absolute right-0 bottom-full mb-2.5 z-30 pointer-events-none animate-in fade-in slide-in-from-bottom-1 duration-150">
                  <div className="bg-slate-900/95 text-white text-[11px] font-medium py-1.5 px-3 rounded-xl shadow-lg border border-slate-700/60 whitespace-nowrap flex items-center gap-1.5 backdrop-blur-xs">
                    <Mic className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{recordingTooltip}</span>
                  </div>
                </div>
              )}

              <button
                type="button"
                onPointerDown={handleMicPointerDown}
                onPointerUp={handleMicPointerUp}
                onPointerLeave={handleMicPointerCancel}
                onDoubleClick={(e) => {
                  e.preventDefault();
                  if (micLongPressTimerRef.current) {
                    clearTimeout(micLongPressTimerRef.current);
                    micLongPressTimerRef.current = null;
                  }
                  tapCountRef.current = 0;
                  startSpeechRecognition();
                }}
                onContextMenu={(e) => e.preventDefault()}
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all select-none cursor-pointer ${
                  isRecordingVoice
                    ? "bg-rose-500 text-white ring-4 ring-rose-400/50 scale-105 shadow-md animate-pulse"
                    : isTranscribing
                    ? "bg-emerald-600 text-white ring-4 ring-emerald-400/50 shadow-md animate-pulse"
                    : "bg-gradient-to-br from-emerald-100 via-teal-50 to-emerald-100 hover:from-emerald-200 hover:to-teal-100 text-emerald-800 dark:from-emerald-950/80 dark:to-teal-900/60 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-700/60 shadow-xs active:scale-95"
                }`}
                title="Hold to record voice message • Double-tap to voice type"
              >
                <Mic
                  className={`w-5 h-5 ${
                    isRecordingVoice || isTranscribing ? "animate-bounce" : ""
                  }`}
                />
              </button>
            </div>
          )}
        </div>

        {/* Emoji Keyboard Section: docked at bottom replacing keyboard space */}
        {isEmojiPickerOpen && (
          <div className="w-full mt-2 animate-in slide-in-from-bottom-2 duration-200">
            <EmojiPickerPopover
              isOpen={isEmojiPickerOpen}
              onClose={() => {
                setIsEmojiPickerOpen(false);
                textareaRef.current?.focus();
              }}
              onSelectEmoji={(emoji) => {
                setInputMessage((prev) => prev + emoji);
              }}
            />
          </div>
        )}
      </footer>
      </div>

      {/* ── WHATSAPP-STYLE MESSAGE INFO MODAL ── */}
      {messageInfoTarget && (() => {
        const msg = messageInfoTarget.msg;
        const parsed = messageInfoTarget.parsed;

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 select-none"
            onClick={() => setMessageInfoTarget(null)}
          >
            <div
              className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#121c17] border border-slate-200 dark:border-emerald-950/80 shadow-2xl p-5 space-y-4 animate-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-emerald-950/60 pb-3">
                <div className="flex items-center gap-2">
                  <Info className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                    Message info
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setMessageInfoTarget(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#1b2621] text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Message snippet preview */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#18241e] border border-slate-200/80 dark:border-emerald-950/80 text-xs text-slate-800 dark:text-slate-200">
                <p className="line-clamp-3 font-medium">{parsed.text || parsed.mediaType || "Attachment"}</p>
                <span className="text-[10px] text-slate-400 mt-1.5 block">
                  {new Date(msg.createdAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                </span>
              </div>

              {/* Delivery / Read Status Breakdown */}
              <div className="space-y-3 pt-1">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 flex items-center justify-center shrink-0">
                    <CheckCheck className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">Read</span>
                    <span className="text-[11px] text-slate-400">
                      {formatTimeAgo(msg.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-[#18241e] text-slate-500 flex items-center justify-center shrink-0">
                    <CheckCheck className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">Delivered</span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              </div>

              {/* End to end encryption notice */}
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-2 text-[11px] text-amber-900 dark:text-amber-200">
                <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Messages are end-to-end encrypted with 256-bit AES-GCM.</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── WHATSAPP-STYLE DELETE MESSAGE CONFIRMATION MODAL ── */}
      {deleteTargetMsg && (() => {
        const isMe = Boolean(
          currentUser?.id &&
          (deleteTargetMsg.msg.senderId === currentUser.id || deleteTargetMsg.msg.sender?.id === currentUser.id)
        );
        const msgCreatedAt = deleteTargetMsg.msg.createdAt
          ? new Date(deleteTargetMsg.msg.createdAt).getTime()
          : Date.now();
        const ageMinutes = (Date.now() - msgCreatedAt) / (1000 * 60);
        const canDeleteForEveryone = isMe && ageMinutes <= 15;
        const remainingMinutes = Math.max(1, Math.round(15 - ageMinutes));

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 select-none"
            onClick={() => setDeleteTargetMsg(null)}
          >
            <div
              className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#121c17] border border-slate-200 dark:border-emerald-950/80 shadow-2xl p-5 space-y-4 animate-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                    Delete message?
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
                    {canDeleteForEveryone
                      ? `You can delete for everyone (${remainingMinutes}m remaining) or just for yourself.`
                      : "You can delete this message for yourself."}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                {canDeleteForEveryone && (
                  <button
                    type="button"
                    disabled={isDeletingMsg}
                    onClick={async () => {
                      await handleDeleteMessage(deleteTargetMsg.msg.id, "everyone");
                      setDeleteTargetMsg(null);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
                  >
                    Delete for everyone
                  </button>
                )}

                <button
                  type="button"
                  disabled={isDeletingMsg}
                  onClick={async () => {
                    await handleDeleteMessage(deleteTargetMsg.msg.id, "me");
                    setDeleteTargetMsg(null);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#1c2923] dark:hover:bg-[#25372f] text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer"
                >
                  Delete for me
                </button>

                <button
                  type="button"
                  onClick={() => setDeleteTargetMsg(null)}
                  className="w-full py-2 px-4 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white font-semibold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── WHATSAPP-STYLE MULTI-SELECT BOTTOM ACTION BAR ── */}
      {isSelectMode && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-[#111815]/95 backdrop-blur-xl border-t border-slate-200 dark:border-emerald-950/80 p-3 sm:p-4 shadow-2xl flex items-center justify-between max-w-4xl mx-auto animate-slide-up select-none">
          <div className="flex items-center gap-3">
            <span className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-white">
              {selectedMsgIds.size} selected
            </span>
            <button
              type="button"
              onClick={() => {
                setIsSelectMode(false);
                setSelectedMsgIds(new Set());
              }}
              className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white hover:underline cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBatchCopySelected}
              disabled={selectedMsgIds.size === 0}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-emerald-950 bg-white dark:bg-[#16201b] text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 disabled:opacity-40 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </button>

            <button
              type="button"
              onClick={handleBatchDeleteSelected}
              disabled={selectedMsgIds.size === 0}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      )}

      {/* Safety Report Modal */}
      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        targetType="USER"
        targetId={reportTarget.id}
        targetName={reportTarget.name}
      />

      {/* End-to-End Encryption Security Modal */}
      <E2EESecurityModal
        isOpen={securityModalOpen}
        onClose={() => setSecurityModalOpen(false)}
        conversationId={conversationId}
        conversationTitle={conversation?.title}
      />

      {/* Group Details & Members Drawer */}
      <GroupMembersDrawer
        isOpen={isMembersDrawerOpen}
        onClose={() => setIsMembersDrawerOpen(false)}
        conversation={conversation}
        currentUser={currentUser}
        onMemberRemoved={() => {
          fetchChatData();
        }}
        onMemberAdded={() => {
          fetchChatData();
        }}
        onGroupProfileUpdated={(newImageUrl) => {
          setConversation((prev: any) => {
            if (!prev) return prev;
            return {
              ...prev,
              activity: prev.activity ? { ...prev.activity, imageUrl: newImageUrl } : prev.activity,
              travelPlan: prev.travelPlan ? { ...prev.travelPlan, imageUrl: newImageUrl } : prev.travelPlan,
            };
          });
        }}
        onOpenReport={(target) => {
          setReportTarget(target);
          setReportModalOpen(true);
        }}
        onBlockUser={(targetUserId, targetName) => {
          handleBlockUser(targetUserId, targetName);
        }}
      />

      {/* Direct Chat Companion Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={selectedProfileUser}
        showChatOption={false}
      />

      {/* ── INCOMING VOICE CALL ALERT DIALOG (LUMINOUS SPATIAL AUDIO CAPSULE) ── */}
      {incomingCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/80 backdrop-blur-xl animate-fade-in select-none">
          <div className="relative w-full max-w-[390px] rounded-[38px] p-6 sm:p-7 flex flex-col items-center text-center overflow-hidden animate-scale-up bg-gradient-to-b from-white/95 via-emerald-50/70 to-teal-50/80 dark:from-[#0d1713]/95 dark:via-[#08110e]/95 dark:to-[#040806]/98 border border-white/80 dark:border-emerald-500/25 shadow-[0_25px_70px_-12px_rgba(16,185,129,0.3),0_10px_25px_-5px_rgba(0,0,0,0.06)] dark:shadow-[0_30px_90px_-15px_rgba(0,0,0,0.9),0_0_40px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/20">
            {/* Ambient Aura Background */}
            <div className="absolute -top-24 inset-x-0 h-48 bg-gradient-to-b from-emerald-400/25 via-teal-400/15 to-transparent blur-3xl pointer-events-none animate-aura-breathe" />
            <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Top Pill Status */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/25 dark:border-emerald-500/40 shadow-xs mb-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-black tracking-wider uppercase bg-gradient-to-r from-emerald-700 to-teal-700 dark:from-emerald-300 dark:to-teal-300 bg-clip-text text-transparent">
                Incoming Voice Call
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-600/15 text-emerald-800 dark:text-emerald-300 font-bold">
                Direct P2P
              </span>
            </div>

            {/* Caller Avatar with Concentric Sonic Radar Ripple */}
            <div className="relative my-3">
              <div className="absolute -inset-6 rounded-full border border-emerald-400/25 dark:border-emerald-400/30 animate-radar-ripple pointer-events-none" />
              <div className="absolute -inset-3 rounded-full border border-teal-400/35 dark:border-teal-400/40 animate-ping opacity-50 pointer-events-none" />
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-emerald-500/25 to-teal-400/20 blur-md" />
              {incomingCall.callerAvatar ? (
                <img
                  src={incomingCall.callerAvatar}
                  alt={incomingCall.callerName}
                  className="w-24 h-24 rounded-full object-cover relative z-10 ring-4 ring-white dark:ring-[#131c18] shadow-2xl"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-400 text-white font-black text-3xl flex items-center justify-center relative z-10 ring-4 ring-white dark:ring-[#131c18] shadow-2xl">
                  {(incomingCall.callerName || "U").charAt(0).toUpperCase()}
                </div>
              )}
              {/* Corner Phone Emblem */}
              <div className="absolute -bottom-1 -right-1 z-20 w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md ring-2 ring-white dark:ring-[#08110e]">
                <Phone className="w-3.5 h-3.5 animate-pulse" />
              </div>
            </div>

            {/* Caller Name */}
            <div className="mt-1">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {incomingCall.callerName}
              </h3>
            </div>

            {/* Simulated Ringing Audio Equalizer Wave */}
            <div className="flex items-center justify-center gap-1.5 h-6 my-4">
              {[0.4, 0.75, 1.0, 0.6, 0.9, 0.5, 0.95, 0.65, 0.4].map((scale, i) => (
                <span
                  key={i}
                  className="w-1 rounded-full bg-gradient-to-t from-emerald-600 to-teal-400 dark:from-emerald-400 dark:to-teal-300"
                  style={{
                    height: `${Math.round(scale * 22)}px`,
                    animation: `audioWave 1.2s ease-in-out infinite`,
                    animationDelay: `${i * 120}ms`,
                  }}
                />
              ))}
            </div>

            {/* Tactile Dual Action Capsule Dock */}
            <div className="w-full grid grid-cols-2 gap-3.5 mt-1 pt-1 z-10">
              <button
                type="button"
                onClick={handleDeclineIncomingCall}
                className="group relative overflow-hidden py-3.5 px-4 rounded-2xl bg-rose-50 hover:bg-rose-100/90 dark:bg-rose-500/15 dark:hover:bg-rose-500/25 border border-rose-200/90 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center justify-center gap-2.5 transition-all active:scale-95 shadow-xs cursor-pointer"
                title="Decline Call"
              >
                <span className="w-7 h-7 rounded-xl bg-rose-500/15 dark:bg-rose-500/25 flex items-center justify-center group-hover:rotate-12 transition-transform">
                  <PhoneOff className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                </span>
                <span>Decline</span>
              </button>

              <button
                type="button"
                onClick={handleAcceptIncomingCall}
                className="group relative overflow-hidden py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold text-xs flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 active:scale-95 transition-all cursor-pointer"
                title="Accept Call"
              >
                <span className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Phone className="w-3.5 h-3.5 text-white animate-pulse" />
                </span>
                <span>Accept Call</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── WHATSAPP-STYLE SHARE LOCATION MODAL ── */}
      <ShareLocationModal
        isOpen={isShareLocationOpen}
        onClose={() => setIsShareLocationOpen(false)}
        onShareLiveLocation={handleShareLiveLocation}
        onSendCurrentLocation={handleSendCurrentLocation}
      />

      {/* ── EXPANDED LIVE LOCATION TRACKING MODAL ── */}
      <LiveLocationModal
        isOpen={Boolean(activeLiveModalData)}
        onClose={() => setActiveLiveModalData(null)}
        data={activeLiveModalData}
        isMe={activeLiveModalData?.messageId ? messages.find((m) => m.id === activeLiveModalData.messageId)?.senderId === currentUser?.id : false}
        onStopSharing={handleStopSharingLiveLocation}
      />

      {/* ── WEBRTC VOICE CALL MODAL ── */}
      <VoiceCallModal
        isOpen={isCallModalOpen}
        onClose={() => {
          setIsCallModalOpen(false);
          setActiveCallId(null);
          setIsIncomingCall(false);
          setIncomingCallOffer(null);
        }}
        conversationId={conversationId}
        conversationTitle={conversation?.title}
        isGroup={isGroupRoom}
        otherParticipants={otherParticipants}
        currentUser={currentUser}
        activeCallId={activeCallId}
        isIncomingCall={isIncomingCall}
        incomingCallOffer={incomingCallOffer}
        onCallEnded={handleCallEnded}
      />

      {/* ── WHATSAPP-STYLE PHOTO PREVIEW & SENDER MODAL (MAX 3 AT A TIME, NO MENTION) ── */}
      {isPhotoPreviewOpen && pendingPhotos.length > 0 && (
        <div className="fixed inset-0 z-50 bg-[#0b141a]/98 text-white flex flex-col justify-between select-none animate-fade-in">
          {/* Top Bar */}
          <div className="flex items-center justify-between p-3 sm:p-4 bg-black/40 backdrop-blur-md z-10">
            <button
              type="button"
              onClick={() => {
                setIsPhotoPreviewOpen(false);
                setPendingPhotos([]);
                setPhotoCaption("");
              }}
              className="p-2 rounded-full hover:bg-white/10 transition active:scale-95 text-white cursor-pointer"
              title="Cancel"
            >
              <X className="w-6 h-6" />
            </button>

            {pendingPhotos.length > 1 && (
              <span className="text-xs font-semibold text-slate-300">
                {activePhotoIndex + 1} of {pendingPhotos.length}
              </span>
            )}

            <button
              type="button"
              onClick={() => {
                const nextPhotos = pendingPhotos.filter((_, idx) => idx !== activePhotoIndex);
                if (nextPhotos.length === 0) {
                  setIsPhotoPreviewOpen(false);
                  setPendingPhotos([]);
                  setPhotoCaption("");
                } else {
                  setPendingPhotos(nextPhotos);
                  setActivePhotoIndex(Math.min(activePhotoIndex, nextPhotos.length - 1));
                }
              }}
              className="p-2 rounded-full hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 transition active:scale-95 cursor-pointer"
              title="Delete photo"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>

          {/* Main Photo Preview */}
          <div className="flex-1 flex items-center justify-center p-2 sm:p-4 min-h-0 overflow-hidden relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={pendingPhotos[activePhotoIndex]}
              alt={`Selected ${activePhotoIndex + 1}`}
              className="max-h-full max-w-full object-contain rounded-xl shadow-2xl transition-all duration-200"
            />
          </div>

          {/* Bottom Bar: Thumbnails & Caption */}
          <div className="p-3 sm:p-4 bg-black/50 backdrop-blur-md space-y-3 z-10">
            {/* Thumbnails strip (if multiple) */}
            {pendingPhotos.length > 1 && (
              <div className="flex items-center justify-center gap-2 overflow-x-auto no-scrollbar py-1">
                {pendingPhotos.map((photo, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActivePhotoIndex(idx)}
                    className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                      activePhotoIndex === idx
                        ? "border-[#00a884] scale-105 shadow-md"
                        : "border-transparent opacity-60 hover:opacity-90"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Caption Input & WhatsApp Send Button */}
            <div className="max-w-xl mx-auto flex items-center gap-2 sm:gap-3">
              <div className="flex-1 flex items-center gap-2 bg-[#202c33] rounded-full px-4 py-2 sm:py-2.5 shadow-inner">
                <input
                  type="text"
                  value={photoCaption}
                  onChange={(e) => setPhotoCaption(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSendPendingPhotos();
                    }
                  }}
                  placeholder="Add a caption..."
                  className="flex-1 bg-transparent text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none"
                  autoFocus
                />
              </div>

              <button
                type="button"
                onClick={handleSendPendingPhotos}
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#00a884] hover:bg-[#008f6f] text-white flex items-center justify-center shadow-lg active:scale-95 transition cursor-pointer shrink-0"
                title="Send photo"
              >
                <Send className="w-5 h-5 ml-0.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox / Zoom view for clicked photo in message bubble */}
      {viewingPhoto && (
        <div
          onClick={() => setViewingPhoto(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in select-none cursor-pointer"
        >
          <button
            type="button"
            onClick={() => setViewingPhoto(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={viewingPhoto}
            alt="Enlarged photo"
            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}
