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
  Flag,
  UserX,
  MoreVertical,
  Check,
  CheckCheck,
  Image as ImageIcon,
  Phone,
  PhoneOff,
  Video,
  Smile,
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
} from "lucide-react";
import { formatTimeAgo, formatMessageTime } from "@/lib/utils";
import { ReportModal } from "@/components/common/ReportModal";
import { RealisticEmoji } from "@/components/chat/RealisticEmoji";
import { EmojiPickerPopover } from "@/components/chat/EmojiPickerPopover";
import { VoiceCallModal, CallParticipant } from "@/components/chat/VoiceCallModal";
import { AttachmentPopover } from "@/components/chat/AttachmentPopover";
import { MessageStatusBeacon, type MessageDeliveryStatus } from "@/components/chat/MessageStatusBeacon";
import { E2EESecurityModal } from "@/components/chat/E2EESecurityModal";
import { ChatsSidebar } from "@/components/chat/ChatsSidebar";
import { GroupMembersDrawer } from "@/components/chat/GroupMembersDrawer";
import { encryptChatMessage, decryptChatMessage, isE2EEMessage } from "@/lib/crypto";

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
  mediaType?: "PHOTO" | "LOCATION" | "TRIP";
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

export default function ActiveChatPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params?.id as string;

  const [conversation, setConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [isChatExpired, setIsChatExpired] = useState(false);

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

  // Safety & E2EE modals
  const [securityModalOpen, setSecurityModalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
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
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);

  // WebRTC Voice Call States
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [isIncomingCall, setIsIncomingCall] = useState(false);
  const [incomingCallOffer, setIncomingCallOffer] = useState<any>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Toggle Live Speech-to-Text Voice Transcription
  const toggleVoiceTranscription = () => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Live speech transcription is supported in modern browsers like Chrome, Edge, and Safari.");
      return;
    }

    if (isTranscribing) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsTranscribing(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsTranscribing(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript.trim()) {
          setInputMessage((prev) => {
            const cleanPrev = prev.trim();
            return cleanPrev ? `${cleanPrev} ${transcript.trim()}` : transcript.trim();
          });
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsTranscribing(false);
      };

      recognition.onend = () => {
        setIsTranscribing(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error(err);
      setIsTranscribing(false);
    }
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
          }
          const rawMessages = data.messages || [];
          const decryptedList = await Promise.all(
            rawMessages.map(async (msg: any) => ({
              ...msg,
              content: await decryptFast(msg),
            }))
          );
          setMessages(decryptedList);

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
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) setCurrentUser(data.user);
      })
      .catch(() => {});

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

  // Double-tap Instagram style quick react with ❤️
  const handleDoubleTap = (messageId: string, e: React.MouseEvent) => {
    e.preventDefault();
    setHeartBurstMsgId(messageId);
    setTimeout(() => setHeartBurstMsgId(null), 900);
    handleToggleReaction(messageId, "❤️");
  };

  // Long-press and context menu handlers with WhatsApp-style swipe-to-reply
  const handleTouchStart = (msg: any, parsed: MessagePayload, e: React.TouchEvent) => {
    if (parsed.isDeleted) return;
    touchStartPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    setSwipingMsgId(msg.id);
    setSwipeOffset(0);

    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      setSelectedMessage({ msg, parsed });
      setSwipingMsgId(null);
      setSwipeOffset(0);
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(40);
      }
    }, 450);
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

  const handleTouchEnd = (msg: any, parsed: MessagePayload) => {
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
    }

    setSwipingMsgId(null);
    setSwipeOffset(0);
    touchStartPosRef.current = null;
  };

  const handleContextMenu = (msg: any, parsed: MessagePayload, e: React.MouseEvent) => {
    e.preventDefault();
    if (parsed.isDeleted) return;
    setSelectedMessage({ msg, parsed });
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

  // Attachment Handler (Photo, Location, Trip)
  const handleSelectAttachment = (type: "PHOTO" | "LOCATION" | "TRIP") => {
    if (type === "PHOTO") {
      handleSendMessage({
        text: "Shared a high-res photo from our Parvati Valley trail scouting!",
        mediaType: "PHOTO",
        mediaData: {
          url: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800&auto=format&fit=crop&q=80",
          caption: "Kasol Chalal pine forest trail this morning 🌲",
        },
      });
    } else if (type === "LOCATION") {
      handleSendMessage({
        text: "Here is the exact public venue meeting point:",
        mediaType: "LOCATION",
        mediaData: {
          title: "Suchitra Film Society, BSK 2nd Stage, Bengaluru",
          address: "No. 36, 9th Main, BV Karanth Road, Bengaluru 560070",
          mapLink: "https://maps.google.com/?q=Suchitra+Film+Society+Bengaluru",
        },
      });
    } else if (type === "TRIP") {
      handleSendMessage({
        text: "Trip Itinerary Pin",
        mediaType: "TRIP",
        mediaData: {
          title: conversation?.travelPlan?.destination || "Kasol & Tosh Parvati Valley Trek",
          dates: "Oct 12 – Oct 17 • 6 Days",
          budget: "₹8,500 – ₹14,500 per traveler",
        },
      });
    }
  };

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
            Private Group Gate
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            This private group chat is protected. Direct messaging unlocks automatically once your join request is accepted by the host.
          </p>
          <Link
            href="/discover"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Discover</span>
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
            Chat Expired & Deleted
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            In accordance with Travally’s privacy policy, this chat reached its 7-day validity period after event completion and was permanently deleted from the database.
          </p>
          <Link
            href="/chats"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Chats</span>
          </Link>
        </div>
      </div>
    );
  }

  const isActivity = conversation?.type === "ACTIVITY";

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

  const isGroupRoom = otherParticipants.length > 1;

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

            {/* Group Avatar & Active Status (CLICKABLE TO OPEN GROUP MEMBERS PANEL) */}
            <button
              type="button"
              onClick={() => setIsMembersDrawerOpen(true)}
              className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1 text-left hover:opacity-85 transition p-1 -ml-1 rounded-xl cursor-pointer"
              title="Click to view all group members & details"
            >
              <div
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

              <div className="min-w-0 flex-1">
                <h1 className="text-xs sm:text-base font-extrabold text-slate-900 dark:text-white truncate">
                  {conversation?.title || "Loading Group..."}
                </h1>
                <div className="flex items-center gap-1.5 mt-0.5 text-[10px] sm:text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    Active Room
                  </span>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className="text-slate-500 dark:text-slate-400 hover:text-emerald-500 transition font-medium underline underline-offset-2 truncate">
                    {conversation?.activity?.participants?.length || conversation?.travelPlan?.participants?.length || 2} members
                  </span>
                </div>
              </div>
            </button>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Voice Call Button (Compact icon on mobile, with text on desktop) */}
            <button
              type="button"
              onClick={() => {
                setActiveCallId(null);
                setIsIncomingCall(false);
                setIncomingCallOffer(null);
                setIsCallModalOpen(true);
              }}
              className="w-8 h-8 sm:w-auto sm:px-3 sm:py-1.5 rounded-full bg-gradient-to-r from-emerald-100 via-teal-50 to-emerald-100 dark:from-emerald-950/80 dark:to-teal-900/60 text-emerald-900 dark:text-emerald-200 border border-emerald-300/80 dark:border-emerald-700/60 text-xs font-bold transition hover:from-emerald-200 hover:to-teal-100 shadow-xs active:scale-95 flex items-center justify-center gap-1.5 shrink-0"
              title="Start Voice Call"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-300 shrink-0" />
              <span className="hidden sm:inline">Call</span>
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

      {/* ── MESSAGES FEED (INSTAGRAM & TELEGRAM COMBINED) ── */}
      <main
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4 space-y-2 relative"
      >
        {/* ── WHATSAPP-STYLE IN-CHAT ENCRYPTION & 7-DAY RETENTION VALIDITY BANNER ── */}
        <div className="flex flex-col items-center gap-1.5 pt-1 pb-3 px-3 max-w-sm sm:max-w-md mx-auto text-center select-none animate-fade-in">
          {/* WhatsApp-style End-to-End Encrypted pill */}
          <button
            type="button"
            onClick={() => setSecurityModalOpen(true)}
            className="group px-3 py-1.5 rounded-xl bg-amber-500/10 dark:bg-amber-400/10 hover:bg-amber-500/15 border border-amber-500/25 dark:border-amber-400/25 text-amber-900 dark:text-amber-200 text-[10px] sm:text-[10.5px] leading-tight flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
            title="Tap to verify End-to-End Encryption keys"
          >
            <Lock className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Messages and calls are end-to-end encrypted. No one outside of this chat, not even Travally, can read or listen to them. Tap to learn more.</span>
          </button>

          {/* 7-Day Post-Event Validity / Auto-Deletion Notice */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-slate-200/60 dark:bg-white/5 border border-slate-300/40 dark:border-white/10 text-slate-500 dark:text-slate-400 text-[9.5px] font-medium">
            <Clock className="w-2.5 h-2.5 text-slate-400 shrink-0" />
            <span>
              {conversation?.retentionInfo?.statusLabel ||
                "Chats automatically delete 7 days after event completion"}
            </span>
          </div>
        </div>
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center space-y-3">
            <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-950/40 rounded-3xl flex items-center justify-center shadow-inner">
              <Users className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              Private chat activated!
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
              Say hello, confirm timing, or react with emojis to break the ice.
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.senderId === currentUser?.id;
            const senderName = msg.sender?.profile?.displayName || msg.sender?.email?.split("@")[0] || "Member";

            const parsed = parseMessageContent(msg.content);
            const isEmojiOnly = isStandaloneEmoji(parsed.text) && !parsed.mediaType && !parsed.replyTo;
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
                className={`flex w-full ${isMe ? "justify-end" : "justify-start"} group/msg relative transition-all`}
              >
                <div
                  className={`flex max-w-[85%] sm:max-w-[70%] items-end gap-2 relative ${
                    isMe ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  {/* Sender Avatar for Received messages */}
                  {!isMe && (
                    <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700/60 flex items-center justify-center text-[10px] font-bold text-emerald-800 dark:text-emerald-300 ring-1 ring-emerald-500/30 shrink-0 mb-1 shadow-sm">
                      {senderName.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} min-w-0`}>
                    {!isMe && (
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 ml-2 mb-0.5">
                        {senderName}
                      </span>
                    )}

                    {/* ── DOUBLE-TAP TELEGRAM HEART BURST OVERLAY ── */}
                    {isHeartBursting && (
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-40 animate-telegram-pop">
                        <RealisticEmoji emoji="❤️" size={96} animate={true} />
                      </div>
                    )}

                    {/* ── BUBBLE CONTAINER (TOUCH LONG-PRESS / RIGHT-CLICK TO SELECT + SWIPE TO REPLY) ── */}
                    <div
                      className="relative flex items-center"
                      style={{
                        transform: swipingMsgId === msg.id ? `translateX(${swipeOffset}px)` : "translateX(0px)",
                        transition: swipingMsgId === msg.id ? "none" : "transform 0.22s cubic-bezier(0.2, 0, 0, 1)",
                      }}
                    >
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

                      <div
                        onDoubleClick={(e) => handleDoubleTap(msg.id, e)}
                        onTouchStart={(e) => handleTouchStart(msg, parsed, e)}
                        onTouchMove={(e) => handleTouchMove(msg, parsed, e)}
                        onTouchEnd={() => handleTouchEnd(msg, parsed)}
                        onContextMenu={(e) => handleContextMenu(msg, parsed, e)}
                        className={`relative group rounded-[20px] transition-all select-text cursor-pointer ${
                          selectedMessage?.msg?.id === msg.id ? "ring-2 ring-orange-500/50 scale-[1.01]" : ""
                        } ${
                        isEmojiOnly
                          ? "bg-transparent p-0.5 shadow-none"
                          : isMe
                          ? "bg-gradient-to-br from-orange-100 via-amber-50 to-orange-100 dark:from-orange-950/70 dark:to-amber-950/60 text-slate-800 dark:text-slate-100 border border-orange-200/90 dark:border-orange-800/60 shadow-xs rounded-br-[4px] px-3.5 pt-2 pb-1.5 min-w-[85px]"
                          : "bg-white dark:bg-[#16201b] text-slate-800 dark:text-slate-100 border border-slate-200/90 dark:border-emerald-950/80 shadow-xs rounded-bl-[4px] px-3.5 pt-2 pb-1.5 min-w-[75px]"
                      }`}
                    >
                      {/* Desktop Message Actions Button (Clickable alternative to right-click) */}
                      {!parsed.isDeleted && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMessage({ msg, parsed });
                          }}
                          className={`absolute -top-2.5 ${
                            isMe ? "-left-2.5" : "-right-2.5"
                          } w-5 h-5 rounded-full bg-white dark:bg-[#131c18] border border-slate-200 dark:border-emerald-950/80 shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-700 dark:hover:text-white z-20`}
                          title="Message actions (long-press on mobile, right-click on desktop)"
                        >
                          <MoreVertical className="w-3 h-3" />
                        </button>
                      )}
                      {/* Quoted Reply Block */}
                      {parsed.replyTo && (
                        <div
                          onClick={() => {
                            const target = document.getElementById(`msg-${parsed.replyTo?.id}`);
                            target?.scrollIntoView({ behavior: "smooth", block: "center" });
                          }}
                          className={`mb-1.5 p-2 rounded-xl text-xs cursor-pointer border-l-3 transition-colors ${
                            isMe
                              ? "bg-white/80 dark:bg-black/20 border-orange-400 text-slate-800 dark:text-slate-200 hover:bg-white"
                              : "bg-slate-100 dark:bg-[#1d2b24] border-emerald-500 text-slate-700 dark:text-slate-300 hover:bg-slate-200/70"
                          }`}
                        >
                          <strong className="block text-[11px] font-bold opacity-90">
                            {parsed.replyTo.senderName}
                          </strong>
                          <p className="line-clamp-1 text-[11px] opacity-75">
                            {parsed.replyTo.text}
                          </p>
                        </div>
                      )}

                      {/* Standalone Telegram Animated Moving Emoji or Text or Deleted Message */}
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
                      ) : (
                        <p className="whitespace-pre-wrap text-sm leading-relaxed font-normal">
                          {parsed.text}
                        </p>
                      )}

                      {/* Media Container: Photo */}
                      {!parsed.isDeleted && parsed.mediaType === "PHOTO" && parsed.mediaData?.url && (
                        <div className="mt-2 rounded-2xl overflow-hidden shadow-sm">
                          <img
                            src={parsed.mediaData.url}
                            alt="Shared photo"
                            className="w-full max-h-60 object-cover hover:scale-105 transition-transform duration-300"
                          />
                          {parsed.mediaData.caption && (
                            <p className="p-2 text-xs opacity-90">
                              {parsed.mediaData.caption}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Media Container: Location Pin Card */}
                      {!parsed.isDeleted && parsed.mediaType === "LOCATION" && parsed.mediaData && (
                        <div
                          className="mt-2 p-3 rounded-2xl border border-orange-200/90 dark:border-orange-800/60 bg-white/80 dark:bg-[#18241f] text-slate-800 dark:text-slate-200 shadow-xs flex items-start gap-3"
                        >
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-100 via-amber-50 to-orange-100 text-orange-700 border border-orange-300/80 flex items-center justify-center shrink-0 shadow-xs">
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
                              className="text-[10px] font-bold text-orange-600 dark:text-orange-400 hover:underline mt-1 inline-block"
                            >
                              Open in Maps →
                            </a>
                          </div>
                        </div>
                      )}

                      {/* Media Container: Trip Card Snippet */}
                      {!parsed.isDeleted && parsed.mediaType === "TRIP" && parsed.mediaData && (
                        <div
                          className="mt-2 p-3 rounded-2xl border border-orange-200/90 dark:border-orange-800/60 bg-white/80 dark:bg-[#18241f] text-slate-800 dark:text-slate-200 shadow-xs flex items-start gap-3"
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
                        </div>
                      )}

                      {/* ── IN-BUBBLE TIMESTAMP & STATUS INDICATOR (WHATSAPP PARITY) ── */}
                      {!isEmojiOnly && (
                        <div
                          className={`flex items-center justify-end gap-1.5 mt-1 select-none ${
                            isMe ? "text-orange-900/60 dark:text-orange-300/60" : "text-slate-400 dark:text-slate-500"
                          }`}
                        >
                          <span
                            className="text-[10px] font-medium tracking-tight"
                            title={formatTimeAgo(msg.createdAt)}
                          >
                            {formatMessageTime(msg.createdAt)}
                          </span>
                          {isMe && (
                            <MessageStatusBeacon
                              status={deliveryStatus}
                              size={16}
                              recipientName={otherParticipantName}
                              timestamp={formatMessageTime(msg.createdAt)}
                            />
                          )}
                        </div>
                      )}

                      {/* Dropdown Menu for non-me messages (Report message) */}
                      {!isMe && (
                        <div className="absolute top-1/2 -translate-y-1/2 -right-8 opacity-0 group-hover/msg:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => setMenuOpen(menuOpen === msg.id ? null : msg.id)}
                            className="w-7 h-7 rounded-full bg-white dark:bg-[#1a2620] shadow-md flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 border border-slate-200/60 dark:border-emerald-950/60"
                            title="Message options"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>

                          {menuOpen === msg.id && (
                            <div className="absolute right-0 mt-1 w-28 bg-white dark:bg-[#131c18] rounded-2xl shadow-xl border border-slate-200 dark:border-emerald-950/80 py-1.5 z-50 text-xs">
                              <button
                                onClick={() => {
                                  setMenuOpen(null);
                                  setReportTarget({ id: msg.senderId, name: senderName });
                                  setReportModalOpen(true);
                                }}
                                className="w-full px-3 py-1.5 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1b2721] flex items-center gap-1.5"
                              >
                                <Flag className="w-3 h-3 text-rose-500" />
                                <span>Report</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                    {/* ── REACTION CHIPS DOCKED AT BOTTOM OF BUBBLE ── */}
                    {!parsed.isDeleted && reactionKeys.length > 0 && (
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
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold shadow-sm transition-all transform hover:scale-110 active:scale-95 ${
                                hasReacted
                                  ? "bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-800"
                                  : "bg-white dark:bg-[#16201b] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-emerald-950/60 hover:bg-slate-50"
                              }`}
                            >
                              <RealisticEmoji emoji={emoji} size={16} animate={true} />
                              <span className="text-[11px] font-bold">{reactors.length}</span>
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

        {/* ── LIVE TYPING INDICATOR (TELEGRAM STYLE) ── */}
        {isTyping && (
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 pt-2 animate-fade-in">
            <div className="w-6 h-6 rounded-full bg-emerald-600/20 text-emerald-500 flex items-center justify-center text-[10px] font-bold">
              {typingUser?.[0] || "A"}
            </div>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {typingUser || "Ananya"} is typing
            </span>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-typing-dot-1" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-typing-dot-2" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-typing-dot-3" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} className="h-4" />
      </main>

      {/* ── FLOATING SCROLL TO BOTTOM BUTTON WITH UNREAD BADGE ── */}
      {showScrollBottom && (
        <button
          type="button"
          onClick={() => scrollToBottom(true)}
          className="absolute bottom-24 right-5 z-30 w-10 h-10 rounded-full bg-white dark:bg-[#16201b] border border-slate-200 dark:border-emerald-950/80 shadow-2xl text-slate-700 dark:text-slate-200 flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
          aria-label="Scroll to bottom"
        >
          <ChevronDown className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full bg-orange-500 text-white text-[10px] font-bold shadow-sm">
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* ── BOTTOM INPUT BAR & CONTROLS ── */}
      <footer className="relative z-20 px-3 sm:px-6 pb-3 pt-1 bg-transparent border-t-0 shadow-none">
        {/* Reply Quote Preview Banner */}
        {replyingTo && (
          <div className="max-w-4xl mx-auto mb-2 px-3.5 py-2 rounded-2xl bg-white dark:bg-[#18241f] border-l-4 border-orange-500 border border-slate-200/80 dark:border-emerald-950/70 shadow-md flex items-center justify-between text-xs animate-slide-up">
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-bold text-orange-600 dark:text-orange-400 block">
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
          {/* Emoji / Sticker Popover */}
          <EmojiPickerPopover
            isOpen={isEmojiPickerOpen}
            onClose={() => setIsEmojiPickerOpen(false)}
            onSelectEmoji={(emoji) => {
              setInputMessage((prev) => prev + emoji);
              setIsEmojiPickerOpen(false);
              textareaRef.current?.focus();
            }}
          />

          {/* Attachment Menu Popover */}
          <AttachmentPopover
            isOpen={isAttachmentOpen}
            onClose={() => setIsAttachmentOpen(false)}
            onSelectAttachment={handleSelectAttachment}
          />

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
                ? "bg-gradient-to-br from-orange-100 via-amber-50 to-orange-100 text-orange-700 dark:from-orange-950/80 dark:to-amber-900/60 dark:text-orange-300 border border-orange-300/80 dark:border-orange-700/60 shadow-xs"
                : "bg-white dark:bg-[#18241f] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#203029] border border-slate-200/90 dark:border-emerald-950/80 shadow-xs"
            }`}
            title="Attach photo, location, or voice"
          >
            <Plus className={`w-5 h-5 transition-transform ${isAttachmentOpen ? "rotate-45" : ""}`} />
          </button>

          {/* Auto-expanding Input Box */}
          <div className="flex-1 bg-white dark:bg-[#16201b] rounded-2xl border border-slate-200/90 dark:border-emerald-950/80 shadow-sm focus-within:ring-2 focus-within:ring-orange-500/30 focus-within:border-orange-500 transition-all flex items-end px-3 py-1.5 min-h-[46px]">
            <textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Tap to message"
              className="flex-1 max-h-32 bg-transparent text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none resize-none leading-relaxed py-1.5"
              rows={1}
            />

            {/* Emoji Toggle inside bar */}
            <button
              type="button"
              data-emoji-toggle="true"
              onClick={() => {
                setIsEmojiPickerOpen(!isEmojiPickerOpen);
                setIsAttachmentOpen(false);
              }}
              className="p-1.5 rounded-xl text-slate-400 hover:text-orange-500 transition-colors shrink-0"
              title="Emoji picker"
            >
              <Smile className="w-5 h-5" />
            </button>
          </div>

          {/* Dynamic Action Button: Send message when text exists, or Live Speech-to-Text Voice Transcription */}
          {inputMessage.trim() ? (
            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={sending}
              className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-100 via-amber-50 to-orange-100 hover:from-orange-200 hover:to-amber-100 text-orange-700 dark:from-orange-950/80 dark:to-amber-900/60 dark:text-orange-300 border border-orange-300/80 dark:border-orange-700/60 shadow-xs flex items-center justify-center shrink-0 transition-transform active:scale-95 disabled:opacity-50"
              title="Send message"
            >
              <Send className="w-5 h-5 ml-0.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={toggleVoiceTranscription}
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all active:scale-95 shadow-xs ${
                isTranscribing
                  ? "bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-700 ring-2 ring-rose-400/50 animate-pulse"
                  : "bg-gradient-to-br from-emerald-100 via-teal-50 to-emerald-100 hover:from-emerald-200 hover:to-teal-100 text-emerald-800 dark:from-emerald-950/80 dark:to-teal-900/60 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-700/60"
              }`}
              title={isTranscribing ? "Transcribing voice... tap to stop" : "Voice transcription (Speech-to-Text)"}
            >
              <Mic className={`w-5 h-5 ${isTranscribing ? "animate-bounce" : ""}`} />
            </button>
          )}
        </div>
      </footer>
      </div>

      {/* ── LONG-PRESS / RIGHT-CLICK MESSAGE ACTIONS MODAL ── */}
      {selectedMessage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setSelectedMessage(null)}
        >
          <div
            className="w-full max-w-[230px] rounded-2xl bg-white dark:bg-[#15201b] border border-slate-200 dark:border-emerald-950/80 shadow-2xl p-2.5 flex flex-col gap-2 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Quick Reactions Row */}
            <div className="flex items-center justify-between px-1.5 py-1 rounded-xl bg-slate-50 dark:bg-[#1a2822] border border-slate-100 dark:border-emerald-900/40">
              {QUICK_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    handleToggleReaction(selectedMessage.msg.id, emoji);
                    setSelectedMessage(null);
                  }}
                  className="w-7 h-7 rounded-full hover:scale-125 transition-transform flex items-center justify-center text-base active:scale-90"
                  title={`React ${emoji}`}
                >
                  <RealisticEmoji emoji={emoji} size={20} />
                </button>
              ))}
            </div>

            {/* Actions Menu */}
            <div className="flex flex-col gap-0.5">
              {/* Reply */}
              <button
                type="button"
                onClick={() => {
                  const isMe =
                    selectedMessage.msg.senderId === currentUser?.id ||
                    selectedMessage.msg.sender?.id === currentUser?.id ||
                    selectedMessage.msg.sender?.email === currentUser?.email;
                  const senderName = isMe
                    ? "You"
                    : selectedMessage.msg.sender?.displayName ||
                      selectedMessage.msg.sender?.name ||
                      selectedMessage.msg.sender?.email?.split("@")[0] ||
                      "Traveler";
                  setReplyingTo({
                    id: selectedMessage.msg.id,
                    senderName,
                    text: selectedMessage.parsed.text || selectedMessage.parsed.mediaType || "Message",
                  });
                  setSelectedMessage(null);
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1f2e27] text-slate-700 dark:text-slate-200 font-medium text-xs transition text-left"
              >
                <CornerDownRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Reply</span>
              </button>

              {/* Copy */}
              {selectedMessage.parsed.text && (
                <button
                  type="button"
                  onClick={() => handleCopyText(selectedMessage.parsed.text, selectedMessage.msg.id)}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1f2e27] text-slate-700 dark:text-slate-200 font-medium text-xs transition text-left"
                >
                  <Copy className="w-3.5 h-3.5 text-blue-500" />
                  <span>{copiedMsgId === selectedMessage.msg.id ? "Copied!" : "Copy"}</span>
                </button>
              )}

              {/* Share */}
              {selectedMessage.parsed.text && (
                <button
                  type="button"
                  onClick={() => {
                    if (typeof navigator !== "undefined" && navigator.share) {
                      navigator
                        .share({
                          title: "Message from Travally",
                          text: selectedMessage.parsed.text,
                        })
                        .catch(() => {});
                    } else {
                      handleCopyText(selectedMessage.parsed.text, selectedMessage.msg.id);
                    }
                    setSelectedMessage(null);
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1f2e27] text-slate-700 dark:text-slate-200 font-medium text-xs transition text-left"
                >
                  <Share2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Share</span>
                </button>
              )}

              {/* Delete Options */}
              {(() => {
                const isMe =
                  selectedMessage.msg.senderId === currentUser?.id ||
                  selectedMessage.msg.sender?.id === currentUser?.id ||
                  selectedMessage.msg.sender?.email === currentUser?.email;

                const msgCreatedAt = selectedMessage.msg.createdAt
                  ? new Date(selectedMessage.msg.createdAt).getTime()
                  : Date.now();
                const ageMinutes = (Date.now() - msgCreatedAt) / (1000 * 60);
                const canDeleteForEveryone = isMe && ageMinutes <= 15;
                const remainingMinutes = Math.max(1, Math.round(15 - ageMinutes));

                return (
                  <>
                    {/* Delete for Everyone */}
                    {isMe && (
                      <button
                        type="button"
                        disabled={!canDeleteForEveryone || isDeletingMsg}
                        onClick={() => handleDeleteMessage(selectedMessage.msg.id, "everyone")}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg font-medium text-xs transition text-left ${
                          canDeleteForEveryone
                            ? "hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400"
                            : "opacity-40 cursor-not-allowed text-slate-400 dark:text-slate-600"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete for everyone</span>
                        </div>
                        {canDeleteForEveryone ? (
                          <span className="text-[10px] font-normal text-rose-500/80">
                            {remainingMinutes}m
                          </span>
                        ) : (
                          <span className="text-[10px] font-normal text-slate-400">
                            &gt;15m
                          </span>
                        )}
                      </button>
                    )}

                    {/* Delete for Me */}
                    <button
                      type="button"
                      disabled={isDeletingMsg}
                      onClick={() => handleDeleteMessage(selectedMessage.msg.id, "me")}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-medium text-xs transition text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete for me</span>
                      </div>
                    </button>
                  </>
                );
              })()}
            </div>

            {/* Cancel Button */}
            <button
              type="button"
              onClick={() => setSelectedMessage(null)}
              className="mt-0.5 w-full py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#1a2822] dark:hover:bg-[#22352d] text-slate-600 dark:text-slate-300 font-medium text-[11px] transition text-center"
            >
              Cancel
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
        onOpenReport={(target) => {
          setReportTarget(target);
          setReportModalOpen(true);
        }}
        onBlockUser={(targetUserId, targetName) => {
          handleBlockUser(targetUserId, targetName);
        }}
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
    </div>
  );
}
