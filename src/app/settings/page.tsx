"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  User,
  Lock,
  Eye,
  LogOut,
  Mail,
  MapPin,
  Calendar,
  Award,
  CheckCircle,
  Moon,
  Sun,
  ChevronRight,
  ChevronDown,
  Shield,
  HeartHandshake,
  Flag,
  Compass,
  Bell,
  Globe,
  Languages,
  Smartphone,
  HardDrive,
  Trash2,
  HelpCircle,
  MessageCircle,
  FileText,
  Info,
  UserX,
  Heart,
  Download,
  AlertTriangle,
  KeyRound,
  CircleUserRound,
  MailCheck,
  Activity,
  Plane,
  XCircle,
  Linkedin,
  Pencil,
} from "lucide-react";
import { AvatarBadge } from "@/components/common/AvatarBadge";
import { getBadgeForRank, parseRankFromMembership } from "@/lib/badges";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/components/theme/ThemeProvider";
import { useLanguage, LanguageCode } from "@/context/LanguageContext";

/* ── Reusable Settings Components ── */
const SettingsSection: React.FC<{
  title: string;
  children: React.ReactNode;
  className?: string;
}> = ({ title, children, className = "" }) => (
  <div className={`bg-white dark:bg-[#111815] border border-slate-200 dark:border-emerald-950/80 rounded-3xl p-3 sm:p-6 shadow-sm animate-fade-in space-y-1 ${className}`}>
    <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 px-3 pb-2">
      {title}
    </h3>
    {children}
  </div>
);

const SettingsRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  iconBg?: string;
  onClick?: () => void;
  trailing?: React.ReactNode;
  danger?: boolean;
  href?: string;
}> = ({ icon, label, sublabel, iconBg = "bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-800/40", onClick, trailing, danger, href }) => {
  const content = (
    <>
      <div className="flex items-center gap-3 min-w-0 flex-1 text-left">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 ${iconBg}`}>
          {icon}
        </div>
        <div className="min-w-0 flex-1 text-left">
          <span className={`text-sm font-semibold block text-left truncate ${danger ? "text-rose-600 dark:text-rose-400" : "text-slate-700 dark:text-slate-200"}`}>
            {label}
          </span>
          {sublabel && (
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block text-left truncate">
              {sublabel}
            </span>
          )}
        </div>
      </div>
      {trailing !== undefined ? (
        <div className="shrink-0 ml-2">{trailing}</div>
      ) : (
        <ChevronRight className="w-4 h-4 text-slate-400 opacity-60 shrink-0 ml-2" />
      )}
    </>
  );

  const cls = `w-full flex items-center justify-between text-left px-3 py-3 rounded-xl text-xs font-semibold ${
    danger
      ? "text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
      : "text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-[#18241f] hover:text-emerald-700 dark:hover:text-emerald-300"
  } transition-colors`;

  if (href) return <Link href={href} className={cls}>{content}</Link>;
  return <button type="button" onClick={onClick} className={cls}>{content}</button>;
};

const ToggleSwitch: React.FC<{ checked: boolean; onChange: (val: boolean) => void; color?: string }> = ({ checked, onChange, color = "bg-emerald-500" }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors duration-300 shrink-0 ${checked ? color : "bg-slate-300 dark:bg-slate-600"}`}
  >
    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-300 ${checked ? "translate-x-5" : "translate-x-1"}`} />
  </button>
);

const ExpandableRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  iconBg?: string;
  children: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
}> = ({ icon, label, iconBg = "bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-800/40", children, isExpanded, onToggle }) => (
  <>
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between text-left px-3 py-3 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-[#18241f] hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1 text-left">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 ${iconBg}`}>
          {icon}
        </div>
        <span className="text-sm font-semibold text-left truncate">{label}</span>
      </div>
      {isExpanded ? (
        <ChevronDown className="w-4 h-4 text-slate-400 opacity-60 shrink-0 ml-2" />
      ) : (
        <ChevronRight className="w-4 h-4 text-slate-400 opacity-60 shrink-0 ml-2" />
      )}
    </button>
    {isExpanded && <div className="px-2 sm:px-3 pb-4 pt-2 space-y-4 animate-slide-down text-left">{children}</div>}
  </>
);

/* ── Inline toast ── */
const Toast: React.FC<{ message: string; type?: "success" | "error"; visible: boolean }> = ({ message, type = "success", visible }) => {
  if (!visible) return null;
  return (
    <div className={`fixed top-16 left-1/2 -translate-x-1/2 z-[200] px-5 py-2.5 rounded-full text-xs font-bold shadow-lg animate-slide-down ${
      type === "success" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
    }`}>
      {message}
    </div>
  );
};

