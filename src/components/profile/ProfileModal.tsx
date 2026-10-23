"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  MapPin,
  MessageSquare,
  Award,
  Loader2,
  Sparkles,
  Heart,
  Plane,
  Hash,
  Calendar,
} from "lucide-react";
import { VerificationBadge } from "@/components/common/VerificationBadge";
import { AvatarBadge } from "@/components/common/AvatarBadge";
import { useAuth } from "@/context/AuthContext";
import { safeJsonParse } from "@/lib/utils";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    email: string;
    profile?: any;
    joinRank?: number;
    createdAt?: string;
  } | null;
  showChatOption?: boolean;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  showChatOption = true,
}) => {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [detailedUser, setDetailedUser] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [startingChat, setStartingChat] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch richer user profile details when modal opens
  useEffect(() => {
    if (!isOpen || !user?.id) return;

    let isMounted = true;
    setLoadingDetails(true);

    fetch(`/api/profile?userId=${user.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data?.user) {
          setDetailedUser(data.user);
        }
      })
      .catch((err) => console.error("Failed to load user details:", err))
      .finally(() => {
        if (isMounted) setLoadingDetails(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, user?.id]);

  // Entrance animation trigger
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimateIn(true));
      });
    } else {
      setAnimateIn(false);
    }
  }, [isOpen]);

  if (!mounted || !isOpen || !user) return null;

  const profile = detailedUser?.profile || user.profile || {};
  const displayName = profile.displayName || user.email?.split("@")[0] || "Explorer";
  const avatarUrl = profile.avatarUrl;
  const city = profile.city || user.profile?.city;
  const bio = profile.bio || user.profile?.bio;
  const membershipNumber = profile.membershipNumber;
  const joinRank = detailedUser?.joinRank || user.joinRank;
  const memberSince = detailedUser?.createdAt || profile.memberSince;

  const interests = profile.interests
    ? typeof profile.interests === "string"
      ? profile.interests.startsWith("[")
        ? safeJsonParse<string[]>(profile.interests, [])
        : profile.interests.split(",").map((i: string) => i.trim()).filter(Boolean)
      : Array.isArray(profile.interests)
      ? profile.interests
      : []
    : [];

  const connPrefs: any = safeJsonParse(profile.connectionPreferences, {});
  const lifestyleTags: string[] = Array.isArray(connPrefs.lifestyleTags)
    ? connPrefs.lifestyleTags
    : [];

  const hasPreferences =
    connPrefs.friendship || connPrefs.travel || connPrefs.dating || lifestyleTags.length > 0;

  const hasVibes = interests.length > 0 || hasPreferences;

  const isSelf = currentUser?.id === user.id;

  const handleStartMessage = async () => {
    if (!currentUser) {
      router.push("/login");
      return;
    }

    setStartingChat(true);
    try {
      const res = await fetch("/api/chats/direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: user.id }),
      });

      if (res.ok) {
        const data = await res.json();
        onClose();
        if (data.conversationId) {
          router.push(`/chats/${data.conversationId}`);
        } else {
          router.push("/chats");
        }
      } else {
        const err = await res.json();
        alert(err.error || "Unable to start chat");
      }
    } catch (e) {
      console.error("Direct chat error:", e);
      alert("Failed to connect to chat. Please try again.");
    } finally {
      setStartingChat(false);
    }
  };

  const firstName = displayName.split(" ")[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          animateIn ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Popup Card */}
      <div
        className={`relative w-full max-w-[340px] transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          animateIn
            ? "scale-100 opacity-100"
            : "scale-90 opacity-0"
        }`}
      >
        <div className="rounded-3xl overflow-hidden bg-white dark:bg-[#111816] shadow-[0_20px_60px_-12px_rgba(0,0,0,0.4)] border border-black/[0.05] dark:border-white/[0.06]">

          {/* ═══ GRADIENT HERO ═══ */}
          <div className="relative h-[140px] overflow-hidden">
            {/* Gradient mesh */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500" />
            <div className="absolute inset-0 bg-gradient-to-tl from-emerald-700/60 via-transparent to-teal-300/30" />
            {/* Soft orbs */}
            <div className="absolute top-[-30%] left-[-15%] w-[55%] h-[70%] rounded-full bg-emerald-300/25 blur-3xl animate-[floatSoft_6s_ease-in-out_infinite]" />
            <div className="absolute bottom-[-25%] right-[-10%] w-[50%] h-[60%] rounded-full bg-cyan-300/20 blur-3xl animate-[floatSoft_8s_ease-in-out_infinite_reverse]" />

            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 z-30 w-7 h-7 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white/80 hover:bg-black/30 hover:text-white transition-all active:scale-90 cursor-pointer"
              title="Close"
            >
              <X className="w-3.5 h-3.5" strokeWidth={2.5} />
            </button>

            {/* Bottom fade */}
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white dark:from-[#111816] to-transparent pointer-events-none" />
          </div>

          {/* ═══ AVATAR (overlapping hero) ═══ */}
          <div className="relative flex justify-center -mt-[52px] z-10">
            <div className="relative">
              <div className="absolute -inset-3 rounded-full bg-white/25 blur-xl animate-pulse pointer-events-none" />
              <div className="p-[3px] rounded-full bg-gradient-to-br from-white/90 via-white/50 to-white/90 shadow-lg">
                <div className="bg-white dark:bg-[#111816] p-[2px] rounded-full">
                  <AvatarBadge
                    src={avatarUrl}
                    name={displayName}
                    size="lg"
                    showCrown={false}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ═══ INFO ═══ */}
          <div className="px-5 pt-2.5 pb-5 text-center">
            {/* Name */}
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center justify-center gap-1.5 leading-tight">
              <span className="truncate max-w-[200px]">{displayName}</span>
              <VerificationBadge
                status={profile.verificationStatus || "UNVERIFIED"}
                isVerified={profile.isVerified}
                hasLinkedin={!!profile.linkedinUrl}
              />
            </h2>

            {/* Meta row */}
            <div className="flex items-center justify-center gap-1.5 mt-1 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
              {city && (
                <span className="flex items-center gap-0.5">
                  <MapPin className="w-3 h-3 text-emerald-500" />
                  {city}
                </span>
              )}
              {membershipNumber && (
                <>
                  {city && <span className="text-slate-300 dark:text-slate-600">·</span>}
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {membershipNumber}
                  </span>
                </>
              )}
              {joinRank && (
                <>
                  <span className="text-slate-300 dark:text-slate-600">·</span>
                  <span className="flex items-center gap-0.5 font-bold text-amber-600 dark:text-amber-400">
                    <Award className="w-3 h-3" />#{joinRank}
                  </span>
                </>
              )}
              {memberSince && (
                <>
                  <span className="text-slate-300 dark:text-slate-600">·</span>
                  <span className="flex items-center gap-0.5">
                    <Calendar className="w-3 h-3" />
                    {new Date(memberSince).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  </span>
                </>
              )}
            </div>

            {/* ── Bio ── */}
            {bio && (
              <p className="mt-3 text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed text-left line-clamp-3">
                {bio}
              </p>
            )}

            {/* ── Interests & Vibes (all tags inline) ── */}
            {hasVibes && (
              <div className={`flex flex-wrap gap-1.5 justify-center ${bio ? "mt-3" : "mt-4"}`}>
                {interests.map((interest: string, i: number) => (
                  <span
                    key={`i-${i}`}
                    className="px-2 py-[3px] rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/40"
                  >
                    {interest}
                  </span>
                ))}
                {connPrefs.friendship && (
                  <span className="px-2 py-[3px] rounded-full text-[11px] font-semibold bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-300 border border-violet-200/50 dark:border-violet-800/40 flex items-center gap-0.5">
                    <Heart className="w-2.5 h-2.5" />
                    Friendship
                  </span>
                )}
                {connPrefs.travel && (
                  <span className="px-2 py-[3px] rounded-full text-[11px] font-semibold bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-300 border border-sky-200/50 dark:border-sky-800/40 flex items-center gap-0.5">
                    <Plane className="w-2.5 h-2.5" />
                    Explorer
                  </span>
                )}
                {lifestyleTags.map((tag, idx) => (
                  <span
                    key={`lt-${idx}`}
                    className="px-2 py-[3px] rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-white/[0.05] text-slate-500 dark:text-slate-300 border border-slate-200/50 dark:border-white/[0.08] flex items-center gap-0.5"
                  >
                    <Hash className="w-2.5 h-2.5 opacity-40" />
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* ── Hosted Activity ── */}
            {detailedUser?.activitiesOrganized?.length > 0 && (
              <div className="mt-3 flex items-center gap-1.5 text-[11px] bg-emerald-50/80 dark:bg-emerald-950/30 rounded-xl px-3 py-1.5 border border-emerald-100 dark:border-emerald-900/40 text-left">
                <Sparkles className="w-3 h-3 text-emerald-500 shrink-0" />
                <span className="text-emerald-700 dark:text-emerald-300 truncate">
                  <strong>Hosted:</strong> {detailedUser.activitiesOrganized[0].title}
                </span>
              </div>
            )}

            {/* ── Message CTA ── */}
            {showChatOption && !isSelf && (
              <button
                type="button"
                onClick={handleStartMessage}
                disabled={startingChat}
                className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-[13px] shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60"
              >
                {startingChat ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <MessageSquare className="w-4 h-4" />
                )}
                Message {firstName}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
