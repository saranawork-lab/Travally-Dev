"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  ShieldCheck,
  MapPin,
  Linkedin,
  ArrowLeft,
  Flag,
  UserX,
  Compass,
  Users,
  Calendar,
  ExternalLink,
} from "lucide-react";
import { VerificationBadge } from "@/components/common/VerificationBadge";
import { ReportModal } from "@/components/common/ReportModal";
import { UserProfileTabs } from "@/components/profile/UserProfileTabs";
import { LifestyleBadges } from "@/components/profile/LifestyleBadges";
import { safeJsonParse } from "@/lib/utils";

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reportOpen, setReportOpen] = useState(false);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`/api/profile/${id}`);
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchProfile();
  }, [id]);

  const handleBlockUser = async () => {
    if (!confirm(`Are you sure you want to block ${user?.profile?.displayName}? You will no longer see each other's content.`)) return;

    try {
      const res = await fetch("/api/safety/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockedId: user.id }),
      });
      if (res.ok) {
        alert("User blocked successfully.");
        router.push("/discover");
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-xs text-slate-400">Loading member profile...</div>;
  }

  if (!user || !user.profile) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Profile Unavailable</h2>
        <p className="text-xs text-slate-500">This member profile does not exist or has been restricted.</p>
        <Link href="/discover" className="inline-flex px-4 py-2 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 transition shadow-sm">
          Back to Discover
        </Link>
      </div>
    );
  }

  const p = user.profile;
  const connPrefs: any = safeJsonParse(p.connectionPreferences, {});
  const lifestyle = {
    smokingHabit: connPrefs.smokingHabit,
    drinkingHabit: connPrefs.drinkingHabit,
    dietaryPreference: connPrefs.dietaryPreference,
    lifestyleTags: connPrefs.lifestyleTags,
    showLifestylePublic: connPrefs.showLifestylePublic,
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-24">
      <div>
        <Link
          href="/discover"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Discover</span>
        </Link>
      </div>

      {/* Main Profile Card */}
      <div className="bg-white dark:bg-dark-card rounded-3xl border border-slate-200 dark:border-dark-border p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-dark-border">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-black text-2xl flex items-center justify-center ring-4 ring-emerald-500/20 shadow-md shrink-0">
              {(p.displayName || "U").charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-bold text-xl text-slate-900 dark:text-white">
                  {p.displayName}
                </h1>
                <VerificationBadge
                  status={p.verificationStatus || "UNVERIFIED"}
                  isVerified={p.isVerified}
                  hasLinkedin={!!p.linkedinUrl}
                  showLabel
                />
                {/* LinkedIn: Logo only */}
                {p.linkedinUrl && (
                  <a
                    href={p.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-xl bg-[#0A66C2]/15 hover:bg-[#0A66C2]/25 text-[#0A66C2] border border-[#0A66C2]/30 transition"
                    title="LinkedIn Profile"
                  >
                    <Linkedin className="w-4 h-4 fill-current" />
                  </a>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>{p.city || "Explorer"}</span>
                {p.age && <span>• {p.age} years old</span>}
              </p>
            </div>
          </div>

          {/* Block / Report Controls */}
          {!user.isSelf && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setReportOpen(true)}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                title="Report user"
              >
                <Flag className="w-4 h-4" />
              </button>
              <button
                onClick={handleBlockUser}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                title="Block user"
              >
                <UserX className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Bio */}
        {p.bio && (
          <div className="space-y-1.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">About</h2>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line italic">
              &ldquo;{p.bio}&rdquo;
            </p>
          </div>
        )}

        {/* Lifestyle & Compatibility Badges (Smoker, Drinker, Diet) */}
        <div className="pt-2">
          <LifestyleBadges lifestyle={lifestyle} isOwn={user.isSelf} />
        </div>
      </div>

      {/* Member Content Tabs (Instants, Grow, Travel — Companion, Find Me, Treasure are owner-only) */}
      <div className="bg-white/80 dark:bg-[#111815]/80 backdrop-blur-md rounded-3xl border border-slate-200/90 dark:border-emerald-950/70 p-4 sm:p-6 shadow-sm">
        <UserProfileTabs userId={user.id} userName={p.displayName} isOwn={user.isSelf} />
      </div>

      <ReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        targetId={user.id}
        targetName={p.displayName || "Explorer"}
        targetType="USER"
      />
    </div>
  );
}