/* ── Main Settings Page ── */
export default function SettingsPage() {
  const router = useRouter();
  const { logout, currentUser } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyPolicyModal, setShowPrivacyPolicyModal] = useState(false);
  const [showAccountClosureModal, setShowAccountClosureModal] = useState(false);
  const [closureTab, setClosureTab] = useState<"deactivate" | "delete">("deactivate");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error"; visible: boolean }>({ message: "", type: "success", visible: false });
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 2500);
  };

  // Expanded sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const toggleSection = (key: string) => setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));

  // Settings states
  const [hideContactDetails, setHideContactDetails] = useState(true);
  const [discoveryVisible, setDiscoveryVisible] = useState(true);
  const [connPrefs, setConnPrefs] = useState({
    friendship: true,
    activityPartner: true,
    travel: false,
    dating: false,
  });

  // Notification settings (persisted in localStorage)
  const [notifSettings, setNotifSettings] = useState({
    activityInvites: true,
    tripRequests: true,
    messages: true,
    companions: true,
    reminders: true,
    marketing: false,
  });

  // Privacy extra (persisted in localStorage)
  const [privacySettings, setPrivacySettings] = useState({
    showOnlineStatus: true,
    showLastSeen: true,
    readReceipts: true,
    allowProfileSharing: true,
    showActivityHistory: true,
    allowLocationInChat: true,
  });

  // Email prefs (persisted in localStorage)
  const [emailPrefs, setEmailPrefs] = useState({
    activityDigest: true,
    newCompanions: true,
    travelUpdates: true,
    productNews: false,
  });

  // Profile edit states
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editGender, setEditGender] = useState("PREFER_NOT_TO_SAY");
  const [editLinkedinUrl, setEditLinkedinUrl] = useState("");
  const [editSmokingHabit, setEditSmokingHabit] = useState("NON_SMOKER");
  const [editDrinkingHabit, setEditDrinkingHabit] = useState("NON_DRINKER");
  const [editDietaryPreference, setEditDietaryPreference] = useState("ANY");
  const [editShowLifestylePublic, setEditShowLifestylePublic] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

  // Password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Blocked users
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [blockedLoading, setBlockedLoading] = useState(false);

  // Data export
  const [exporting, setExporting] = useState(false);

  // Load saved settings from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const savedNotif = localStorage.getItem("travally-notif-settings");
      if (savedNotif) setNotifSettings(JSON.parse(savedNotif));
      const savedPriv = localStorage.getItem("travally-privacy-settings");
      if (savedPriv) setPrivacySettings(JSON.parse(savedPriv));
      const savedEmail = localStorage.getItem("travally-email-prefs");
      if (savedEmail) setEmailPrefs(JSON.parse(savedEmail));
    } catch { /* ignore parse errors */ }
  }, []);

  // Persist notification settings
  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("travally-notif-settings", JSON.stringify(notifSettings));
  }, [notifSettings]);

  // Persist privacy settings
  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("travally-privacy-settings", JSON.stringify(privacySettings));
  }, [privacySettings]);

  // Persist email prefs
  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("travally-email-prefs", JSON.stringify(emailPrefs));
  }, [emailPrefs]);

  // Fetch profile
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
            const parsed = typeof prefs === "string" ? (() => { try { return JSON.parse(prefs); } catch { return []; } })() : prefs;
            if (Array.isArray(parsed)) {
              setConnPrefs({
                friendship: parsed.includes("friendship"),
                activityPartner: parsed.includes("activityPartner"),
                travel: parsed.includes("travel"),
                dating: parsed.includes("dating"),
              });
            }
            const connParsed = typeof data.user.profile.connectionPreferences === "string" 
              ? (() => { try { return JSON.parse(data.user.profile.connectionPreferences); } catch { return {}; } })()
              : (data.user.profile.connectionPreferences || {});

            setEditDisplayName(data.user.profile.displayName || data.user.displayName || "");
            setEditCity(data.user.profile.city || "");
            setEditBio(data.user.profile.bio || "");
            setEditGender(data.user.profile.gender || "PREFER_NOT_TO_SAY");
            setEditLinkedinUrl(data.user.profile.linkedinUrl || "");
            setEditSmokingHabit(connParsed.smokingHabit || "NON_SMOKER");
            setEditDrinkingHabit(connParsed.drinkingHabit || "NON_DRINKER");
            setEditDietaryPreference(connParsed.dietaryPreference || "ANY");
            setEditShowLifestylePublic(connParsed.showLifestylePublic !== false);
          }
        }
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [router]);

  // Save profile details to API
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: editDisplayName.trim(),
          city: editCity.trim(),
          bio: editBio.trim(),
          gender: editGender,
          linkedinUrl: editLinkedinUrl.trim() || null,
          smokingHabit: editSmokingHabit,
          drinkingHabit: editDrinkingHabit,
          dietaryPreference: editDietaryPreference,
          showLifestylePublic: editShowLifestylePublic,
        }),
      });
      if (res.ok) {
        showToast("Profile details updated successfully!");
        const data = await res.json();
        if (data.profile) {
          setUser((prev: any) => ({
            ...prev,
            displayName: editDisplayName.trim(),
            profile: { ...prev?.profile, ...data.profile },
          }));
        }
      } else {
        showToast("Failed to update profile", "error");
      }
    } catch {
      showToast("Network error", "error");
    } finally {
      setSavingProfile(false);
    }
  };

  // Save privacy to API
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
      if (res.ok) showToast("Privacy preferences saved!");
      else showToast("Failed to save", "error");
    } catch { showToast("Network error", "error"); }
  };

  // Change password via profile PUT
  const handleChangePassword = async () => {
    if (newPassword.length < 6) { showToast("Password must be at least 6 characters", "error"); return; }
    if (newPassword !== confirmPassword) { showToast("Passwords don't match", "error"); return; }
    setPasswordSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      if (res.ok) {
        showToast("Password updated successfully!");
        setShowPasswordModal(false);
        setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      } else showToast("Failed to update password", "error");
    } catch { showToast("Network error", "error"); }
    setPasswordSaving(false);
  };

  // Fetch blocked users
  const fetchBlockedUsers = useCallback(async () => {
    setBlockedLoading(true);
    try {
      const res = await fetch("/api/safety/block");
      if (res.ok) {
        const data = await res.json();
        setBlockedUsers(data.blocks || []);
      }
    } catch { /* ignore */ }
    setBlockedLoading(false);
  }, []);

  // Unblock user
  const handleUnblock = async (blockedId: string) => {
    try {
      const res = await fetch("/api/safety/block", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockedId }),
      });
      if (res.ok) {
        setBlockedUsers(prev => prev.filter(b => b.blockedId !== blockedId));
        showToast("User unblocked");
      } else showToast("Failed to unblock", "error");
    } catch { showToast("Network error", "error"); }
  };

  // Export data
  const handleExportData = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `travally-data-${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast("Data downloaded!");
      } else showToast("Failed to export", "error");
    } catch { showToast("Export failed", "error"); }
    setExporting(false);
  };

  // Storage usage
  const getStorageUsage = (): string => {
    if (typeof window === "undefined") return "0 KB";
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) total += (localStorage.getItem(key) || "").length;
    }
    return total > 1024 ? `${(total / 1024).toFixed(1)} KB` : `${total} bytes`;
  };

  // Clear all cache
  const handleClearCache = () => {
    if (typeof window === "undefined") return;
    const keysToKeep = ["travally-notif-settings", "travally-privacy-settings", "travally-email-prefs", "travally-language"];
    const allKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && !keysToKeep.includes(k)) allKeys.push(k);
    }
    allKeys.forEach(k => localStorage.removeItem(k));
    showToast("Cache cleared!");
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const handleDeactivate = async () => {
    try {
      await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discoveryVisible: false }),
      });
    } catch { /* ignore */ }
    await logout();
    router.push("/login");
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") return;
    setIsDeleting(true);
    try {
      const res = await fetch("/api/profile", { method: "DELETE" });
      if (!res.ok) {
        showToast("Failed to delete account. Please try again.", "error");
        setIsDeleting(false);
        return;
      }
    } catch {
      showToast("Network error while deleting account", "error");
      setIsDeleting(false);
      return;
    }
    await logout();
    if (typeof window !== "undefined") {
      localStorage.clear();
      window.location.href = "/login";
    } else {
      router.push("/login");
    }
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
  const joinDate = user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "Unknown";

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-5 pb-36 md:pb-24">
      <Toast {...toast} />

      {/* ── Page Header ── */}
      <div className="flex items-center gap-3 px-1">
        <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{t.settingsTitle}</h1>
      </div>

      {/* ── Account Card ── */}
      <Link
        href="/profile"
        className="flex items-center gap-3 sm:gap-4 bg-white dark:bg-[#111815] border border-slate-200 dark:border-emerald-950/80 rounded-3xl p-3 sm:p-5 shadow-sm hover:shadow-md transition-shadow group animate-fade-in"
      >
        <AvatarBadge
          src={profile?.avatarUrl || currentUser?.avatarUrl}
          name={profile?.displayName || currentUser?.displayName}
          rank={userRank}
          badge={userBadge}
          size="md"
          showCrown={false}
          showRibbon={false}
        />
        <div className="min-w-0 flex-1">
          <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate group-hover:text-emerald-600 transition-colors">
            {profile?.displayName || currentUser?.displayName || "Your Name"}
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-500 truncate">{currentUser?.email}</p>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
            {userBadge.tier} · Member since {joinDate}
          </p>
        </div>
        <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 transition-colors shrink-0" />
      </Link>

      {/* ── Account Settings ── */}
      <SettingsSection title={t.account}>
        <ExpandableRow
          icon={<User className="w-4 h-4" />}
          label={t.accountInfo}
          isExpanded={!!expandedSections.account}
          onToggle={() => toggleSection("account")}
        >
          <div className="space-y-3">
            <div className="p-3 sm:p-4 rounded-2xl bg-slate-50 dark:bg-dark-elevated border border-slate-200/80 dark:border-dark-border space-y-3">
              {[
                { icon: <Mail className="w-3.5 h-3.5 text-slate-400" />, label: "Email", value: currentUser?.email || "Not set" },
                { icon: <Smartphone className="w-3.5 h-3.5 text-slate-400" />, label: "Phone", value: profile?.phone || "Not linked" },
                { icon: <MapPin className="w-3.5 h-3.5 text-slate-400" />, label: "Location", value: profile?.city || "Not set" },
                { icon: <Calendar className="w-3.5 h-3.5 text-slate-400" />, label: "Joined", value: joinDate },
                { icon: <Award className="w-3.5 h-3.5 text-slate-400" />, label: "Membership", value: profile?.membershipNumber || "TRV-0000", bold: true },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {item.icon}
                    <span className="text-xs text-slate-500">{item.label}</span>
                  </div>
                  <span className={`text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[55%] text-right ${(item as any).bold ? "text-emerald-600 dark:text-emerald-400 font-bold" : ""}`}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </ExpandableRow>

        <ExpandableRow
          icon={<Pencil className="w-4 h-4" />}
          label="Edit Profile & Lifestyle"
          iconBg="bg-amber-100/70 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200/50 dark:border-amber-800/40"
          isExpanded={!!expandedSections.editProfile}
          onToggle={() => toggleSection("editProfile")}
        >
          <form onSubmit={handleSaveProfile} className="p-3 sm:p-5 rounded-2xl bg-slate-50 dark:bg-dark-elevated border border-slate-200/80 dark:border-dark-border space-y-4">
            {/* Display Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Display Name *
              </label>
              <input
                required
                type="text"
                value={editDisplayName}
                onChange={(e) => setEditDisplayName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-card px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            {/* City / Location */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                City / Location
              </label>
              <input
                type="text"
                placeholder="e.g. Hyderabad, San Francisco"
                value={editCity}
                onChange={(e) => setEditCity(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-card px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Gender
              </label>
              <select
                value={editGender}
                onChange={(e) => setEditGender(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-card px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Others</option>
                <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
              </select>
            </div>

            {/* Short Bio */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Short Bio
              </label>
              <textarea
                rows={2}
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder="A bit about yourself and your travel vibe..."
                className="w-full rounded-xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-card p-3 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
              />
            </div>

            {/* LinkedIn URL */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                <Linkedin className="w-3.5 h-3.5 text-[#0A66C2]" />
                <span>LinkedIn Profile URL</span>
              </label>
              <input
                type="url"
                placeholder="https://linkedin.com/in/username"
                value={editLinkedinUrl}
                onChange={(e) => setEditLinkedinUrl(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-card px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Only the LinkedIn logo will be displayed on your public profile.
              </span>
            </div>

            {/* Lifestyle & Habits Section */}
            <div className="pt-2 border-t border-slate-200/80 dark:border-dark-border space-y-3">
              <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                Lifestyle &amp; Habits (Badges)
              </span>

              {/* Smoking Habit */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Smoking Habit
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "NON_SMOKER", label: "🚭 Non-Smoker" },
                    { value: "OCCASIONAL", label: "🚬 Social Smoker" },
                    { value: "REGULAR", label: "💨 Regular Smoker" },
                    { value: "PREFER_NOT_TO_SAY", label: "🤐 Prefer not to say" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setEditSmokingHabit(opt.value)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition text-left ${
                        editSmokingHabit === opt.value
                          ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 text-emerald-800 dark:text-emerald-300 shadow-xs"
                          : "bg-white dark:bg-dark-card border-slate-200 dark:border-dark-border text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Drinking Habit */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Drinking Habit
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "NON_DRINKER", label: "🧃 Non-Drinker" },
                    { value: "SOCIAL", label: "🥂 Social Drinker" },
                    { value: "REGULAR", label: "🍷 Regular Drinker" },
                    { value: "PREFER_NOT_TO_SAY", label: "🤐 Prefer not to say" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setEditDrinkingHabit(opt.value)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition text-left ${
                        editDrinkingHabit === opt.value
                          ? "bg-teal-50 dark:bg-teal-950/60 border-teal-400 text-teal-800 dark:text-teal-300 shadow-xs"
                          : "bg-white dark:bg-dark-card border-slate-200 dark:border-dark-border text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dietary Preference */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Dietary Preference
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "PURE_VEG", label: "🥗 Pure Veg" },
                    { value: "EGGETARIAN", label: "🍳 Eggetarian" },
                    { value: "NON_VEG", label: "🍗 Non-Veg" },
                    { value: "VEGAN", label: "🥑 Vegan" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setEditDietaryPreference(opt.value)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition text-left ${
                        editDietaryPreference === opt.value
                          ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 text-emerald-800 dark:text-emerald-300 shadow-xs"
                          : "bg-white dark:bg-dark-card border-slate-200 dark:border-dark-border text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Privacy option: Visible to others or not */}
              <label className="flex items-start justify-between gap-3 p-3 rounded-xl bg-white dark:bg-dark-card border border-slate-200/80 dark:border-dark-border cursor-pointer mt-2">
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Show Lifestyle Badges on Public Profile
                  </span>
                  <span className="text-[10px] text-slate-500 block leading-relaxed">
                    When enabled, other travelers visiting your profile can view your lifestyle badges (drinking, smoking, diet). When disabled, only you can see them.
                  </span>
                </div>
                <ToggleSwitch
                  checked={editShowLifestylePublic}
                  onChange={setEditShowLifestylePublic}
                  color="bg-emerald-500"
                />
              </label>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={savingProfile}
                className="px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
              >
                <span>{savingProfile ? "Saving..." : "Save Profile Details"}</span>
              </button>
            </div>
          </form>
        </ExpandableRow>


        <SettingsRow
          icon={<KeyRound className="w-4 h-4" />}
          label={t.changePassword}
          sublabel={t.changePasswordSub}
          onClick={() => setShowPasswordModal(true)}
        />

        <ExpandableRow
          icon={<MailCheck className="w-4 h-4" />}
          label={t.emailPrefs}
          iconBg="bg-blue-100/70 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-200/50 dark:border-blue-800/40"
          isExpanded={!!expandedSections.emailPrefs}
          onToggle={() => toggleSection("emailPrefs")}
        >
          <div className="p-3 sm:p-4 rounded-2xl bg-slate-50 dark:bg-dark-elevated border border-slate-200/80 dark:border-dark-border space-y-4">
            {[
              { key: "activityDigest", label: "Weekly Activity Digest", desc: "Summary of activities in your area" },
              { key: "newCompanions", label: "New Companion Alerts", desc: "When someone wants to connect" },
              { key: "travelUpdates", label: "Travel Plan Updates", desc: "Changes to trips you're part of" },
              { key: "productNews", label: "Product News & Tips", desc: "New features and travel tips" },
            ].map((item) => (
              <label key={item.key} className="flex items-start justify-between gap-3 cursor-pointer">
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">{item.label}</span>
                  <span className="text-[10px] text-slate-500 block">{item.desc}</span>
                </div>
                <ToggleSwitch
                  checked={emailPrefs[item.key as keyof typeof emailPrefs]}
                  onChange={(val) => setEmailPrefs(prev => ({ ...prev, [item.key]: val }))}
                  color="bg-blue-500"
                />
              </label>
            ))}
          </div>
        </ExpandableRow>
      </SettingsSection>

      {/* ── Notifications ── */}
      <SettingsSection title={t.pushNotifs}>
        <ExpandableRow
          icon={<Bell className="w-4 h-4" />}
          label={t.pushNotifs}
          iconBg="bg-blue-100/70 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-200/50 dark:border-blue-800/40"
          isExpanded={!!expandedSections.pushNotifs}
          onToggle={() => toggleSection("pushNotifs")}
        >
          <div className="p-3 sm:p-4 rounded-2xl bg-slate-50 dark:bg-dark-elevated border border-slate-200/80 dark:border-dark-border space-y-4">
            {[
              { key: "activityInvites", label: "Activity Invites", desc: "When someone invites you to an activity", icon: <Activity className="w-3.5 h-3.5 text-emerald-500" /> },
              { key: "tripRequests", label: "Trip Requests", desc: "Travel companion requests and updates", icon: <Plane className="w-3.5 h-3.5 text-amber-500" /> },
              { key: "messages", label: "New Messages", desc: "Chat messages from companions", icon: <MessageCircle className="w-3.5 h-3.5 text-blue-500" /> },
              { key: "companions", label: "Companion Matches", desc: "When someone accepts your request", icon: <Heart className="w-3.5 h-3.5 text-rose-500" /> },
              { key: "reminders", label: "Activity Reminders", desc: "Upcoming activity and trip reminders", icon: <Bell className="w-3.5 h-3.5 text-violet-500" /> },
              { key: "marketing", label: "Tips & Updates", desc: "Product updates and travel tips", icon: <Info className="w-3.5 h-3.5 text-slate-400" /> },
            ].map((item) => (
              <label key={item.key} className="flex items-start justify-between gap-3 cursor-pointer">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="mt-0.5 shrink-0">{item.icon}</div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">{item.label}</span>
                    <span className="text-[10px] text-slate-500 block">{item.desc}</span>
                  </div>
                </div>
                <ToggleSwitch
                  checked={notifSettings[item.key as keyof typeof notifSettings]}
                  onChange={(val) => setNotifSettings(prev => ({ ...prev, [item.key]: val }))}
                />
              </label>
            ))}
          </div>
        </ExpandableRow>
      </SettingsSection>

      {/* ── Privacy & Discovery ── */}
      <SettingsSection title={t.privacyDiscovery}>
        <ExpandableRow
          icon={<Eye className="w-4 h-4" />}
          label={t.privacyDiscovery}
          isExpanded={!!expandedSections.privacy}
          onToggle={() => toggleSection("privacy")}
        >
          <div className="p-3 sm:p-4 rounded-2xl bg-slate-50 dark:bg-dark-elevated border border-slate-200/80 dark:border-dark-border space-y-3">
            <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block">Connection Intent &amp; Preferences</span>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Declare what type of connections you are open to.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-1">
              {[
                { key: "friendship", label: "Friendship" },
                { key: "activityPartner", label: "Activity Partner" },
                { key: "travel", label: "Travel Partner" },
                { key: "dating", label: "Open to Dating" },
              ].map((item) => (
                <label key={item.key} className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={connPrefs[item.key as keyof typeof connPrefs]}
                    onChange={(e) => setConnPrefs({ ...connPrefs, [item.key]: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-start justify-between gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl bg-slate-50 dark:bg-[#16201b] border border-slate-200/80 dark:border-emerald-950/60 cursor-pointer">
              <div className="space-y-1 min-w-0">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">Show in Public Discovery Feed</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block leading-relaxed">
                  Allow other verified travelers to discover you.
                </span>
              </div>
              <ToggleSwitch checked={discoveryVisible} onChange={setDiscoveryVisible} />
            </label>
            <label className="flex items-start justify-between gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl bg-slate-50 dark:bg-[#16201b] border border-slate-200/80 dark:border-emerald-950/60 cursor-pointer">
              <div className="space-y-1 min-w-0">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">Hide Exact Contact Details</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block leading-relaxed">
                  Only reveal contact info after mutual acceptance.
                </span>
              </div>
              <ToggleSwitch checked={hideContactDetails} onChange={setHideContactDetails} />
            </label>
          </div>

          <div className="pt-1 flex justify-end">
            <button
              type="button"
              onClick={handleSavePrivacy}
              className="px-5 sm:px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all"
            >
              {t.savePreferences}
            </button>
          </div>
        </ExpandableRow>

        <ExpandableRow
          icon={<CircleUserRound className="w-4 h-4" />}
          label={t.onlineStatus}
          iconBg="bg-teal-100/70 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border-teal-200/50 dark:border-teal-800/40"
          isExpanded={!!expandedSections.onlineStatus}
          onToggle={() => toggleSection("onlineStatus")}
        >
          <div className="p-3 sm:p-4 rounded-2xl bg-slate-50 dark:bg-dark-elevated border border-slate-200/80 dark:border-dark-border space-y-4">
            {[
              { key: "showOnlineStatus", label: "Show Online Status", desc: "Let others see when you're active" },
              { key: "showLastSeen", label: "Show Last Seen", desc: "Display your last active time" },
              { key: "readReceipts", label: "Read Receipts", desc: "Show others when you've read their messages" },
              { key: "allowProfileSharing", label: "Allow Profile Sharing", desc: "Others can share your profile" },
              { key: "showActivityHistory", label: "Show Activity History", desc: "Display your past activities" },
              { key: "allowLocationInChat", label: "Location Sharing in Chat", desc: "Allow sharing live location" },
            ].map((item) => (
              <label key={item.key} className="flex items-start justify-between gap-3 cursor-pointer">
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">{item.label}</span>
                  <span className="text-[10px] text-slate-500 block">{item.desc}</span>
                </div>
                <ToggleSwitch
                  checked={privacySettings[item.key as keyof typeof privacySettings]}
                  onChange={(val) => setPrivacySettings(prev => ({ ...prev, [item.key]: val }))}
                  color="bg-teal-500"
                />
              </label>
            ))}
          </div>
        </ExpandableRow>

        <SettingsRow
          icon={<UserX className="w-4 h-4" />}
          label={t.blockedUsers}
          sublabel="Manage users you've blocked"
          iconBg="bg-rose-100/70 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200/50 dark:border-rose-800/40"
          onClick={() => { setShowBlockedModal(true); fetchBlockedUsers(); }}
        />
      </SettingsSection>

      {/* ── Security ── */}
      <SettingsSection title={t.security}>
        <SettingsRow icon={<Lock className="w-4 h-4" />} label={t.securityE2EE} sublabel="End-to-end encryption details" onClick={() => setShowSecurityModal(true)} />
        <SettingsRow icon={<Shield className="w-4 h-4" />} label={t.safetyCenter} sublabel="Community guidelines and safety tools" onClick={() => setShowSafetyModal(true)} />
      </SettingsSection>

      {/* ── Appearance & Language ── */}
      <SettingsSection title={t.appearance}>
        <div
          role="button"
          tabIndex={0}
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setTheme(resolvedTheme === "dark" ? "light" : "dark");
            }
          }}
          className="w-full flex items-center justify-between px-3 py-3 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors cursor-pointer select-none"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100/70 dark:bg-slate-800/60 flex items-center justify-center text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/40">
              {resolvedTheme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </div>
            <div className="text-left">
              <span className="text-sm font-semibold block">{t.darkMode}</span>
              <span className="text-[10px] text-slate-400 block">{resolvedTheme === "dark" ? "On" : "Off"}</span>
            </div>
          </div>
          <ToggleSwitch checked={resolvedTheme === "dark"} onChange={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")} />
        </div>

        <ExpandableRow
          icon={<Languages className="w-4 h-4" />}
          label={t.language}
          iconBg="bg-indigo-100/70 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-200/50 dark:border-indigo-800/40"
          isExpanded={!!expandedSections.language}
          onToggle={() => toggleSection("language")}
        >
          <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-50 dark:bg-dark-elevated border border-slate-200/80 dark:border-dark-border">
            <div className="grid grid-cols-2 gap-2">
              {[
                { code: "en", label: "English", native: "English" },
                { code: "hi", label: "Hindi", native: "हिन्दी" },
                { code: "te", label: "Telugu", native: "తెలుగు" },
                { code: "ta", label: "Tamil", native: "தமிழ்" },
                { code: "kn", label: "Kannada", native: "ಕನ್ನಡ" },
              ].map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => { setLanguage(lang.code as LanguageCode); showToast(`Language set to ${lang.label}`); }}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    language === lang.code
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 border border-transparent"
                  }`}
                >
                  <div className="flex items-baseline gap-1.5 min-w-0">
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{lang.native}</span>
                    <span className="text-[10px] text-slate-400 font-normal">({lang.label})</span>
                  </div>
                  {language === lang.code && <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 ml-1" />}
                </button>
              ))}
            </div>
          </div>
        </ExpandableRow>
      </SettingsSection>

      {/* ── Data & Storage ── */}
      <SettingsSection title={t.dataStorage}>
        <SettingsRow
          icon={<HardDrive className="w-4 h-4" />}
          label={t.storageUsage}
          sublabel={`Local cache: ${getStorageUsage()}`}
          iconBg="bg-sky-100/70 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border-sky-200/50 dark:border-sky-800/40"
          trailing={<span className="text-[10px] font-bold text-sky-600">{getStorageUsage()}</span>}
          onClick={() => {}}
        />
        <SettingsRow
          icon={<Download className="w-4 h-4" />}
          label={exporting ? "Downloading..." : t.downloadData}
          sublabel="Export your profile and activities as JSON"
          iconBg="bg-indigo-100/70 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-200/50 dark:border-indigo-800/40"
          onClick={handleExportData}
        />
        <SettingsRow
          icon={<Trash2 className="w-4 h-4" />}
          label={t.clearCache}
          sublabel="Free up space by clearing cached data"
          iconBg="bg-orange-100/70 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 border-orange-200/50 dark:border-orange-800/40"
          onClick={handleClearCache}
        />
      </SettingsSection>

      {/* ── Help & Support ── */}
      <SettingsSection title={t.helpSupport}>
        <SettingsRow
          icon={<HelpCircle className="w-4 h-4" />}
          label={t.helpCenter}
          sublabel="Guidelines, FAQs, and companion safety"
          iconBg="bg-blue-100/70 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-200/50 dark:border-blue-800/40"
          onClick={() => setShowSafetyModal(true)}
        />
        <SettingsRow
          icon={<MessageCircle className="w-4 h-4" />}
          label={t.contactSupport}
          sublabel="support@travally.in"
          iconBg="bg-green-100/70 dark:bg-green-950/60 text-green-600 dark:text-green-400 border-green-200/50 dark:border-green-800/40"
          onClick={() => {
            if (typeof window !== "undefined") window.location.href = "mailto:support@travally.in?subject=Help%20Request";
          }}
        />
        <SettingsRow
          icon={<FileText className="w-4 h-4" />}
          label={t.termsOfService}
          sublabel="Read our terms and conditions"
          iconBg="bg-slate-100/70 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200/50 dark:border-slate-700/40"
          onClick={() => setShowTermsModal(true)}
        />
        <SettingsRow
          icon={<Shield className="w-4 h-4" />}
          label={t.privacyPolicy}
          sublabel="How we protect and handle your data"
          iconBg="bg-slate-100/70 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200/50 dark:border-slate-700/40"
          onClick={() => setShowPrivacyPolicyModal(true)}
        />
      </SettingsSection>

      {/* ── About ── */}
      <SettingsSection title={t.about}>
        <ExpandableRow
          icon={<Info className="w-4 h-4" />}
          label={t.aboutTravally}
          iconBg="bg-slate-100/70 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200/50 dark:border-slate-700/40"
          isExpanded={!!expandedSections.about}
          onToggle={() => toggleSection("about")}
        >
          <div className="p-3 sm:p-4 rounded-2xl bg-slate-50 dark:bg-dark-elevated border border-slate-200/80 dark:border-dark-border space-y-2.5">
            {[
              { label: "App Version", value: "1.0.0 (Beta)" },
              { label: "Build", value: "2026.10" },
              { label: "Made with", value: "❤️ in India" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between text-xs py-0.5">
                <span className="text-slate-500">{item.label}</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{item.value}</span>
              </div>
            ))}
          </div>
        </ExpandableRow>
      </SettingsSection>

      {/* ── Account Actions ── */}
      <SettingsSection title={t.accountActions} className="border-rose-200/60 dark:border-rose-950/50">
        <SettingsRow
          icon={<LogOut className="w-4 h-4" />}
          label={t.signOut}
          sublabel="Log out of your current session"
          iconBg="bg-rose-100/70 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200/50 dark:border-rose-900/40"
          danger
          onClick={handleLogout}
        />
        <SettingsRow
          icon={<UserX className="w-4 h-4" />}
          label={t.deactivateOrDelete}
          sublabel="Temporarily pause or permanently remove your account and all data"
          iconBg="bg-rose-100/70 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200/50 dark:border-rose-900/40"
          danger
          onClick={() => {
            setClosureTab("deactivate");
            setDeleteConfirmText("");
            setShowAccountClosureModal(true);
          }}
        />
      </SettingsSection>

      {/* ══════════════ MODALS ══════════════ */}

      {/* ── Change Password Modal ── */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setShowPasswordModal(false)}>
          <div className="bg-white dark:bg-[#111815] border border-slate-200 dark:border-emerald-950/80 rounded-3xl p-5 sm:p-8 space-y-5 shadow-2xl max-w-md w-full animate-slide-up relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowPasswordModal(false)} className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <div className="w-4 h-4 text-center leading-none">✕</div>
            </button>
            <div className="space-y-1 pr-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-emerald-600" />
                Change Password
              </h2>
              <p className="text-xs text-slate-500">Set a new password for your account.</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Current Password</label>
                <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Enter current password" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#16201b] text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">New Password</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min 6 characters" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#16201b] text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Confirm New Password</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Re-enter new password" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#16201b] text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowPasswordModal(false)} className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors">Cancel</button>
              <button onClick={handleChangePassword} disabled={passwordSaving || !newPassword || !confirmPassword} className={`flex-1 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all ${!passwordSaving && newPassword && confirmPassword ? "bg-emerald-600 hover:bg-emerald-500 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed"}`}>
                {passwordSaving ? "Saving..." : "Update Password"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Blocked Users Modal ── */}
      {showBlockedModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setShowBlockedModal(false)}>
          <div className="bg-white dark:bg-[#111815] border border-slate-200 dark:border-emerald-950/80 rounded-3xl p-5 sm:p-8 space-y-5 shadow-2xl max-w-md w-full animate-slide-up relative max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowBlockedModal(false)} className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <div className="w-4 h-4 text-center leading-none">✕</div>
            </button>
            <div className="space-y-1 pr-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserX className="w-5 h-5 text-rose-500" />
                Blocked Users
              </h2>
              <p className="text-xs text-slate-500">Blocked users cannot see your profile or activities.</p>
            </div>
            {blockedLoading ? (
              <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : blockedUsers.length === 0 ? (
              <div className="text-center py-8">
                <UserX className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-500">No blocked users</p>
              </div>
            ) : (
              <div className="space-y-2">
                {blockedUsers.map((block) => (
                  <div key={block.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-[#16201b] border border-slate-200/80 dark:border-emerald-950/60">
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                        {block.blocked?.displayName || block.blocked?.email || "Unknown User"}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        Blocked {block.createdAt ? new Date(block.createdAt).toLocaleDateString() : ""}
                      </span>
                    </div>
                    <button
                      onClick={() => handleUnblock(block.blockedId)}
                      className="px-3 py-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 text-[10px] font-bold transition-colors shrink-0"
                    >
                      Unblock
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setShowBlockedModal(false)} className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors">
              Close
            </button>
          </div>
        </div>
      )}

      {/* ── Security Modal ── */}
      {showSecurityModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setShowSecurityModal(false)}>
          <div className="bg-white dark:bg-[#111815] border border-slate-200 dark:border-emerald-950/80 rounded-3xl p-5 sm:p-8 space-y-6 shadow-2xl max-w-md w-full animate-slide-up relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowSecurityModal(false)} className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <div className="w-4 h-4 text-center leading-none">✕</div>
            </button>
            <div className="space-y-1 pr-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-emerald-600" /> End-to-End Encryption
              </h2>
              <p className="text-xs text-slate-500">Travally ensures your direct communications remain private.</p>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> <span>Session Shield Active</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Your session is cryptographically signed and stored in a secure HttpOnly cookie. Messages in confirmed companion rooms use WebCrypto end-to-end encryption.
              </p>
            </div>
            <button onClick={() => setShowSecurityModal(false)} className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition-colors">Close</button>
          </div>
        </div>
      )}

      {/* ── Safety Center & Rules Modal ── */}
      {showSafetyModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setShowSafetyModal(false)}>
          <div className="bg-white dark:bg-[#111815] border border-slate-200 dark:border-emerald-950/80 rounded-3xl p-5 sm:p-7 shadow-2xl max-w-xl w-full max-h-[85vh] flex flex-col animate-slide-up relative" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-emerald-950/60 shrink-0">
              <div className="space-y-0.5">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" /> Safety Center & Guidelines
                </h2>
                <p className="text-[11px] text-slate-500">Travally trust, precautions &amp; community safety standards</p>
              </div>
              <button onClick={() => setShowSafetyModal(false)} className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <div className="w-4 h-4 text-center leading-none">✕</div>
              </button>
            </div>

            <div className="overflow-y-auto space-y-4 py-4 pr-1 text-xs">
              {/* Guidelines */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/50 space-y-2">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                  <HeartHandshake className="w-4 h-4 text-emerald-600" />
                  <span>Core Community Standards</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                  <strong>100% Non-Commercial:</strong> Travally is strictly for authentic shared experiences. Paid escorting, commercial booking, or spam solicitation is prohibited and results in immediate permanent ban.
                </p>
              </div>

              {/* In-Person Meeting Safety */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>In-Person Meeting Checklist</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#16201b] border border-slate-200/70 dark:border-emerald-950/60 space-y-1">
                    <span className="font-bold text-slate-800 dark:text-slate-200">Meet in Public Spaces</span>
                    <p className="text-slate-500 leading-relaxed">Always meet at populated cafes, theaters, or parks for first encounters.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#16201b] border border-slate-200/70 dark:border-emerald-950/60 space-y-1">
                    <span className="font-bold text-slate-800 dark:text-slate-200">Inform a Close Contact</span>
                    <p className="text-slate-500 leading-relaxed">Share your plans, destination, and companion info with a friend or family.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#16201b] border border-slate-200/70 dark:border-emerald-950/60 space-y-1">
                    <span className="font-bold text-slate-800 dark:text-slate-200">Independent Transport</span>
                    <p className="text-slate-500 leading-relaxed">Arrive and depart independently. Avoid getting into private cars on first meetings.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#16201b] border border-slate-200/70 dark:border-emerald-950/60 space-y-1">
                    <span className="font-bold text-slate-800 dark:text-slate-200">Trust Your Gut</span>
                    <p className="text-slate-500 leading-relaxed">If anything feels wrong, excuse yourself immediately. Safety comes first.</p>
                  </div>
                </div>
              </div>

              {/* Travel Precautions */}
              <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 space-y-1.5">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs">
                  <Compass className="w-4 h-4 text-amber-600" />
                  <span>Travel Companion Tips</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                  Schedule a video call prior to non-refundable trips. Always book your flights and hotels directly so you stay fully in control of your bookings.
                </p>
              </div>

              {/* Reporting & Block */}
              <div className="p-3.5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/70 dark:border-rose-900/40 space-y-1.5">
                <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold text-xs">
                  <Flag className="w-4 h-4 text-rose-600" />
                  <span>Reporting &amp; Instant Block</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                  Use the Flag icon on any chat or card to report suspicious behavior directly to our moderation team. You can block any member instantly via their profile or settings.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-emerald-950/60 shrink-0">
              <button onClick={() => setShowSafetyModal(false)} className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-colors">
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Terms of Service Modal ── */}
      {showTermsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setShowTermsModal(false)}>
          <div className="bg-white dark:bg-[#111815] border border-slate-200 dark:border-emerald-950/80 rounded-3xl p-5 sm:p-7 shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col animate-slide-up relative" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-emerald-950/60 shrink-0">
              <div className="space-y-0.5">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-600" /> Terms of Service
                </h2>
                <p className="text-[11px] text-slate-500">Travally Platform Terms &amp; Conditions</p>
              </div>
              <button onClick={() => setShowTermsModal(false)} className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <div className="w-4 h-4 text-center leading-none">✕</div>
              </button>
            </div>

            <div className="overflow-y-auto space-y-3 py-4 pr-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#16201b] border border-slate-200/70 dark:border-emerald-950/60 space-y-1">
                <span className="font-bold text-slate-900 dark:text-white block">1. Acceptance of Terms</span>
                <p className="text-[11px]">By accessing or using Travally, you agree to comply with and be bound by these Terms of Service. If you disagree with any portion, do not use the service.</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#16201b] border border-slate-200/70 dark:border-emerald-950/60 space-y-1">
                <span className="font-bold text-slate-900 dark:text-white block">2. Self-Responsibility &amp; Assumption of Risk</span>
                <p className="text-[11px]">Travally provides an online platform to facilitate meeting companions for social activities and travels. Users voluntarily decide to interact and meet in person at their own sole risk.</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#16201b] border border-slate-200/70 dark:border-emerald-950/60 space-y-1">
                <span className="font-bold text-slate-900 dark:text-white block">3. No Commercial or Paid Companionship</span>
                <p className="text-[11px]">Travally is free of charge for community members. Users may not demand, offer, or receive financial compensation for companionship, escorting, or event hosting.</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#16201b] border border-slate-200/70 dark:border-emerald-950/60 space-y-1">
                <span className="font-bold text-slate-900 dark:text-white block">4. Platform Limitation of Liability</span>
                <p className="text-[11px]">Travally does not organize offline events or operate transportation or hospitality services. We expressly disclaim any liability for injuries, losses, disputes, or cancellations.</p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-emerald-950/60 shrink-0">
              <button onClick={() => setShowTermsModal(false)} className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-colors">
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Privacy Policy Modal ── */}
      {showPrivacyPolicyModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setShowPrivacyPolicyModal(false)}>
          <div className="bg-white dark:bg-[#111815] border border-slate-200 dark:border-emerald-950/80 rounded-3xl p-5 sm:p-7 shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col animate-slide-up relative" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-emerald-950/60 shrink-0">
              <div className="space-y-0.5">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-emerald-600" /> Privacy Policy
                </h2>
                <p className="text-[11px] text-slate-500">How we protect, store, and manage your data</p>
              </div>
              <button onClick={() => setShowPrivacyPolicyModal(false)} className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <div className="w-4 h-4 text-center leading-none">✕</div>
              </button>
            </div>

            <div className="overflow-y-auto space-y-3 py-4 pr-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#16201b] border border-slate-200/70 dark:border-emerald-950/60 space-y-1">
                <span className="font-bold text-slate-900 dark:text-white block">1. Data Minimization</span>
                <p className="text-[11px]">We only store information required to deliver your Travally account, such as your profile display name, bio, and travel interests.</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#16201b] border border-slate-200/70 dark:border-emerald-950/60 space-y-1">
                <span className="font-bold text-slate-900 dark:text-white block">2. Privacy &amp; Contact Controls</span>
                <p className="text-[11px]">Your exact contact details remain hidden from other users unless you mutually accept a connection. You can toggle public feed discovery anytime in Settings.</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#16201b] border border-slate-200/70 dark:border-emerald-950/60 space-y-1">
                <span className="font-bold text-slate-900 dark:text-white block">3. Cookies &amp; Sessions</span>
                <p className="text-[11px]">Authentication is secured with cryptographic HttpOnly cookies. We do not sell your personal data or sell advertising tracking cookies to third parties.</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#16201b] border border-slate-200/70 dark:border-emerald-950/60 space-y-1">
                <span className="font-bold text-slate-900 dark:text-white block">4. Your Rights &amp; Data Deletion</span>
                <p className="text-[11px]">You can download a complete copy of your profile data or permanently delete your account directly through Settings with immediate effect.</p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-emerald-950/60 shrink-0">
              <button onClick={() => setShowPrivacyPolicyModal(false)} className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-colors">
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Unified Deactivate or Delete Account Modal ── */}
      {showAccountClosureModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => { setShowAccountClosureModal(false); setDeleteConfirmText(""); }}>
          <div className="bg-white dark:bg-[#111815] border border-slate-200 dark:border-emerald-950/80 rounded-3xl p-5 sm:p-7 shadow-2xl max-w-md w-full animate-slide-up relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => { setShowAccountClosureModal(false); setDeleteConfirmText(""); }} className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <div className="w-4 h-4 text-center leading-none">✕</div>
            </button>

            {/* Header */}
            <div className="space-y-1.5 pr-8">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserX className="w-5 h-5 text-rose-500 shrink-0" /> Account Management
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 leading-normal">
                Temporarily deactivate or permanently delete your account.
              </p>
            </div>

            {/* Switch Tabs */}
            <div className="flex bg-slate-100 dark:bg-[#16201b] p-1 rounded-2xl gap-1 mt-4">
              <button
                type="button"
                onClick={() => setClosureTab("deactivate")}
                className={`flex-1 py-2 px-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all text-center truncate ${
                  closureTab === "deactivate"
                    ? "bg-white dark:bg-[#202c25] text-amber-600 dark:text-amber-400 shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                Deactivate (Temporary)
              </button>
              <button
                type="button"
                onClick={() => setClosureTab("delete")}
                className={`flex-1 py-2 px-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all text-center truncate ${
                  closureTab === "delete"
                    ? "bg-white dark:bg-[#202c25] text-rose-600 dark:text-rose-400 shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                Delete (Permanent)
              </button>
            </div>

            {/* Tab 1: Deactivate */}
            {closureTab === "deactivate" && (
              <div className="space-y-4 animate-fade-in mt-4">
                <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 space-y-2.5">
                  <p className="font-bold text-xs flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    When you deactivate:
                  </p>
                  <ul className="space-y-1.5 pl-4 list-disc text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    <li>Your profile is hidden from all searches and public feeds</li>
                    <li>Active companion requests are paused</li>
                    <li>Your chat history and connections are safely saved</li>
                    <li>You can reactivate anytime simply by signing back in</li>
                  </ul>
                </div>
                <div className="flex gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAccountClosureModal(false)}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeactivate}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md transition-colors"
                  >
                    Deactivate Account
                  </button>
                </div>
              </div>
            )}

            {/* Tab 2: Delete Permanent */}
            {closureTab === "delete" && (
              <div className="space-y-4 animate-fade-in mt-4">
                <div className="p-4 rounded-2xl bg-rose-50/80 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 text-rose-800 dark:text-rose-300 space-y-2.5">
                  <p className="font-bold text-xs flex items-center gap-1.5">
                    <Trash2 className="w-4 h-4 text-rose-600 shrink-0" />
                    Permanent Database Deletion:
                  </p>
                  <ul className="space-y-1.5 pl-4 list-disc text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    <li>Irreversibly deletes your account &amp; user profile from database</li>
                    <li>Deletes all your organized activities, trips &amp; joined requests</li>
                    <li>Purges all messages, notifications, and companion records</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Type <span className="font-mono text-rose-600 bg-rose-50 dark:bg-rose-950/30 px-1.5 py-0.5 rounded font-black">DELETE</span> to confirm permanent deletion
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="Type DELETE here"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#16201b] text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
                  />
                </div>

                <div className="flex gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => { setShowAccountClosureModal(false); setDeleteConfirmText(""); }}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirmText !== "DELETE" || isDeleting}
                    className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs shadow-md transition-all ${
                      deleteConfirmText === "DELETE" && !isDeleting
                        ? "bg-rose-600 hover:bg-rose-700 text-white"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    {isDeleting ? "Deleting..." : "Delete Forever"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
