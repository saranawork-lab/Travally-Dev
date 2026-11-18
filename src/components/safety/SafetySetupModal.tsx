"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  X,
  User,
  Users,
  Clock,
  MapPin,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Search,
  Share2,
  Copy,
  Link as LinkIcon,
  Phone,
} from "lucide-react";

interface SafetySetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: "ACTIVITY" | "TRAVEL";
  targetId: string;
  targetTitle: string;
  onSuccess: (session: any) => void;
  existingSession?: any;
}

const CHECKIN_INTERVAL_OPTIONS = [
  { value: 20, label: "Every 20 mins", note: "High-activity or night outings" },
  { value: 30, label: "Every 30 mins", note: "Standard safety check-in" },
  { value: 60, label: "Every 1 hour", note: "Recommended for day trips and tours" },
  { value: 120, label: "Every 2 hours", note: "Low-frequency highway travel" },
  { value: "custom", label: "Custom interval", note: "Specify your preferred minutes" },
];

export const SafetySetupModal: React.FC<SafetySetupModalProps> = ({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetTitle,
  onSuccess,
  existingSession,
}) => {
  const [contactMode, setContactMode] = useState<"EXTERNAL" | "Travally">(
    existingSession?.contactUserId ? "EXTERNAL" : "Travally"
  );

  // External Contact fields
  const [contactName, setContactName] = useState(existingSession?.contactName || "");
  const [contactPhone, setContactPhone] = useState(existingSession?.contactPhone || "");

  // Travally User search fields
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [userSearchResults, setUserSearchResults] = useState<any[]>([]);
  const [selectedTravallyUser, setSelectedTravallyUser] = useState<any>(null);

  // Settings
  const [isAuthorized, setIsAuthorized] = useState(
    existingSession ? existingSession.isContactAuthorized : true
  );
  const [selectedInterval, setSelectedInterval] = useState<number | "custom">(
    existingSession?.checkInIntervalMinutes || 30
  );
  const [customMinutes, setCustomMinutes] = useState("45");
  const [enableLocationSharing, setEnableLocationSharing] = useState(
    existingSession ? existingSession.locationSharingEnabled : true
  );

  const [locationStatus, setLocationStatus] = useState<"idle" | "requesting" | "granted" | "denied">("idle");
  const [currentCoords, setCurrentCoords] = useState<{ latitude?: number; longitude?: number; accuracy?: number }>({});
  const [notificationPermission, setNotificationPermission] = useState<"default" | "granted" | "denied">("default");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Post-creation shareable link display
  const [createdSession, setCreatedSession] = useState<any>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Check notification permission
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, [isOpen]);

  // Debounced search for Travally users
  useEffect(() => {
    if (contactMode !== "Travally" || userSearchQuery.trim().length < 2) {
      setUserSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingUsers(true);
      try {
        const res = await fetch(`/api/safety/users?q=${encodeURIComponent(userSearchQuery.trim())}`);
        if (res.ok) {
          const json = await res.json();
          setUserSearchResults(json.users || []);
        }
      } catch (e) {
        console.warn("User search error:", e);
      } finally {
        setIsSearchingUsers(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [userSearchQuery, contactMode]);

  // Request browser location if enabled
  const requestLocation = () => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setLocationStatus("denied");
      return;
    }

    setLocationStatus("requesting");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCurrentCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setLocationStatus("granted");
        setEnableLocationSharing(true);
      },
      (err) => {
        console.warn("Geolocation permission error:", err);
        setLocationStatus("denied");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleRequestNotifications = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        const perm = await Notification.requestPermission();
        setNotificationPermission(perm);
      } catch (e) {
        console.warn("Notification request error:", e);
      }
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let finalName = contactName.trim();
    let contactUserId: string | undefined = undefined;

    if (contactMode === "Travally") {
      if (!selectedTravallyUser) {
        setError("Please select a verified Travally user from the search results.");
        return;
      }
      finalName = selectedTravallyUser.displayName;
      contactUserId = selectedTravallyUser.userId;
    } else {
      if (!finalName) {
        setError("Please provide your emergency contact's name.");
        return;
      }
    }

    if (!isAuthorized) {
      setError("Please authorize sharing your safety status with this emergency contact.");
      return;
    }

    const intervalMinutes =
      selectedInterval === "custom"
        ? Math.max(10, Math.min(240, parseInt(customMinutes, 10) || 30))
        : selectedInterval;

    setIsSubmitting(true);

    try {
      const payload = {
        targetType,
        targetId,
        contactName: finalName,
        contactPhone: contactPhone.trim() || undefined,
        contactUserId,
        isContactAuthorized: isAuthorized,
        checkInIntervalMinutes: intervalMinutes,
        initialLatitude: enableLocationSharing ? currentCoords.latitude : undefined,
        initialLongitude: enableLocationSharing ? currentCoords.longitude : undefined,
        initialAccuracy: enableLocationSharing ? currentCoords.accuracy : undefined,
      };

      const res = await fetch("/api/safety/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to configure safety protection.");
      }

      onSuccess(data.session);

      // If external contact mode, show the generated link immediately so traveler can copy/share it!
      if (contactMode === "EXTERNAL") {
        setCreatedSession(data.session);
      } else {
        onClose();
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const trackingUrl = createdSession?.shareToken
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/safety/live/${createdSession.shareToken}`
    : "";

  const handleCopyLink = () => {
    if (!trackingUrl) return;
    navigator.clipboard.writeText(trackingUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleWebShare = async () => {
    if (!trackingUrl) return;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `Travally Safety Status — ${targetTitle}`,
          text: `Hi ${contactName || "there"}, here is my secure emergency tracking link for "${targetTitle}". No account or app required:`,
          url: trackingUrl,
        });
        return;
      } catch (e) {
        // Fallback to clipboard
      }
    }
    handleCopyLink();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in text-left">
      <div className="w-full max-w-lg bg-white dark:bg-[#0f1713] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-emerald-950/80 max-h-[92vh] flex flex-col overflow-hidden animate-slide-up sm:animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-dark-border bg-slate-50/50 dark:bg-emerald-950/20">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Safety Protection Setup
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[240px] sm:max-w-xs">
                {targetTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* If session was created with external link, display share screen */}
        {createdSession ? (
          <div className="p-6 space-y-5 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Safety Protection Activated!
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm mx-auto leading-relaxed">
                Share this secure link with <strong>{createdSession.contactName}</strong> so they can view your safety status and location without creating a Travally account.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-dark-elevated border border-slate-200 dark:border-dark-border text-left space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Your Secure Emergency Tracking Link:
              </span>
              <div className="p-2.5 rounded-xl bg-white dark:bg-[#121c17] border border-slate-200 dark:border-emerald-950 text-xs font-mono break-all text-emerald-800 dark:text-emerald-300">
                {trackingUrl}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleWebShare}
                className="py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-900/20 active:scale-95 transition flex items-center justify-center gap-1.5"
              >
                <Share2 className="w-4 h-4" />
                <span>Share Link</span>
              </button>

              <button
                type="button"
                onClick={handleCopyLink}
                className="py-3 px-4 rounded-2xl bg-slate-100 dark:bg-dark-elevated hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-extrabold text-xs border border-slate-200 dark:border-dark-border active:scale-95 transition flex items-center justify-center gap-1.5"
              >
                {copiedLink ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? "Copied!" : "Copy Link"}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
            >
              Done — Back to Activity
            </button>
          </div>
        ) : (
          /* Scrollable Form Body */
          <form onSubmit={handleSubmit} className="overflow-y-auto px-5 py-4 space-y-5 text-left text-xs">
            {error && (
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* SECTION A: Emergency Contact Configuration */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wide">
                  A. Emergency Contact
                </h3>
              </div>

              {/* Mode Selector Tabs */}
              <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-100 dark:bg-dark-elevated text-xs">
                <button
                  type="button"
                  onClick={() => setContactMode("Travally")}
                  className={`py-2 px-3 rounded-xl font-bold transition flex items-center justify-center gap-1.5 ${contactMode === "Travally"
                    ? "bg-white dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Travally User</span>
                </button>

                <button
                  type="button"
                  onClick={() => setContactMode("EXTERNAL")}
                  className={`py-2 px-3 rounded-xl font-bold transition flex items-center justify-center gap-1.5 ${contactMode === "EXTERNAL"
                    ? "bg-white dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>External (Share Link)</span>
                </button>


              </div>

              {/* TAB 1: Travally Account Holder */}
              {contactMode === "Travally" && (
                <div className="space-y-2.5 p-3 rounded-2xl bg-slate-50/70 dark:bg-dark-elevated border border-slate-100 dark:border-dark-border">
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                    Search for a verified Travally user. They will receive automated in-app emergency notifications directly in their Travally account.
                  </p>

                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      placeholder="Search by display name or membership #"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-[#121c17] text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    {isSearchingUsers && (
                      <Loader2 className="absolute right-3 top-2.5 w-4 h-4 animate-spin text-emerald-600" />
                    )}
                  </div>

                  {/* Search Results */}
                  {userSearchResults.length > 0 && (
                    <div className="max-h-40 overflow-y-auto space-y-1.5 pt-1">
                      {userSearchResults.map((u) => (
                        <div
                          key={u.userId}
                          onClick={() => {
                            setSelectedTravallyUser(u);
                            setContactName(u.displayName);
                            setUserSearchResults([]);
                          }}
                          className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${selectedTravallyUser?.userId === u.userId
                            ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60"
                            : "border-slate-200 dark:border-dark-border hover:bg-slate-100 dark:hover:bg-slate-800"
                            }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 flex items-center justify-center font-bold text-[11px]">
                              {u.displayName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-bold text-xs text-slate-900 dark:text-white block">
                                {u.displayName}
                              </span>
                              <span className="text-[10px] text-slate-500 block">
                                {u.membershipNumber || "Verified Explorer"}
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-600">Select</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedTravallyUser && (
                    <div className="p-2.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-bold text-xs text-emerald-950 dark:text-emerald-200">
                          Selected: {selectedTravallyUser.displayName}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedTravallyUser(null)}
                        className="text-[11px] text-rose-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: External Contact with Shareable Link */}
              {contactMode === "EXTERNAL" && (
                <div className="space-y-2.5 p-3 rounded-2xl bg-slate-50/70 dark:bg-dark-elevated border border-slate-100 dark:border-dark-border">
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                    Travally will generate a unique, cryptographically secure tracking link. You can send it directly to your contact via WhatsApp, Telegram, or SMS. <strong>They do not need a Travally account.</strong>
                  </p>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Contact Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="e.g. Mom, Rahul, or Arjun Verma"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-[#121c17] text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Contact Phone (Optional)
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        type="tel"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="e.g. +91 9876543210 (for quick calling)"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-[#121c17] text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}



              {/* Explicit Authorization Checkbox */}
              <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAuthorized}
                  onChange={(e) => setIsAuthorized(e.target.checked)}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="text-[11px] text-emerald-950 dark:text-emerald-200 leading-snug">
                  I explicitly authorize Travally to share my trip details, check-in status, and live location with this emergency contact if needed.
                </span>
              </label>
            </div>

            {/* SECTION B: Live Location Sharing */}
            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-dark-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wide">
                    B. Live Location Sharing
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={requestLocation}
                  disabled={locationStatus === "requesting"}
                  className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition flex items-center gap-1 ${locationStatus === "granted"
                    ? "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200"
                    : "bg-slate-100 dark:bg-dark-elevated text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                    }`}
                >
                  {locationStatus === "requesting" ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Detecting...</span>
                    </>
                  ) : locationStatus === "granted" ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Location Active</span>
                    </>
                  ) : (
                    <span>Detect Location</span>
                  )}
                </button>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Enables coordinates sharing via the secure emergency tracking link.
              </p>
            </div>

            {/* SECTION C: Safety Check-in Interval */}
            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-dark-border">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wide">
                  C. Safety Check-in Frequency
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Travally will periodically ask <strong>&quot;Are you safe?&quot;</strong>. If unconfirmed within 5 minutes, an escalation alert is recorded and shared.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {CHECKIN_INTERVAL_OPTIONS.map((opt) => (
                  <button
                    type="button"
                    key={opt.label}
                    onClick={() => setSelectedInterval(opt.value as any)}
                    className={`p-3 rounded-2xl border text-left transition ${selectedInterval === opt.value
                      ? "border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 ring-1 ring-emerald-500"
                      : "border-slate-200 dark:border-dark-border bg-slate-50/50 dark:bg-dark-elevated hover:bg-slate-100 dark:hover:bg-slate-800/60"
                      }`}
                  >
                    <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center justify-between">
                      <span>{opt.label}</span>
                      {selectedInterval === opt.value && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                      {opt.note}
                    </span>
                  </button>
                ))}
              </div>

              {selectedInterval === "custom" && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    Custom interval:
                  </span>
                  <input
                    type="number"
                    min="10"
                    max="240"
                    value={customMinutes}
                    onChange={(e) => setCustomMinutes(e.target.value)}
                    className="w-24 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-elevated text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-[11px] text-slate-500">minutes</span>
                </div>
              )}
            </div>

            {/* SECTION D: Browser Alerts */}
            <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-dark-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wide">
                    D. Browser Alerts
                  </h3>
                </div>
                {notificationPermission !== "granted" ? (
                  <button
                    type="button"
                    onClick={handleRequestNotifications}
                    className="px-3 py-1 rounded-xl text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                  >
                    Enable Alerts
                  </button>
                ) : (
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Allowed
                  </span>
                )}
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-4 border-t border-slate-100 dark:border-dark-border">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold text-sm shadow-lg shadow-emerald-900/20 active:scale-[0.98] transition flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Activating Protection...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>{contactMode === "EXTERNAL" ? "Activate & Generate Link" : "Activate Protection"}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
