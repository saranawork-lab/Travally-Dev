"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Flame,
  Heart,
  X,
  MessageCircle,
  MapPin,
  Clock,
  SlidersHorizontal,
  Bell,
  Check,
  Plus,
  Trash2,
  ExternalLink,
  Info,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { useAuth } from "@/context/AuthContext";

export interface FindMeCard {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar?: string | null;
  creatorAge?: number | null;
  creatorProfession?: string | null;
  creatorCity?: string | null;
  creatorNative?: string | null;
  relationshipStatus?: string;
  story: string;
  clueText: string;
  hintArea: string;
  vibeTag: string;
  durationHours?: number;
  expiresAt: string;
  createdAt: string;
  guessesCount?: number;
  savedCount?: number;
  isSaved?: boolean;
  isOwner?: boolean;
}

interface FindMeStoryDeckProps {
  onOpenCreate?: () => void;
  requireAuth: (callback: () => void) => void;
}

// Helper: Calculate remaining time formatted as "14h 32m 10s"
function formatCountdown(expiresAt: string): { text: string; isExpired: boolean; totalSeconds: number } {
  if (!expiresAt) return { text: "No timer", isExpired: false, totalSeconds: 99999 };
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return { text: "Expired", isExpired: true, totalSeconds: 0 };

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  if (hours > 0) {
    return { text: `${hours}h ${minutes}m ${seconds}s left`, isExpired: false, totalSeconds: Math.floor(diff / 1000) };
  }
  return { text: `${minutes}m ${seconds}s left`, isExpired: false, totalSeconds: Math.floor(diff / 1000) };
}

