"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  User,
  ShieldCheck,
  MapPin,
  Linkedin,
  Save,
  CheckCircle,
  X,
  LogOut,
  CreditCard,
  Sparkles,
  Award,
  Shield,
  Copy,
  Check,
  Edit3,
} from "lucide-react";
import { VerificationBadge } from "@/components/common/VerificationBadge";
import { safeJsonParse } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { AvatarBadge } from "@/components/common/AvatarBadge";
import { getBadgeForRank, parseRankFromMembership } from "@/lib/badges";
import { VirtualMembershipCard } from "@/components/profile/VirtualMembershipCard";

export default function MyProfilePage() {
  const { currentUser, logout } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);
  const [activeTab, setActiveTab] = useState<"pass" | "profile" | "badges">("profile");

  // Form states
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [gender, setGender] = useState("PREFER_NOT_TO_SAY");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [hideContactDetails, setHideContactDetails] = useState(true);
  const [discoveryVisible, setDiscoveryVisible] = useState(true);

  // Interests
  const [interestInput, setInterestInput] = useState("");
  const [interests, setInterests] = useState<string[]>([]);

  // Preferred Activities
  const [preferredActivities, setPreferredActivities] = useState<string[]>([]);

  // Connection Preferences
  const [connPrefs, setConnPrefs] = useState({
    friendship: true,
    activityPartner: true,
    travel: true,
    dating: false,
  });

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        const p = data.user?.profile;
        if (p) {
          setProfile(p);
          setDisplayName(p.displayName || "");
          setBio(p.bio || "");
          setCity(p.city || "");
          setGender(p.gender || "PREFER_NOT_TO_SAY");
          setLinkedinUrl(p.linkedinUrl || "");
          setAvatarUrl(p.avatarUrl || "");
          setHideContactDetails(p.hideContactDetails ?? true);
          setDiscoveryVisible(p.discoveryVisible ?? true);
          setInterests(safeJsonParse<string[]>(p.interests, []));
          setPreferredActivities(safeJsonParse<string[]>(p.preferredActivities, []));
          setConnPrefs(
            safeJsonParse(p.connectionPreferences, {
              friendship: true,
              activityPartner: true,
              travel: true,
              dating: false,
            })
          );
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

  const addInterest = () => {
    if (interestInput.trim() && !interests.includes(interestInput.trim())) {
      setInterests([...interests, interestInput.trim()]);
      setInterestInput("");
    }
  };

  const removeInterest = (tag: string) => {
    setInterests(interests.filter((t) => t !== tag));
  };

  const toggleActivityPref = (act: string) => {
    if (preferredActivities.includes(act)) {
      setPreferredActivities(preferredActivities.filter((a) => a !== act));
    } else {
      setPreferredActivities([...preferredActivities, act]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          bio,
          city,
          gender,
          linkedinUrl,
          avatarUrl,
          hideContactDetails,
          discoveryVisible,
          interests,
          preferredActivities,
          connectionPreferences: connPrefs,
        }),
      });

      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      } else {
        alert("Failed to save profile changes.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleCopyPass = () => {
    if (typeof navigator !== "undefined" && (profile?.membershipNumber || currentUser?.id)) {
      const passNum = profile?.membershipNumber || `TRV-${String(userRank).padStart(4, "0")}`;
      navigator.clipboard.writeText(passNum);
      setCopiedPass(true);
      setTimeout(() => setCopiedPass(false), 2000);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-xs text-slate-400">Loading your profile & founding pass...</div>;
  }

  const ACTIVITIES_LIST = [
    "Movies",
    "Food and Cafes",
    "Walking",
    "Studying",
    "Events",
    "Shopping",
    "City Exploration",
  ];

  const userRank = currentUser?.joinRank || parseRankFromMembership(profile?.membershipNumber);
  const userBadge = getBadgeForRank(userRank);
  const membershipNum = profile?.membershipNumber || `TRV-${String(userRank).padStart(4, "0")}`;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            My Profile &amp; Member Pass
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your companion profile, interactive 3D Founding Pass, and verified badges.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center flex-wrap">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold bg-slate-100 dark:bg-emerald-950/80 text-slate-700 dark:text-emerald-300 border-slate-200 dark:border-emerald-800/60 shadow-2xs">
            <span>{userBadge.badgeIcon}</span>
            <span>#{userRank}</span>
          </div>
          <button
            type="button"
            onClick={async () => {
              await logout();
              window.location.href = "/login";
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-bold text-xs border border-rose-200 dark:border-rose-800/60 transition shadow-xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Profile & Pass Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-emerald-950/70 pb-2 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap min-h-[44px] ${
            activeTab === "profile"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#131c18]"
          }`}
        >
          <User className="w-4 h-4" />
          <span>Profile Details</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("pass")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap min-h-[44px] ${
            activeTab === "pass"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#131c18]"
          }`}
        >
          <CreditCard className="w-4 h-4 text-amber-300" />
          <span>3D Virtual Pass</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("badges")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap min-h-[44px] ${
            activeTab === "badges"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#131c18]"
          }`}
        >
          <Award className="w-4 h-4 text-emerald-400" />
          <span>Badges &amp; Verification</span>
        </button>
      </div>

      {/* ── TAB 1: PROFILE DETAILS FORM ── */}
      {activeTab === "profile" && (
        <form onSubmit={handleSave} className="space-y-6 animate-fade-in">
          {/* Profile Header Summary */}
          <div className="bg-white dark:bg-dark-card rounded-3xl border border-slate-200 dark:border-dark-border p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-dark-border">
              <div className="flex items-center gap-4">
                <AvatarBadge
                  src={avatarUrl || currentUser?.avatarUrl}
                  name={displayName || currentUser?.displayName}
                  rank={userRank}
                  badge={userBadge}
                  size="lg"
                  showCrown={true}
                  showRibbon={true}
                />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-bold text-lg text-slate-900 dark:text-white">
                      {displayName || "Your Name"}
                    </h2>
                    {userBadge && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-emerald-500/20 text-amber-700 dark:text-amber-300 border border-amber-400/40 inline-flex items-center gap-1 shadow-2xs">
                        <span>{userBadge.badgeIcon}</span>
                        <span>#{userRank}</span>
                      </span>
                    )}
                    <VerificationBadge
                      status={profile?.verificationStatus || "UNVERIFIED"}
                      isVerified={profile?.isVerified}
                      hasLinkedin={!!linkedinUrl}
                      showLabel
                    />
                  </div>
                  <p className="text-xs text-slate-500">{city || "City not set"}</p>
                </div>
              </div>

              {/* Pass Quick Action */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("pass")}
                  className="px-3.5 py-2 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs font-bold border border-amber-200 dark:border-amber-800/60 flex items-center gap-1.5 transition hover:scale-105"
                >
                  <CreditCard className="w-4 h-4 text-amber-500" />
                  <span>View 3D Pass</span>
                </button>
              </div>
            </div>

            {/* Form Fields: Display Name, City, Gender */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                  Display Name *
                </label>
                <input
                  required
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-elevated px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                  City / Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. San Francisco, CA"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-elevated px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-elevated px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Others</option>
                </select>
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                Short Bio
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell others about what you enjoy doing on weekends, what inspires you, and your favorite travel spots..."
                className="w-full rounded-2xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-elevated p-3.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 leading-relaxed"
              />
            </div>

            {/* LinkedIn Verification Link */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
                <Linkedin className="w-3.5 h-3.5 text-[#0A66C2]" />
                <span>LinkedIn Profile URL (Optional Verification)</span>
              </label>
              <input
                type="url"
                placeholder="https://linkedin.com/in/username"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-elevated px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            {/* Interests Tags */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                Personal Interests &amp; Passions
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Add interest (e.g. Cinema, Architecture, Pour-Over, Hiking)..."
                  value={interestInput}
                  onChange={(e) => setInterestInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addInterest();
                    }
                  }}
                  className="flex-1 rounded-2xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-elevated px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={addInterest}
                  className="px-4 py-2 rounded-2xl text-xs font-semibold bg-slate-100 dark:bg-dark-elevated hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {interests.map((t, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs border border-emerald-200 dark:border-emerald-800"
                  >
                    <span>{t}</span>
                    <button type="button" onClick={() => removeInterest(t)} className="hover:text-rose-500">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Preferred Activities */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-2">
                Preferred Activities
              </label>
              <div className="flex flex-wrap gap-2">
                {ACTIVITIES_LIST.map((act) => {
                  const isSelected = preferredActivities.includes(act);
                  return (
                    <button
                      key={act}
                      type="button"
                      onClick={() => toggleActivityPref(act)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition ${
                        isSelected
                          ? "bg-gradient-to-r from-emerald-100 via-teal-50 to-emerald-100 dark:from-emerald-950/80 dark:to-teal-950/70 text-emerald-950 dark:text-emerald-200 border border-emerald-300/80 dark:border-emerald-700 font-bold shadow-xs"
                          : "bg-slate-100 dark:bg-dark-elevated text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                      }`}
                    >
                      {act}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Connection Preferences */}
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

            {/* Privacy & Safety Controls */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-elevated border border-slate-200/80 dark:border-dark-border space-y-3">
              <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block">
                Privacy Settings
              </span>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hideContactDetails}
                    onChange={(e) => setHideContactDetails(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Hide exact contact details (email and exact address) from public cards</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={discoveryVisible}
                    onChange={(e) => setDiscoveryVisible(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Make profile discoverable in member directory</span>
                </label>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-between pt-2">
              {savedSuccess ? (
                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> Changes saved successfully!
                </span>
              ) : (
                <span />
              )}

              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-full text-xs font-bold text-emerald-950 dark:text-emerald-200 bg-gradient-to-r from-emerald-100 via-teal-50 to-emerald-100 dark:from-emerald-950/80 dark:to-teal-950/70 hover:from-emerald-200 hover:to-teal-100 border border-emerald-300/80 dark:border-emerald-800/60 disabled:opacity-60 transition shadow-xs flex items-center gap-1.5"
              >
                <Save className="w-4 h-4 text-emerald-700 dark:text-emerald-300" />
                <span>{saving ? "Saving..." : "Save Profile Changes"}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ── TAB 2: VIRTUAL MEMBERSHIP PASS ── */}
      {activeTab === "pass" && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-gradient-to-b from-slate-50 to-white dark:from-[#111815] dark:to-[#0d1411] border border-slate-200 dark:border-emerald-950/80 rounded-3xl p-4 sm:p-8 md:p-10 shadow-sm space-y-6">
            <div className="text-center max-w-lg mx-auto space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>FOUNDING MEMBER CERTIFICATE</span>
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                Official 3D Virtual Membership Pass
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Your permanent founding pass rank is <span className="font-bold text-amber-600 dark:text-amber-400">#{userRank}</span> in the Travally global network. Click or hover the card to inspect details and flip it over.
              </p>
            </div>

            {/* The 3D Foil Holographic Card */}
            <VirtualMembershipCard
              displayName={displayName || currentUser?.displayName || currentUser?.email?.split("@")[0] || "Travally Explorer"}
              avatarUrl={avatarUrl || currentUser?.avatarUrl}
              membershipNumber={membershipNum}
              membershipTier={userBadge.tier}
              membershipStatus={profile?.membershipStatus || "ACTIVE"}
              memberSince={profile?.memberSince || profile?.createdAt}
              isVerified={profile?.isVerified}
              city={city || profile?.city}
              interests={interests}
              totalActivities={0}
              totalTrips={0}
            />

            {/* Quick Actions for Pass */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleCopyPass}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-white dark:bg-emerald-950/60 border border-slate-200 dark:border-emerald-800 text-xs font-bold text-slate-700 dark:text-emerald-300 shadow-2xs hover:border-emerald-500 transition"
              >
                {copiedPass ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-amber-500" />}
                <span>{copiedPass ? "Pass Number Copied!" : `Copy Pass: ${membershipNum}`}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: BADGES & VERIFICATION ── */}
      {activeTab === "badges" && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white dark:bg-[#111815] border border-slate-200 dark:border-emerald-950/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-500" />
                <span>Verified Badges &amp; Trust Tier</span>
              </h2>
              <p className="text-xs text-slate-500">
                Your badges build trust across activity groups and companion listings.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Rank Badge Box */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#16201b] border border-slate-200 dark:border-emerald-950/70 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Founding Rank Badge
                  </span>
                  <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                    {userBadge.badgeIcon} #{userRank}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center text-xl">
                    {userBadge.badgeIcon}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      Verified Member #{userRank}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Permanent verified founding rank.
                    </p>
                  </div>
                </div>
              </div>

              {/* Identity Verification Status */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#16201b] border border-slate-200 dark:border-emerald-950/70 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Identity Verification
                  </span>
                  <VerificationBadge
                    status={profile?.verificationStatus || "UNVERIFIED"}
                    isVerified={profile?.isVerified}
                    hasLinkedin={!!linkedinUrl}
                    showLabel
                  />
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      {profile?.isVerified ? "Verified Member" : "Unverified Member"}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {profile?.isVerified
                        ? "Identity verified by Travally."
                        : "Connect LinkedIn profile to display verified badge on activities."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
