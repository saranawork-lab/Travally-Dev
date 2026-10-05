"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  User,
  Lock,
  Eye,
  LogOut,
  ArrowLeft,
  Mail,
  MapPin,
  Calendar,
  Award,
  CheckCircle,
  CreditCard,
} from "lucide-react";
import { AvatarBadge } from "@/components/common/AvatarBadge";
import { getBadgeForRank, parseRankFromMembership } from "@/lib/badges";
import { useAuth } from "@/context/AuthContext";

export default function SettingsPage() {
  const router = useRouter();
  const { logout, currentUser } = useAuth();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"privacy" | "security">("privacy");
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Settings states
  const [hideContactDetails, setHideContactDetails] = useState(true);
  const [discoveryVisible, setDiscoveryVisible] = useState(true);

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => {
        if (!res.ok) {
          if (res.status === 401) router.push("/login");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
          if (data.user.profile) {
            setHideContactDetails(data.user.profile.hideContactDetails ?? true);
            setDiscoveryVisible(data.user.profile.discoveryVisible ?? true);
          }
        }
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [router]);

  const handleSavePrivacy = async () => {
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hideContactDetails,
          discoveryVisible,
        }),
      });
      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2500);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const profile = user?.profile;
  const userRank = user?.joinRank || parseRankFromMembership(profile?.membershipNumber) || 10;
  const userBadge = getBadgeForRank(userRank);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-28">
      {/* ── TOP BREADCRUMB / TITLE ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/discover"
              className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Discover</span>
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Account &amp; Privacy Settings
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your account privacy, visibility preferences, and security settings.
          </p>
        </div>

        {/* Link to Profile for Pass & Badges */}
        <div className="flex items-center gap-2 self-start sm:self-center flex-wrap">
          <Link
            href="/profile"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs border border-emerald-200 dark:border-emerald-800/60 transition shadow-xs"
          >
            <CreditCard className="w-3.5 h-3.5 text-emerald-500" />
            <span>View Profile &amp; 3D Pass &rarr;</span>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900/60 transition shadow-xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* ── TABS NAVIGATION ── */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-emerald-950/70 pb-2 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab("privacy")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap min-h-[44px] ${
            activeTab === "privacy"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#131c18]"
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>Privacy &amp; Visibility</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("security")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap min-h-[44px] ${
            activeTab === "security"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#131c18]"
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Security &amp; E2EE</span>
        </button>
      </div>

      {/* ── TAB 1: PRIVACY & DISCOVERY VISIBILITY ── */}
      {activeTab === "privacy" && (
        <div className="bg-white dark:bg-[#111815] border border-slate-200 dark:border-emerald-950/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm animate-fade-in">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Privacy &amp; Discovery Visibility
            </h2>
            <p className="text-xs text-slate-500">
              Customize how other explorers find and interact with you on Travally.
            </p>
          </div>

          <div className="space-y-4 pt-2">
            <label className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-[#16201b] border border-slate-200/80 dark:border-emerald-950/60 cursor-pointer">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Show in Public Discovery Feed
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block leading-relaxed">
                  Allow other verified travelers in your city to view your interests and invite you to activities.
                </span>
              </div>
              <input
                type="checkbox"
                checked={discoveryVisible}
                onChange={(e) => setDiscoveryVisible(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600 mt-1 cursor-pointer"
              />
            </label>

            <label className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-[#16201b] border border-slate-200/80 dark:border-emerald-950/60 cursor-pointer">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Hide Exact Contact Details
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block leading-relaxed">
                  Only show contact handles after you mutually accept a companion request or activity invite.
                </span>
              </div>
              <input
                type="checkbox"
                checked={hideContactDetails}
                onChange={(e) => setHideContactDetails(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600 mt-1 cursor-pointer"
              />
            </label>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={handleSavePrivacy}
              className="px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all"
            >
              Save Privacy Preferences
            </button>
          </div>
        </div>
      )}

      {/* ── TAB 2: SECURITY & E2EE ── */}
      {activeTab === "security" && (
        <div className="bg-white dark:bg-[#111815] border border-slate-200 dark:border-emerald-950/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm animate-fade-in">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              End-to-End Encryption &amp; Security
            </h2>
            <p className="text-xs text-slate-500">
              Travally ensures your direct communications and meetup coordinates remain private.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 space-y-2">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Session Shield Active</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Your session is cryptographically signed and stored in a secure HttpOnly cookie. Messages in confirmed companion rooms use WebCrypto end-to-end encryption.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