// ─── SINGLE STORY CARD (SWIPEABLE) ───
const StoryCardItem: React.FC<{
  card: FindMeCard;
  isTop: boolean;
  onSwipe: (action: "accept" | "reject") => void;
  onOpenReply: () => void;
}> = ({ card, isTop, onSwipe, onOpenReply }) => {
  const [expandedStory, setExpandedStory] = useState(false);
  const [countdown, setCountdown] = useState(() => formatCountdown(card.expiresAt));

  useEffect(() => {
    const timer = setInterval(() => {
      const res = formatCountdown(card.expiresAt);
      setCountdown(res);
      if (res.isExpired) {
        onSwipe("reject"); // Card automatically expires from deck
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [card.expiresAt, onSwipe]);

  // Framer Motion Drag values
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-18, 18]);
  const acceptOpacity = useTransform(x, [40, 140], [0, 1]);
  const rejectOpacity = useTransform(x, [-40, -140], [0, 1]);

  const handleDragEnd = (_: any, info: any) => {
    if (info.offset.x > 100) {
      onSwipe("accept");
    } else if (info.offset.x < -100) {
      onSwipe("reject");
    }
  };

  const displayName = card.creatorName || "Explorer";
  const initial = displayName.charAt(0).toUpperCase();
  const ageDisplay = card.creatorAge ? card.creatorAge : null;

  return (
    <motion.div
      style={{ x: isTop ? x : 0, rotate: isTop ? rotate : 0 }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.8}
      onDragEnd={handleDragEnd}
      initial={{ scale: isTop ? 1 : 0.94, y: isTop ? 0 : 16, opacity: isTop ? 1 : 0.6 }}
      animate={{ scale: isTop ? 1 : 0.94, y: isTop ? 0 : 16, opacity: isTop ? 1 : 0.6 }}
      exit={{
        x: x.get() > 0 ? 400 : -400,
        opacity: 0,
        rotate: x.get() > 0 ? 25 : -25,
        transition: { duration: 0.25 },
      }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      className={`absolute inset-0 w-full rounded-[32px] bg-[#faf8f5] dark:bg-[#121915] border-2 border-emerald-900/10 dark:border-emerald-800/40 p-5 sm:p-6 shadow-[0_16px_40px_rgba(0,0,0,0.09)] dark:shadow-[0_20px_45px_rgba(0,0,0,0.5)] flex flex-col justify-between select-none overflow-hidden touch-none ${
        isTop ? "cursor-grab active:cursor-grabbing z-20" : "pointer-events-none z-10"
      }`}
    >
      {/* ── SWIPE OVERLAY STAMPS ── */}
      {isTop && (
        <>
          <motion.div
            style={{ opacity: acceptOpacity }}
            className="absolute top-8 right-7 z-30 px-4 py-1.5 rounded-2xl border-2 border-emerald-600 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-black text-sm tracking-widest uppercase rotate-12 shadow-sm pointer-events-none"
          >
            CONNECT 💚
          </motion.div>
          <motion.div
            style={{ opacity: rejectOpacity }}
            className="absolute top-8 left-7 z-30 px-4 py-1.5 rounded-2xl border-2 border-rose-600 bg-rose-500/15 text-rose-700 dark:text-rose-400 font-black text-sm tracking-widest uppercase -rotate-12 shadow-sm pointer-events-none"
          >
            PASS ✕
          </motion.div>
        </>
      )}

      {/* ── CARD TOP BAR ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-serif italic text-emerald-800 dark:text-emerald-300 text-lg sm:text-xl font-semibold">
            say hello to
          </span>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200/90 dark:border-amber-800/60 text-[10px] font-bold text-amber-800 dark:text-amber-300">
              <Clock className="w-3 h-3 text-amber-600 animate-pulse" />
              <span>{countdown.text}</span>
            </span>
          </div>
        </div>

        {/* ── PROFILE ROW ── */}
        <div className="flex items-center gap-3.5">
          <div className="relative">
            {card.creatorAvatar ? (
              <img
                src={card.creatorAvatar}
                alt={displayName}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover ring-2 ring-emerald-500/50 shadow-sm"
              />
            ) : (
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white font-bold text-xl flex items-center justify-center ring-2 ring-emerald-500/40 shadow-sm">
                {initial}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white dark:bg-[#121915] border border-emerald-400 flex items-center justify-center shadow-2xs">
              <Flame className="w-3 h-3 text-rose-500" />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-1.5">
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white truncate tracking-tight">
                {displayName}
              </h3>
              {ageDisplay && (
                <span className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {ageDisplay}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 truncate">
              {card.creatorProfession || "Explorer & Storyteller"}
            </p>
          </div>
        </div>

        {/* ── BADGES & TAGS CHIPS ── */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {card.creatorCity && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white dark:bg-[#1a241e] border border-slate-200/80 dark:border-emerald-950/70 text-[11px] font-semibold text-slate-700 dark:text-slate-200 shadow-2xs">
              <span>🏠 in {card.creatorCity}</span>
            </span>
          )}
          {card.creatorNative && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white dark:bg-[#1a241e] border border-slate-200/80 dark:border-emerald-950/70 text-[11px] font-semibold text-slate-700 dark:text-slate-200 shadow-2xs">
              <span>🏡 Native {card.creatorNative}</span>
            </span>
          )}
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800/60 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 shadow-2xs">
            <span>💚 {card.relationshipStatus || "Single"}</span>
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200/80 dark:border-rose-800/60 text-[11px] font-bold text-rose-800 dark:text-rose-300 shadow-2xs">
            <span>{card.vibeTag}</span>
          </span>
        </div>

        {/* ── STORY / ABOUT ME ── */}
        <div className="pt-2 border-t border-slate-200/70 dark:border-emerald-950/60 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
              About Me
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenReply();
              }}
              className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 flex items-center gap-1 transition"
            >
              <span>↩ reply</span>
            </button>
          </div>

          <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-normal leading-relaxed">
            <p className={expandedStory ? "" : "line-clamp-4"}>
              {card.story || card.clueText}
            </p>
            {card.story && card.story.length > 140 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedStory(!expandedStory);
                }}
                className="mt-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline block"
              >
                {expandedStory ? "show less" : "read more →"}
              </button>
            )}
          </div>
        </div>

        {/* ── MYSTERY CLUE / HINT BOX ── */}
        <div className="p-3 rounded-2xl bg-white dark:bg-[#17221b] border border-emerald-900/10 dark:border-emerald-900/40 space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-rose-700 dark:text-rose-400">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span>Near {card.hintArea}</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 italic">
            &ldquo;{card.clueText}&rdquo;
          </p>
        </div>
      </div>

      {/* ── CARD BOTTOM CONTROLS HINT ── */}
      <div className="pt-3 border-t border-slate-200/70 dark:border-emerald-950/60 flex items-center justify-between text-[11px] text-slate-400">
        <span>👈 Swipe left to pass</span>
        <span>Swipe right to save 👉</span>
      </div>
    </motion.div>
  );
};

// ─── MAIN FIND ME STORY DECK COMPONENT ───
export const FindMeStoryDeck: React.FC<FindMeStoryDeckProps> = ({
  onOpenCreate,
  requireAuth,
}) => {
  const { currentUser } = useAuth();
  const [tab, setTab] = useState<"deck" | "saved" | "mine">("deck");
  const [deckClues, setDeckClues] = useState<FindMeCard[]>([]);
  const [savedClues, setSavedClues] = useState<FindMeCard[]>([]);
  const [myClues, setMyClues] = useState<FindMeCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingCard, setReplyingCard] = useState<FindMeCard | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showStoryPopup, setShowStoryPopup] = useState(false);

  // Check if popup should be shown (first time in a day, max 3 days ever for this user after logging in)
  useEffect(() => {
    if (!currentUser?.id) return;
    try {
      const storageKey = `find_me_story_popup_days_${currentUser.id}`;
      const raw = localStorage.getItem(storageKey);
      const days: string[] = raw ? JSON.parse(raw) : [];
      const today = new Date().toISOString().slice(0, 10);
      if (days.length < 3 && !days.includes(today)) {
        setShowStoryPopup(true);
        const updatedDays = [...days, today];
        localStorage.setItem(storageKey, JSON.stringify(updatedDays));
      }
    } catch (e) {
      console.error("Popup check error:", e);
    }
  }, [currentUser?.id]);

  // Trigger quick toast notification
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch Deck
  const loadDeck = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/home/find-me");
      const data = await res.json();
      if (data.clues) {
        setDeckClues(data.clues);
      }
    } catch (err) {
      console.error("Failed to fetch deck:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch Saved Matches
  const loadSaved = useCallback(async () => {
    if (!currentUser) {
      setSavedClues([]);
      return;
    }
    try {
      const res = await fetch("/api/home/find-me?view=saved");
      const data = await res.json();
      if (data.clues) {
        setSavedClues(data.clues);
      }
    } catch (err) {
      console.error("Failed to fetch saved matches:", err);
    }
  }, [currentUser]);

  // Fetch My Beacons
  const loadMine = useCallback(async () => {
    if (!currentUser) {
      setMyClues([]);
      return;
    }
    try {
      const res = await fetch("/api/home/find-me?view=mine");
      const data = await res.json();
      if (data.clues) {
        setMyClues(data.clues);
      }
    } catch (err) {
      console.error("Failed to fetch my beacons:", err);
    }
  }, [currentUser]);

  useEffect(() => {
    loadDeck();
    loadSaved();
    loadMine();
  }, [loadDeck, loadSaved, loadMine]);

  // Periodic interval to clean up expired cards in UI
  useEffect(() => {
    const interval = setInterval(() => {
      const nowMs = Date.now();
      // Remove any card from saved whose expiresAt has passed
      setSavedClues((prev) =>
        prev.filter((c) => new Date(c.expiresAt).getTime() > nowMs)
      );
      setDeckClues((prev) =>
        prev.filter((c) => new Date(c.expiresAt).getTime() > nowMs)
      );
      setMyClues((prev) =>
        prev.filter((c) => new Date(c.expiresAt).getTime() > nowMs)
      );
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Handle Swipe Action
  const handleSwipe = async (card: FindMeCard, action: "accept" | "reject", guess?: string) => {
    if (!currentUser) {
      requireAuth(() => handleSwipe(card, action, guess));
      return;
    }

    // Optimistically remove card from deck
    setDeckClues((prev) => prev.filter((c) => c.id !== card.id));

    if (action === "accept") {
      // Optimistically add to saved
      setSavedClues((prev) => [{ ...card, isSaved: true }, ...prev]);
      showToast(`💚 Connected with ${card.creatorName}! Saved until beacon expires.`);
    }

    try {
      const res = await fetch("/api/home/find-me/swipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clueId: card.id,
          action,
          guess: guess || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        console.warn("Swipe failed:", data.error);
      }
    } catch (err) {
      console.error("Error submitting swipe:", err);
    }
  };

  // Submit Reply / Guess from Modal
  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyingCard || !replyText.trim()) return;
    setSubmittingReply(true);
    await handleSwipe(replyingCard, "accept", replyText.trim());
    setSubmittingReply(false);
    setReplyingCard(null);
    setReplyText("");
  };

  // Delete own beacon
  const handleDeleteMyBeacon = async (clueId: string) => {
    if (!confirm("Are you sure you want to delete your Find Me beacon? It will be removed from all profiles.")) return;
    try {
      const res = await fetch(`/api/home/find-me?clueId=${clueId}&action=delete`, { method: "DELETE" });
      if (res.ok) {
        setMyClues((prev) => prev.filter((c) => c.id !== clueId));
        showToast("Beacon deleted completely.");
      }
    } catch (err) {
      console.error("Failed to delete beacon:", err);
    }
  };

  // Unsave a card early
  const handleUnsave = async (clueId: string) => {
    try {
      const res = await fetch(`/api/home/find-me?clueId=${clueId}&action=unsave`, { method: "DELETE" });
      if (res.ok) {
        setSavedClues((prev) => prev.filter((c) => c.id !== clueId));
        showToast("Removed from saved matches.");
      }
    } catch (err) {
      console.error("Failed to unsave:", err);
    }
  };

  const topCard = deckClues[0];
  const nextCard = deckClues[1];

  return (
    <div className="space-y-6">
      {/* ── ONCE-A-DAY POPUP (MAX 3 DAYS TOTAL FOR USER) ── */}
      {showStoryPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in select-none">
          <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-[#0e1713] border border-emerald-200/80 dark:border-emerald-900/60 shadow-2xl p-6 space-y-4 animate-scale-up">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowStoryPopup(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1a2620] transition cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Content matching user's image */}
            <div className="space-y-2 pt-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                Story-First Dating & Hangout Beacons
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
                Match based on story, not selfies to swipe.
              </h2>
              <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
                Read authentic stories and hangout clues. Swipe right to accept & save. When a beacon&apos;s timer expires, it is automatically and completely deleted from all profiles!
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowStoryPopup(false);
                  requireAuth(() => onOpenCreate && onOpenCreate());
                }}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md transition active:scale-95 cursor-pointer"
              >
                <Flame className="w-4 h-4" />
                <span>Drop a Find Me Clue</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SUB-TABS (Deck, Saved Matches, My Beacons) ── */}
      <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-emerald-950/60 pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTab("deck")}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              tab === "deck"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#16221c]"
            }`}
          >
            <span>🎴 Discover & Swipe</span>
            {deckClues.length > 0 && (
              <span className="min-w-[18px] h-4 px-1 rounded-full text-[9px] font-black inline-flex items-center justify-center bg-white/20 text-white">
                {deckClues.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setTab("saved")}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              tab === "saved"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#16221c]"
            }`}
          >
            <span>💚 Saved Matches</span>
            {savedClues.length > 0 && (
              <span className="min-w-[18px] h-4 px-1 rounded-full text-[9px] font-black inline-flex items-center justify-center bg-emerald-500 text-white">
                {savedClues.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setTab("mine")}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              tab === "mine"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#16221c]"
            }`}
          >
            <span>📝 My Beacons</span>
            {myClues.length > 0 && (
              <span className="min-w-[18px] h-4 px-1 rounded-full text-[9px] font-black inline-flex items-center justify-center bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                {myClues.length}
              </span>
            )}
          </button>
        </div>

        {tab === "deck" && deckClues.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadDeck}
              className="text-xs text-slate-500 hover:text-emerald-600 font-medium hidden sm:inline-block cursor-pointer"
            >
              Refresh Deck
            </button>
          </div>
        )}
      </div>

      {/* ── TOAST NOTIFICATION ── */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-emerald-900 text-white text-xs font-bold shadow-xl flex items-center gap-2 animate-fade-in">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── 1. SWIPE DECK VIEW ── */}
      {tab === "deck" && (
        <div className="max-w-md mx-auto pt-2 pb-6 space-y-6">
          {loading ? (
            <div className="h-[480px] rounded-[32px] bg-slate-100 dark:bg-[#121915] border border-slate-200 dark:border-emerald-950 flex flex-col items-center justify-center text-xs text-slate-400 animate-pulse">
              <Flame className="w-8 h-8 text-emerald-500 mb-2 animate-bounce" />
              <span>Shuffling story cards...</span>
            </div>
          ) : deckClues.length === 0 ? (
            <div className="h-[460px] rounded-[32px] bg-white dark:bg-[#111815] border border-slate-200 dark:border-emerald-950/70 p-6 flex flex-col items-center justify-center text-center space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
                <Check className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  You&apos;re All Caught Up!
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
                  You&apos;ve viewed all active story cards in your area. Post your own clue or check your saved connections!
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => requireAuth(() => onOpenCreate && onOpenCreate())}
                  className="px-5 py-2.5 rounded-full text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md transition active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Drop Your Clue</span>
                </button>
                {savedClues.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setTab("saved")}
                    className="px-5 py-2.5 rounded-full text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 transition active:scale-95"
                  >
                    View Saved ({savedClues.length})
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Card Container with Stack effect */}
              <div className="relative w-full h-[520px]">
                <AnimatePresence>
                  {nextCard && (
                    <StoryCardItem
                      key={nextCard.id}
                      card={nextCard}
                      isTop={false}
                      onSwipe={() => {}}
                      onOpenReply={() => {}}
                    />
                  )}
                  {topCard && (
                    <StoryCardItem
                      key={topCard.id}
                      card={topCard}
                      isTop={true}
                      onSwipe={(act) => handleSwipe(topCard, act)}
                      onOpenReply={() => setReplyingCard(topCard)}
                    />
                  )}
                </AnimatePresence>
              </div>

              {/* TACTILE ACTION BUTTONS DOCKED UNDER CARD */}
              {topCard && (
                <div className="flex items-center justify-center gap-6 pt-2 select-none">
                  {/* Reject / Pass button */}
                  <button
                    type="button"
                    onClick={() => handleSwipe(topCard, "reject")}
                    className="w-14 h-14 rounded-full bg-white dark:bg-[#16201b] border-2 border-rose-300 dark:border-rose-900/60 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 shadow-md hover:shadow-lg transition-all active:scale-90 flex items-center justify-center group"
                    title="Pass (Swipe Left)"
                  >
                    <X className="w-6 h-6 stroke-[2.5] group-hover:scale-110 transition-transform" />
                  </button>

                  {/* Reply / Guess Message Button */}
                  <button
                    type="button"
                    onClick={() => setReplyingCard(topCard)}
                    className="w-11 h-11 rounded-full bg-white dark:bg-[#16201b] border border-slate-300 dark:border-emerald-950/80 text-slate-600 dark:text-slate-300 hover:text-emerald-600 hover:border-emerald-400 shadow-sm transition-all active:scale-90 flex items-center justify-center"
                    title="Send a message with your connection"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </button>

                  {/* Accept / Connect Button */}
                  <button
                    type="button"
                    onClick={() => handleSwipe(topCard, "accept")}
                    className="w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 hover:from-emerald-600 hover:to-teal-600 hover:shadow-xl transition-all active:scale-90 flex items-center justify-center group"
                    title="Connect & Save (Swipe Right)"
                  >
                    <Heart className="w-6 h-6 fill-white stroke-none group-hover:scale-110 transition-transform" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── 2. SAVED MATCHES VIEW ── */}
      {tab === "saved" && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Ephemeral Notice:</strong> Saved matches automatically delete permanently once the creator&apos;s beacon timer expires.
              </span>
            </div>
          </div>

          {savedClues.length === 0 ? (
            <div className="py-16 text-center bg-white dark:bg-[#111815] rounded-3xl border border-slate-200 dark:border-emerald-950/70 p-6 space-y-3">
              <Heart className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                No active saved matches yet
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Swipe right on story cards in the Discover tab to connect and save them here before they expire!
              </p>
              <button
                type="button"
                onClick={() => setTab("deck")}
                className="px-4 py-2 rounded-full text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition"
              >
                Go to Swipe Deck
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedClues.map((card) => {
                const countdown = formatCountdown(card.expiresAt);
                return (
                  <div
                    key={card.id}
                    className="rounded-3xl bg-[#faf8f5] dark:bg-[#121915] border border-emerald-900/10 dark:border-emerald-800/40 p-5 shadow-sm space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-serif italic text-emerald-800 dark:text-emerald-300 text-base font-semibold">
                          say hello to
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-[10px] font-bold text-amber-800 dark:text-amber-300">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>{countdown.text}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <img
                          src={card.creatorAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120"}
                          alt={card.creatorName}
                          className="w-12 h-12 rounded-full object-cover ring-2 ring-emerald-500/40"
                        />
                        <div>
                          <h4 className="font-black text-slate-900 dark:text-white text-base">
                            {card.creatorName} {card.creatorAge ? <span className="text-emerald-600 font-bold">{card.creatorAge}</span> : ""}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {card.creatorProfession || "Explorer"}
                          </p>
                        </div>
                      </div>

                      {/* Story snippet */}
                      <div className="p-3 rounded-2xl bg-white dark:bg-[#17221b] border border-slate-200/80 dark:border-emerald-950/60 text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic">
                        &ldquo;{card.story || card.clueText}&rdquo;
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" />
                        <span>Near {card.hintArea}</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200/70 dark:border-emerald-950/60 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleUnsave(card.id)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition text-xs flex items-center gap-1"
                        title="Remove from saved"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Unsave</span>
                      </button>

                      <Link
                        href={`/chats`}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-xs flex items-center gap-1.5 transition active:scale-95"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Open Chat</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── 3. MY BEACONS VIEW ── */}
      {tab === "mine" && (
        <div className="space-y-4">
          {myClues.length === 0 ? (
            <div className="py-16 text-center bg-white dark:bg-[#111815] rounded-3xl border border-slate-200 dark:border-emerald-950/70 p-6 space-y-3">
              <Flame className="w-10 h-10 text-rose-500 mx-auto opacity-70" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                You haven&apos;t posted any active beacons
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Share your story and hangout clue to let people in your city discover you!
              </p>
              <button
                type="button"
                onClick={() => requireAuth(() => onOpenCreate && onOpenCreate())}
                className="px-5 py-2.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 transition shadow-md"
              >
                Drop First Clue
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myClues.map((clue) => {
                const countdown = formatCountdown(clue.expiresAt);
                return (
                  <div
                    key={clue.id}
                    className="rounded-3xl bg-white dark:bg-[#111815] border border-slate-200/90 dark:border-emerald-950/70 p-5 shadow-sm space-y-3"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] border border-emerald-200 dark:border-emerald-800">
                        {clue.vibeTag}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-400">
                        <Clock className="w-3 h-3 text-amber-500" />
                        <span>{countdown.text}</span>
                      </span>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-medium italic">
                        &ldquo;{clue.story || clue.clueText}&rdquo;
                      </p>
                      <p className="text-xs text-slate-500">
                        📍 Area: <strong className="text-slate-700 dark:text-slate-300">{clue.hintArea}</strong>
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-emerald-950/60 flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-600">
                        {clue.savedCount || 0} explorers saved your card
                      </span>

                      <button
                        type="button"
                        onClick={() => handleDeleteMyBeacon(clue.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition text-xs flex items-center gap-1"
                        title="Delete beacon completely"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── MODAL: REPLY / GUESS TO CLUE ── */}
      {replyingCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#121915] rounded-3xl border border-slate-200 dark:border-emerald-950 p-6 space-y-4 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setReplyingCard(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <img
                src={replyingCard.creatorAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120"}
                alt={replyingCard.creatorName}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-emerald-500/40"
              />
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Connect & Reply
                </span>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Say hello to {replyingCard.creatorName}
                </h3>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#16201b] border border-slate-200/80 dark:border-emerald-950/60 text-xs text-slate-700 dark:text-slate-300 italic">
              &ldquo;{replyingCard.clueText}&rdquo;
            </div>

            <form onSubmit={handleSubmitReply} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Your Guess or Note *
                </label>
                <textarea
                  required
                  rows={3}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="e.g. Are you sitting near the old bookstore? Would love to connect and grab coffee!"
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-[#16201b] border border-slate-200 dark:border-emerald-950 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-emerald-950/60">
                <button
                  type="button"
                  onClick={() => setReplyingCard(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-[#18241f]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReply || !replyText.trim()}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md transition disabled:opacity-50"
                >
                  {submittingReply ? "Saving..." : "Accept & Send"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
