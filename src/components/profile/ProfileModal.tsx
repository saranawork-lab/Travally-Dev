"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  MapPin,
  MessageSquare,
  Compass,
  ShieldCheck,
  Award,
  Loader2,
  Calendar,
  Linkedin,
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

  const [activeTab, setActiveTab] = useState<"about" | "passions">("about");

  const totalTags =
    interests.length +
    (connPrefs.friendship ? 1 : 0) +
    (connPrefs.travel ? 1 : 0) +
    lifestyleTags.length;

  useEffect(() => {
    if (!bio && totalTags > 0) {
      setActiveTab("passions");
    } else {
      setActiveTab("about");
    }
  }, [bio, totalTags]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/70 dark:bg-black/85 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card - Strictly fitted to screen with ZERO vertical scroll */}
      <div className="relative w-full max-w-[390px] flex flex-col bg-white dark:bg-[#0c1410] rounded-[32px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5),0_0_30px_rgba(16,185,129,0.15)] border border-slate-200/90 dark:border-emerald-950/80 overflow-hidden animate-in fade-in zoom-in-95 duration-200 select-none">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white/90 hover:text-white transition-all z-30 backdrop-blur-md cursor-pointer active:scale-90 shadow-sm"
          title="Close profile"
        >
          <X className="w-4 h-4" />
        </button>

        {/* ── REALISTIC AURORA DEPTH BANNER ── */}
        <div className="h-20 sm:h-22 relative overflow-hidden shrink-0 bg-[#041a14]">
          {/* Base realistic mesh gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#022c22] via-[#064e3b] via-[#0b5343] to-[#03241d]" />

          {/* Luminous spatial aurora orbs */}
          <div className="absolute -top-10 -left-6 w-44 h-44 rounded-full bg-emerald-400/30 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-8 -right-6 w-48 h-48 rounded-full bg-gradient-to-br from-amber-400/20 via-teal-300/25 to-cyan-400/20 blur-2xl pointer-events-none" />
          <div className="absolute top-0 right-1/4 w-32 h-32 rounded-full bg-teal-400/20 blur-2xl pointer-events-none" />

          {/* Micro ambient grid accent */}
          <div className="absolute inset-0 bg-[radial-gradient(#34d399_1px,transparent_1px)] [background-size:14px_14px] opacity-20 pointer-events-none" />

          {/* Realistic depth vignette */}
          <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
        </div>

        {/* ── PROFILE BODY (COMPACT & FITTED WITH ZERO SCROLLING) ── */}
        <div className="px-4.5 sm:px-5 pb-4.5 pt-0 relative z-10 flex flex-col">
          {/* Avatar with Multi-Layered Realistic Glowing Aura & Iridescent Rim */}
          <div className="relative flex justify-center -mt-10 mb-2">
            {/* Luminous Glow Halo directly behind the photo */}
            <div className="absolute -inset-3.5 rounded-full bg-gradient-to-tr from-emerald-500/50 via-teal-400/40 via-cyan-400/30 to-amber-300/25 blur-xl animate-pulse pointer-events-none" />
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-emerald-400 to-teal-300 blur-md opacity-60 pointer-events-none" />

            {/* Iridescent Gradient Floating Rim */}
            <div className="relative p-[2.5px] rounded-full bg-gradient-to-tr from-emerald-400 via-teal-200 via-cyan-300 to-amber-300 shadow-[0_10px_25px_-5px_rgba(16,185,129,0.5),0_0_20px_rgba(20,184,166,0.3)] ring-2 ring-white/30 dark:ring-black/50">
              <div className="bg-white dark:bg-[#0c1410] p-0.5 rounded-full">
                <AvatarBadge
                  src={avatarUrl}
                  name={displayName}
                  size="lg"
                  showCrown={false}
                />
              </div>
            </div>
          </div>

          {/* Name & Verification */}
          <div className="text-center">
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center justify-center gap-1.5 leading-tight">
              <span className="truncate max-w-[240px]">{displayName}</span>
              <VerificationBadge
                status={profile.verificationStatus || "UNVERIFIED"}
                isVerified={profile.isVerified}
                hasLinkedin={!!profile.linkedinUrl}
              />
            </h2>

            {/* Badges Pill Row */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 mt-1 text-[10.5px]">
              {membershipNumber && (
                <span className="px-2 py-0.2 rounded-full font-mono font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60">
                  {membershipNumber}
                </span>
              )}
              {city && (
                <span className="px-2 py-0.2 rounded-full font-medium bg-slate-100 dark:bg-[#15201a] text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-emerald-950/60 flex items-center gap-1">
                  <MapPin className="w-2.5 h-2.5 text-emerald-500" />
                  <span>{city}</span>
                </span>
              )}
              {joinRank && (
                <span className="px-2 py-0.2 rounded-full font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 flex items-center gap-0.5">
                  <Award className="w-2.5 h-2.5 text-amber-500" />
                  <span>#{joinRank}</span>
                </span>
              )}
            </div>

            {/* Message Action Button */}
            {showChatOption && !isSelf && (
              <div className="mt-2.5 flex justify-center">
                <button
                  type="button"
                  onClick={handleStartMessage}
                  disabled={startingChat}
                  className="inline-flex items-center gap-1.5 px-5 py-1.5 rounded-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold text-xs shadow-md shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer"
                >
                  {startingChat ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <MessageSquare className="w-3.5 h-3.5" />
                  )}
                  <span>Message {displayName.split(" ")[0]}</span>
                </button>
              </div>
            )}
          </div>

          {/* ── UNIQUE SEGMENTED DECK SWITCHER (ZERO-SCROLL GUARANTEE) ── */}
          <div className="mt-3 mb-2 flex items-center p-1 rounded-2xl bg-slate-100/90 dark:bg-[#121c17] border border-slate-200/70 dark:border-emerald-950/60 shadow-inner">
            <button
              type="button"
              onClick={() => setActiveTab("about")}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "about"
                  ? "bg-white dark:bg-[#192721] text-emerald-700 dark:text-emerald-400 shadow-xs border border-slate-200/60 dark:border-emerald-800/40"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <span>About</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("passions")}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "passions"
                  ? "bg-white dark:bg-[#192721] text-emerald-700 dark:text-emerald-400 shadow-xs border border-slate-200/60 dark:border-emerald-800/40"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <span>Interests & Vibes</span>
              {totalTags > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  {totalTags}
                </span>
              )}
            </button>
          </div>

          {/* ── DYNAMIC FITTED CARD DISPLAY ── */}
          <div className="relative min-h-[120px] max-h-[140px] flex flex-col justify-center">
            {activeTab === "about" ? (
              <div className="rounded-2xl bg-slate-50 dark:bg-[#131e18] p-3 border border-slate-200/70 dark:border-emerald-950/60 text-left h-full flex flex-col justify-between overflow-hidden shadow-xs">
                <div>
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                    <span>Explorer Bio</span>
                    {memberSince && (
                      <span className="font-medium text-slate-400 normal-case">
                        Joined {new Date(memberSince).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed line-clamp-4">
                    {bio || "This explorer hasn't added a bio yet."}
                  </p>
                </div>

                {detailedUser?.activitiesOrganized?.length > 0 && (
                  <div className="pt-1.5 border-t border-slate-200/50 dark:border-emerald-950/40 flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">Hosted:</span>
                    <span className="truncate">{detailedUser.activitiesOrganized[0].title}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl bg-slate-50 dark:bg-[#131e18] p-3 border border-slate-200/70 dark:border-emerald-950/60 text-left h-full flex flex-col justify-start gap-2 overflow-y-auto scrollbar-none shadow-xs">
                {interests.length > 0 && (
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                      Interests & Hobbies
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {interests.map((interest: string, i: number) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/50"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {hasPreferences && (
                  <div className={interests.length > 0 ? "pt-1.5 border-t border-slate-200/50 dark:border-emerald-950/40" : ""}>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                      Travel & Lifestyle Vibes
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {connPrefs.friendship && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                          🤝 Friendship
                        </span>
                      )}
                      {connPrefs.travel && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          ✈️ Explorer
                        </span>
                      )}
                      {lifestyleTags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {interests.length === 0 && !hasPreferences && (
                  <div className="flex items-center justify-center h-full text-xs text-slate-400">
                    No interests or lifestyle vibes added yet.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

