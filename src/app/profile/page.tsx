"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  MapPin,
  CreditCard,
  Settings,
  Camera,
  Eye,
  Trash2,
  X,
  Loader2,
} from "lucide-react";
import { VerificationBadge } from "@/components/common/VerificationBadge";
import { safeJsonParse } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { AvatarBadge } from "@/components/common/AvatarBadge";
import { getBadgeForRank, parseRankFromMembership } from "@/lib/badges";
import { VirtualMembershipCard } from "@/components/profile/VirtualMembershipCard";
import { UserProfileTabs } from "@/components/profile/UserProfileTabs";
import { LifestyleBadges } from "@/components/profile/LifestyleBadges";
import { useLanguage } from "@/context/LanguageContext";

export default function MyProfilePage() {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);

  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        const p = data.user?.profile;
        if (p) {
          setProfile(p);
          setDisplayName(p.displayName || data.user.displayName || "");
          setBio(p.bio || "");
          setCity(p.city || "");
          setLinkedinUrl(p.linkedinUrl || "");
          setAvatarUrl(p.avatarUrl || "");
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const result = reader.result as string;
        setAvatarUrl(result);
        setIsAvatarMenuOpen(false);
        try {
          await fetch("/api/profile", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ avatarUrl: result }),
          });
        } catch (err) {
          console.error("Failed to persist avatar:", err);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = async () => {
    setAvatarUrl("");
    setIsAvatarMenuOpen(false);
    try {
      await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: null }),
      });
    } catch (err) {
      console.error("Failed to remove avatar:", err);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3 text-center">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600 dark:text-emerald-400" />
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 animate-pulse">
          Loading...
        </span>
      </div>
    );
  }

  const userRank = currentUser?.joinRank || parseRankFromMembership(profile?.membershipNumber);
  const userBadge = getBadgeForRank(userRank);
  const membershipNum = profile?.membershipNumber || `TRV-${String(userRank).padStart(4, "0")}`;
  const currentAvatarSrc = avatarUrl || currentUser?.avatarUrl;

  const connPrefs: any = safeJsonParse(profile?.connectionPreferences, {});
  const lifestyle = {
    smokingHabit: connPrefs.smokingHabit,
    drinkingHabit: connPrefs.drinkingHabit,
    dietaryPreference: connPrefs.dietaryPreference,
    lifestyleTags: connPrefs.lifestyleTags,
    showLifestylePublic: connPrefs.showLifestylePublic,
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-28">
      {/* ── PROFILE HEADER CARD (Read-only on profile, edited in settings) ── */}
      <div className="bg-white dark:bg-[#111815] rounded-3xl border border-slate-200 dark:border-emerald-950/80 p-6 sm:p-8 shadow-sm flex flex-col gap-6 relative">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          {/* Avatar with Dropdown */}
          <div className="relative">
            <div
              className="relative cursor-pointer group"
              onClick={() => setIsAvatarMenuOpen(!isAvatarMenuOpen)}
              title="Click to update photo"
            >
              <AvatarBadge
                src={currentAvatarSrc}
                name={displayName || currentUser?.displayName}
                rank={userRank}
                badge={userBadge}
                size="lg"
                showCrown={true}
                showRibbon={true}
              />
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-8 h-8 text-white opacity-80" />
              </div>
            </div>

            {isAvatarMenuOpen && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-white dark:bg-[#1a231f] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden text-sm">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 transition-colors text-left"
                >
                  <Camera className="w-4 h-4 text-emerald-500" />
                  <span className="font-medium">Change Photo</span>
                </button>
                {currentAvatarSrc && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAvatarModalOpen(true);
                        setIsAvatarMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 transition-colors text-left"
                    >
                      <Eye className="w-4 h-4 text-blue-500" />
                      <span className="font-medium">View Photo</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 transition-colors text-left border-t border-slate-100 dark:border-slate-800"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                      <span className="font-medium">Remove Photo</span>
                    </button>
                  </>
                )}
              </div>
            )}

            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleAvatarChange}
            />
          </div>

          {/* Name & Badges */}
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <h1 className="font-black text-xl sm:text-2xl text-slate-900 dark:text-white tracking-tight">
                {displayName || "Explorer"}
              </h1>
              <VerificationBadge
                status={profile?.verificationStatus || "UNVERIFIED"}
                isVerified={profile?.isVerified}
                showLabel
              />
            </div>

            {/* Location (Read-only) */}
            <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>{city || "Location not set"}</span>
            </div>

            {/* Short Bio (Read-only) */}
            {bio && (
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-lg mx-auto leading-relaxed pt-1">
                {bio}
              </p>
            )}
          </div>

          {/* Action Bar (Travally Pass & Settings button) */}
          <div className="flex items-center justify-center gap-2.5 flex-wrap pt-1">
            <button
              type="button"
              onClick={() => setIsCardModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 font-bold text-xs flex items-center gap-2 transition-colors border border-amber-200/60 dark:border-amber-800/40 shadow-xs"
            >
              <CreditCard className="w-4 h-4" />
              <span>{t.travallyCardBtn}</span>
            </button>

            {/* Edit is ONLY through settings as requested */}
            <Link
              href="/settings"
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#16221c] dark:hover:bg-[#1e2f27] text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-2 transition-colors border border-slate-200/80 dark:border-emerald-950 shadow-xs"
            >
              <Settings className="w-4 h-4 text-emerald-500" />
              <span>Settings &amp; Edit Profile</span>
            </Link>
          </div>
        </div>

        {/* ── LIFESTYLE BADGES (Smoker / Drinker / Diet) ── */}
        <div className="pt-4 border-t border-slate-100 dark:border-emerald-950/60">
          <LifestyleBadges lifestyle={lifestyle} isOwn={true} />
        </div>
      </div>

      {/* ── ALL 6 CONTENT TABS (Instants, Grow, Travel, Companion, Find Me, Treasure) ── */}
      {currentUser?.id && (
        <div className="bg-white/80 dark:bg-[#111815]/80 backdrop-blur-md rounded-3xl border border-slate-200/90 dark:border-emerald-950/70 p-4 sm:p-6 shadow-sm">
          <UserProfileTabs
            userId={currentUser.id}
            userName={displayName || "Me"}
            isOwn={true}
          />
        </div>
      )}

      {/* ── TRAVALLY CARD MODAL ── */}
      {isCardModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div
            className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm"
            onClick={() => setIsCardModalOpen(false)}
          />

          <div className="relative w-full max-w-2xl bg-transparent max-h-[90vh] overflow-y-auto no-scrollbar rounded-3xl animate-in fade-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setIsCardModalOpen(false)}
              className="absolute top-4 right-4 z-50 p-2.5 rounded-full bg-white/20 hover:bg-white/40 dark:bg-black/40 dark:hover:bg-black/60 text-slate-800 dark:text-white transition backdrop-blur-md shadow-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-6 pt-12 sm:pt-0">
              <div className="bg-gradient-to-b from-slate-50 to-white dark:from-[#111815] dark:to-[#0d1411] border border-slate-200 dark:border-emerald-950/80 rounded-3xl p-4 sm:p-8 md:p-10 shadow-2xl space-y-6">
                <div className="text-center max-w-lg mx-auto mb-2">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    {t.travallyPass}
                  </h2>
                </div>

                <VirtualMembershipCard
                  displayName={displayName || currentUser?.displayName || currentUser?.email?.split("@")[0] || "Travally Explorer"}
                  avatarUrl={avatarUrl || currentUser?.avatarUrl}
                  membershipNumber={membershipNum}
                  membershipTier={userBadge.tier}
                  membershipStatus={profile?.membershipStatus || "ACTIVE"}
                  memberSince={profile?.memberSince || profile?.createdAt}
                  isVerified={profile?.isVerified}
                  city={city || profile?.city}
                  interests={[]}
                  totalActivities={0}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── AVATAR VIEWER MODAL ── */}
      {isAvatarModalOpen && currentAvatarSrc && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onClick={() => setIsAvatarModalOpen(false)}
        >
          <div className="relative max-w-md w-full bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl">
            <button
              onClick={() => setIsAvatarModalOpen(false)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition z-10"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={currentAvatarSrc}
              alt={displayName}
              className="w-full h-auto max-h-[70vh] object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
