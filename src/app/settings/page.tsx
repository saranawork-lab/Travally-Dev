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
  Moon,
  Sun,
  ChevronRight,
  ChevronDown,
  Shield,
} from "lucide-react";
import { AvatarBadge } from "@/components/common/AvatarBadge";
import { getBadgeForRank, parseRankFromMembership } from "@/lib/badges";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/components/theme/ThemeProvider";

export default function SettingsPage() {
  const router = useRouter();
  const { logout, currentUser } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isPrivacyExpanded, setIsPrivacyExpanded] = useState(false);

  // Settings states
  const [hideContactDetails, setHideContactDetails] = useState(true);
  const [discoveryVisible, setDiscoveryVisible] = useState(true);
  const [connPrefs, setConnPrefs] = useState({
    friendship: true,
    activityPartner: true,
    travel: false,
    dating: false,
  });

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
            
            const prefs = data.user.profile.connectionPreferences || ["friendship", "activityPartner"];
            setConnPrefs({
              friendship: prefs.includes("friendship"),
              activityPartner: prefs.includes("activityPartner"),
              travel: prefs.includes("travel"),
              dating: prefs.includes("dating"),
            });
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
          connectionPreferences: Object.keys(connPrefs).filter((k) => connPrefs[k as keyof typeof connPrefs]),
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
      {/* ── ACTION LIST (Privacy, Security, Safety, Dark Mode, Sign Out) ── */}
      <div className="bg-white dark:bg-[#111815] border border-slate-200 dark:border-emerald-950/80 rounded-3xl p-4 sm:p-6 shadow-sm animate-fade-in space-y-1">
        
        {/* Privacy Dropdown Item */}
        <button
          type="button"
          onClick={() => setIsPrivacyExpanded(!isPrivacyExpanded)}
          className="w-full flex items-center justify-between px-3 py-3 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-[#18241f] hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100/70 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40">
              <Eye className="w-4 h-4" />
            </div>
            <span className="text-sm">Privacy &amp; Discovery</span>
          </div>
          {isPrivacyExpanded ? (
            <ChevronDown className="w-4 h-4 text-slate-400 opacity-60" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-400 opacity-60" />
          )}
        </button>

        {isPrivacyExpanded && (
          <div className="px-3 pb-4 pt-2 space-y-6 animate-slide-down">
            {/* Connection Intent & Preferences */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-elevated border border-slate-200/80 dark:border-dark-border space-y-3">
              <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block">
                Connection Intent &amp; Preferences
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                Travally is activity-first. We do not force every connection to be romantic, but you can declare what connections you are open to.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={connPrefs.friendship}
                    onChange={(e) => setConnPrefs({ ...connPrefs, friendship: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Friendship</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={connPrefs.activityPartner}
                    onChange={(e) => setConnPrefs({ ...connPrefs, activityPartner: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Activity Partner</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={connPrefs.travel}
                    onChange={(e) => setConnPrefs({ ...connPrefs, travel: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Travel Partner</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={connPrefs.dating}
                    onChange={(e) => setConnPrefs({ ...connPrefs, dating: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Open to Dating</span>
                </label>
              </div>
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
        <button
          type="button"
          onClick={() => setShowSecurityModal(true)}
          className="w-full flex items-center justify-between px-3 py-3 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-[#18241f] hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100/70 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40">
              <Lock className="w-4 h-4" />
            </div>
            <span className="text-sm">Security &amp; E2EE</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 opacity-60" />
        </button>

        <Link
          href="/safety"
          className="w-full flex items-center justify-between px-3 py-3 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-[#18241f] hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100/70 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40">
              <Shield className="w-4 h-4" />
            </div>
            <span className="text-sm">Safety Center &amp; Rules</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 opacity-60" />
        </Link>

        <button
          type="button"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="w-full flex items-center justify-between px-3 py-3 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100/70 dark:bg-slate-800/60 flex items-center justify-center text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/40">
              {resolvedTheme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </div>
            <span className="text-sm">Dark Mode</span>
          </div>
          <div className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors duration-300 ${resolvedTheme === 'dark' ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${resolvedTheme === 'dark' ? 'translate-x-5' : 'translate-x-1'}`} />
          </div>
        </button>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-between px-3 py-3 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-100/70 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/40">
              <LogOut className="w-4 h-4" />
            </div>
            <span className="text-sm">Sign Out</span>
          </div>
        </button>
      </div>

      {/* Security Modal */}
      {showSecurityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#111815] border border-slate-200 dark:border-emerald-950/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl max-w-md w-full animate-slide-up relative">
            <button
              onClick={() => setShowSecurityModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="w-4 h-4 text-center leading-none">✕</div>
            </button>
            <div className="space-y-1 pr-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-emerald-600" />
                End-to-End Encryption
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
            
            <button
              onClick={() => setShowSecurityModal(false)}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
