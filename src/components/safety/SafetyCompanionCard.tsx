"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  ShieldCheck,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Copy,
  ExternalLink,
  Settings,
  Loader2,
  RefreshCw,
  Share2,
  ShieldX,
  Phone,
  Link as LinkIcon,
} from "lucide-react";
import { SafetySetupModal } from "./SafetySetupModal";
import { EmergencyActiveModal, SOSBackendStatus } from "./EmergencyActiveModal";
import { MissedCheckInBanner } from "./MissedCheckInBanner";

interface SafetyCompanionCardProps {
  targetType: "ACTIVITY" | "TRAVEL";
  targetId: string;
  targetTitle: string;
  isOrganizer: boolean;
  currentUser: any;
  onOpenVerificationModal?: () => void;
}

export const SafetyCompanionCard: React.FC<SafetyCompanionCardProps> = ({
  targetType,
  targetId,
  targetTitle,
  isOrganizer,
  currentUser,
  onOpenVerificationModal,
}) => {
  const [eligibility, setEligibility] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Offline SOS activation fallback state
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [backendSOSStatus, setBackendSOSStatus] = useState<SOSBackendStatus>("PENDING");

  // SOS 3-second press-and-hold states
  const [holdingSOS, setHoldingSOS] = useState(false);
  const [sosProgress, setSosProgress] = useState(0); // 0 to 100
  const holdStartRef = useRef<number>(0);
  const progressAnimRef = useRef<number | null>(null);

  // Geolocation watch id
  const geoWatchIdRef = useRef<number | null>(null);

  // Countdown to next check-in
  const [timeLeftMinutes, setTimeLeftMinutes] = useState<number | null>(null);

  const fetchSession = async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(
        `/api/safety/session?targetType=${targetType}&targetId=${targetId}`
      );
      if (res.ok) {
        const data = await res.json();
        setEligibility(data.eligibility);
        setSession(data.session);

        if (data.session?.sosStatus === "TRIGGERED") {
          setIsEmergencyModalOpen(true);
          setBackendSOSStatus("RECORDED");
        }
      }
    } catch (e) {
      console.error("Error loading safety session:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, [targetId, targetType, currentUser]);

  // Periodic polling for server-side deadline escalation sync
  useEffect(() => {
    if (!session || session.status !== "ACTIVE") return;

    const interval = setInterval(() => {
      fetchSession();
    }, 20000); // 20s poll

    return () => clearInterval(interval);
  }, [session?.id, session?.status]);

  // Calculate countdown to next check-in
  useEffect(() => {
    if (!session?.nextCheckInAt) {
      setTimeLeftMinutes(null);
      return;
    }

    const calcTime = () => {
      const diffMs = new Date(session.nextCheckInAt).getTime() - Date.now();
      const mins = Math.max(0, Math.ceil(diffMs / 60000));
      setTimeLeftMinutes(mins);

      // Trigger browser notification if check-in due within 2 minutes and permitted
      if (mins <= 2 && typeof window !== "undefined" && "Notification" in window) {
        if (Notification.permission === "granted") {
          try {
            new Notification("Travally Safety Check-in Due", {
              body: `Please confirm you are safe for "${targetTitle}".`,
              icon: "/favicon.ico",
            });
          } catch { }
        }
      }
    };

    calcTime();
    const timer = setInterval(calcTime, 30000);
    return () => clearInterval(timer);
  }, [session?.nextCheckInAt, targetTitle]);

  // Web Geolocation watch while location sharing is active
  useEffect(() => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) return;
    if (!session || !session.locationSharingEnabled || session.status !== "ACTIVE" || session.isLinkRevoked) {
      if (geoWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(geoWatchIdRef.current);
        geoWatchIdRef.current = null;
      }
      return;
    }

    geoWatchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        try {
          await fetch("/api/safety/location", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId: session.id,
              location: {
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                accuracy: pos.coords.accuracy,
              },
            }),
          });
        } catch (e) {
          console.warn("Failed to stream live coordinates:", e);
        }
      },
      (err) => {
        console.warn("Geolocation watch error:", err.message);
      },
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 20000 }
    );

    return () => {
      if (geoWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(geoWatchIdRef.current);
        geoWatchIdRef.current = null;
      }
    };
  }, [session?.id, session?.locationSharingEnabled, session?.status, session?.isLinkRevoked]);

  // Foreground recovery: immediate GPS sync when user brings tab to foreground or unlocks phone
  useEffect(() => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) return;
    if (!session || !session.locationSharingEnabled || session.status !== "ACTIVE" || session.isLinkRevoked) return;

    const handleForegroundSync = () => {
      if (document.visibilityState === "visible") {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            try {
              await fetch("/api/safety/location", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  sessionId: session.id,
                  location: {
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                    accuracy: pos.coords.accuracy,
                  },
                }),
              });
            } catch (e) {
              console.warn("Foreground location sync error:", e);
            }
          },
          (err) => console.warn("Foreground GPS acquisition error:", err.message),
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      }
    };

    document.addEventListener("visibilitychange", handleForegroundSync);
    window.addEventListener("focus", handleForegroundSync);
    return () => {
      document.removeEventListener("visibilitychange", handleForegroundSync);
      window.removeEventListener("focus", handleForegroundSync);
    };
  }, [session?.id, session?.locationSharingEnabled, session?.status, session?.isLinkRevoked]);

  // -------------------------------------------------------------
  // 3-SECOND HOLD SOS ACTIVATION HANDLER WITH OFFLINE FALLBACK
  // -------------------------------------------------------------
  const startHoldSOS = () => {
    if (session?.sosStatus === "TRIGGERED") return;
    setHoldingSOS(true);
    holdStartRef.current = Date.now();

    const animate = () => {
      const elapsed = Date.now() - holdStartRef.current;
      const progress = Math.min(100, (elapsed / 3000) * 100);
      setSosProgress(progress);

      if (progress < 100) {
        progressAnimRef.current = requestAnimationFrame(animate);
      } else {
        triggerEmergencySOS();
      }
    };

    progressAnimRef.current = requestAnimationFrame(animate);
  };

  const cancelHoldSOS = () => {
    if (sosProgress >= 100) return;
    setHoldingSOS(false);
    setSosProgress(0);
    if (progressAnimRef.current) {
      cancelAnimationFrame(progressAnimRef.current);
      progressAnimRef.current = null;
    }
  };

  const triggerEmergencySOS = async () => {
    setHoldingSOS(false);
    setSosProgress(100);

    // Haptic vibration where supported
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([100, 100, 300]);
    }

    // P0 REQUIREMENT: Immediately open emergency interface locally without waiting for backend
    setIsEmergencyModalOpen(true);
    setBackendSOSStatus("PENDING");

    await sendSOSBackend();
  };

  const sendSOSBackend = async () => {
    try {
      let coords: any = undefined;
      if (typeof window !== "undefined" && "geolocation" in navigator) {
        try {
          const pos: any = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 4000,
            });
          });
          coords = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          };
        } catch { }
      }

      const res = await fetch("/api/safety/sos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          coordinates: coords,
          idempotencyKey: `${session.id}_${Math.floor(Date.now() / 60000)}`,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSession(data.session);
        setBackendSOSStatus("RECORDED");
      } else {
        setBackendSOSStatus("OFFLINE_FAILED");
      }
    } catch (e) {
      console.warn("Network request failed during SOS activation:", e);
      setBackendSOSStatus("OFFLINE_FAILED");
    }
  };

  const handleCancelSOS = async (reason?: string) => {
    try {
      const res = await fetch("/api/safety/sos/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          reason,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSession(data.session);
        setIsEmergencyModalOpen(false);
      }
    } catch (e) {
      console.error("Failed to cancel SOS:", e);
    }
  };

  // -------------------------------------------------------------
  // CHECK-IN HANDLERS
  // -------------------------------------------------------------
  const handleCheckIn = async () => {
    setCheckingIn(true);
    try {
      let coords: any = undefined;
      if (typeof window !== "undefined" && "geolocation" in navigator) {
        try {
          const pos: any = await new Promise((res, rej) => {
            navigator.geolocation.getCurrentPosition(res, rej, { timeout: 3000 });
          });
          coords = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          };
        } catch { }
      }

      const res = await fetch("/api/safety/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          coordinates: coords,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSession(data.session);
      }
    } catch (e) {
      console.error("Check-in error:", e);
    } finally {
      setCheckingIn(false);
    }
  };

  // Toggle Location Sharing
  const handleToggleLocation = async () => {
    const nextState = !session.locationSharingEnabled;
    try {
      const res = await fetch("/api/safety/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          action: "TOGGLE",
          enabled: nextState,
        }),
      });
      if (res.ok) {
        setSession((prev: any) => ({ ...prev, locationSharingEnabled: nextState }));
      }
    } catch (e) {
      console.error("Toggle location error:", e);
    }
  };

  // Link Management
  const trackingUrl = session?.shareToken
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/safety/live/${session.shareToken}`
    : "";

  const handleCopyLink = () => {
    if (!trackingUrl) return;
    navigator.clipboard.writeText(trackingUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleShareLink = async () => {
    if (!trackingUrl) return;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `Travally Safety Status — ${targetTitle}`,
          text: `Hi ${session.contactName || "there"}, here is my secure emergency tracking link for "${targetTitle}". No account or app required:`,
          url: trackingUrl,
        });
        return;
      } catch (e) { }
    }
    handleCopyLink();
  };

  const handleRevokeLink = async () => {
    if (
      !confirm(
        "Are you sure you want to revoke this tracking link? The contact will no longer be able to view your location or safety status."
      )
    )
      return;

    try {
      const res = await fetch("/api/safety/link/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setSession(data.session);
        alert("Tracking link has been revoked. Public tracking access is disabled.");
      }
    } catch (e) {
      console.error("Revoke error:", e);
    }
  };

  const handleRegenerateLink = async () => {
    if (
      !confirm(
        "Generate a new tracking link? The previous link will be immediately revoked."
      )
    )
      return;

    try {
      const res = await fetch("/api/safety/link/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setSession(data.session);
        alert("New tracking link generated! Please share the new link with your contact.");
      }
    } catch (e) {
      console.error("Regenerate error:", e);
    }
  };

  // -------------------------------------------------------------
  // RENDER STATES
  // -------------------------------------------------------------
  if (loading) {
    return (
      <div className="p-4 rounded-3xl bg-slate-50 dark:bg-dark-card border border-slate-200 dark:border-dark-border flex items-center justify-center gap-2 text-xs text-slate-500">
        <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
        <span>Loading safety status...</span>
      </div>
    );
  }

  // If user is not authenticated or not eligible
  if (!eligibility?.eligible) {
    if (eligibility?.reason === "IDENTITY_VERIFICATION_REQUIRED") {
      return (
        <div className="rounded-3xl bg-slate-50 dark:bg-dark-card border border-slate-200 dark:border-dark-border p-5 text-left space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Personal Safety SOS Protection
              </h3>
              <p className="text-[11px] text-slate-500">
                Identity verification required to activate emergency protections
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Travally Safety SOS is exclusively available to verified travelers and companions. Verify your identity with a quick ID check to unlock automated safety check-ins and emergency escalations.
          </p>
          {onOpenVerificationModal && (
            <button
              type="button"
              onClick={onOpenVerificationModal}
              className="py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs transition"
            >
              Verify Identity to Unlock SOS
            </button>
          )}
        </div>
      );
    }
    return null;
  }

  // User is eligible, but safety protection is not configured yet
  if (!session) {
    return (
      <>
        <div className="rounded-3xl bg-gradient-to-br from-emerald-50 via-white to-teal-50/40 dark:from-[#0d1712] dark:via-dark-card dark:to-[#0f1f18] border border-emerald-300/80 dark:border-emerald-800/60 p-5 sm:p-6 text-left space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-900/20 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                  Travally Safety SOS Protection
                </h3>
                <p className="text-[11px] text-emerald-800 dark:text-emerald-400 font-medium">
                  Available for this {targetType === "ACTIVITY" ? "companion activity" : "travel trip"}
                </p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              Verified User
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            Keep yourself protected while meeting companions or traveling. Activate automated periodic check-ins, designated emergency contact escalation, and 1-touch 112 emergency calling.
          </p>

          <button
            type="button"
            onClick={() => setIsSetupOpen(true)}
            className="w-full sm:w-auto py-3 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-900/15 active:scale-[0.98] transition flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Set Up Safety Protection</span>
          </button>
        </div>

        <SafetySetupModal
          isOpen={isSetupOpen}
          onClose={() => setIsSetupOpen(false)}
          targetType={targetType}
          targetId={targetId}
          targetTitle={targetTitle}
          onSuccess={(newSession) => setSession(newSession)}
        />
      </>
    );
  }

  // ACTIVE SAFETY SESSION
  const hasMissedCheckIn = session.isCheckInEscalated || session.missedCheckInAt;
  const isLocationActive = session.locationSharingEnabled && !session.isLinkRevoked;

  return (
    <>
      <div className="rounded-3xl bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border p-5 sm:p-6 text-left space-y-5 shadow-xs">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Safety SOS Companion
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Active
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Contact: <strong>{session.contactName}</strong> {session.contactUserId ? "(Travally User)" : ""}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsSetupOpen(true)}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-50 dark:bg-dark-elevated transition"
            title="Safety settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        {/* Missed Check-in Escalation Banner */}
        {hasMissedCheckIn && (
          <MissedCheckInBanner
            session={session}
            onConfirmSafe={handleCheckIn}
            onTriggerSOS={triggerEmergencySOS}
          />
        )}

        {/* 1. VISUAL HIERARCHY: EMERGENCY SOS ACTION */}
        <div className="p-4 sm:p-5 rounded-2xl bg-rose-50/70 dark:bg-[#1f0b0f] border border-rose-200 dark:border-rose-950/60 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-extrabold text-xs text-rose-950 dark:text-rose-200 uppercase tracking-wide">
                Emergency SOS Trigger
              </span>
            </div>
            <span className="text-[10px] text-rose-700 dark:text-rose-400 font-medium">
              India 112 Ready
            </span>
          </div>

          {/* Interactive 3-Second Press & Hold Button */}
          <div className="relative select-none">
            <button
              type="button"
              onMouseDown={startHoldSOS}
              onMouseUp={cancelHoldSOS}
              onMouseLeave={cancelHoldSOS}
              onTouchStart={startHoldSOS}
              onTouchEnd={cancelHoldSOS}
              onTouchCancel={cancelHoldSOS}
              className="w-full relative overflow-hidden py-4 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-rose-900/25 transition flex items-center justify-center gap-2 group cursor-pointer"
            >
              {/* Fill progress animation bar */}
              <div
                className="absolute left-0 top-0 bottom-0 bg-rose-900/60 transition-all pointer-events-none"
                style={{ width: `${sosProgress}%` }}
              />

              <div className="relative z-10 flex items-center justify-center gap-2">
                <AlertOctagon className="w-5 h-5 shrink-0 animate-pulse" />
                <span>
                  {holdingSOS
                    ? `HOLD TO ACTIVATE (${Math.round((3000 - sosProgress * 30) / 1000)}s)...`
                    : "PRESS & HOLD FOR 3 SECONDS FOR SOS"}
                </span>
              </div>
            </button>
          </div>
          <p className="text-[10px] text-center text-rose-800/80 dark:text-rose-300/80">
            Press and hold to prevent accidental triggers. Instantly alerts contact and displays Call 112.
          </p>
        </div>

        {/* 2. LIVE LOCATION & SECURE TRACKING LINK */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-dark-elevated border border-slate-200/70 dark:border-dark-border space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="font-bold text-xs text-slate-900 dark:text-white">
                Live Location & Tracking:
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${session.isLinkRevoked
                    ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400"
                    : isLocationActive
                      ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300"
                      : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
              >
                {session.isLinkRevoked ? "LINK REVOKED" : isLocationActive ? "ON" : "PAUSED"}
              </span>
            </div>

            {!session.isLinkRevoked && (
              <button
                type="button"
                onClick={handleToggleLocation}
                className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
              >
                {isLocationActive ? "Pause Sharing" : "Resume Sharing"}
              </button>
            )}
          </div>

          <div className="text-[11px] text-slate-500">
            <span>
              {session.lastLocationTimestamp
                ? `Last update: ${new Date(session.lastLocationTimestamp).toLocaleTimeString()}`
                : "No location streamed yet"}
            </span>
          </div>

          {/* Secure Emergency Link Controls */}
          {!session.isLinkRevoked ? (
            <div className="p-3 rounded-xl bg-white dark:bg-[#121c17] border border-slate-200/80 dark:border-emerald-950 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <LinkIcon className="w-3 h-3 text-emerald-600" />
                  <span>Secure Shareable Link</span>
                </span>
                {session.shareExpiresAt && (
                  <span className="text-[9px] text-slate-400">
                    Expires {new Date(session.shareExpiresAt).toLocaleDateString()}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleShareLink}
                  className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 transition"
                >
                  <Share2 className="w-3 h-3" />
                  <span>Share via...</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="py-1.5 px-3 rounded-lg bg-slate-100 dark:bg-dark-elevated hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-[11px] border border-slate-200 dark:border-dark-border flex items-center gap-1 transition"
                >
                  {copiedLink ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedLink ? "Copied!" : "Copy"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleRegenerateLink}
                  className="py-1.5 px-2.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-[11px] flex items-center gap-1 transition"
                  title="Generate new link and revoke this one"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Reset</span>
                </button>

                <button
                  type="button"
                  onClick={handleRevokeLink}
                  className="py-1.5 px-2.5 rounded-lg text-rose-600 hover:text-rose-700 text-[11px] flex items-center gap-1 transition ml-auto"
                >
                  <ShieldX className="w-3 h-3" />
                  <span>Revoke</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 flex items-center justify-between text-xs">
              <span className="text-rose-800 dark:text-rose-300 font-semibold text-[11px]">
                Tracking access revoked.
              </span>
              <button
                type="button"
                onClick={handleRegenerateLink}
                className="py-1 px-3 rounded-lg bg-rose-600 text-white font-bold text-[11px] hover:bg-rose-700 transition"
              >
                Generate New Link
              </button>
            </div>
          )}
        </div>

        {/* 3. SAFETY CHECK-IN STATUS */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-dark-elevated border border-slate-200/70 dark:border-dark-border space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="font-bold text-xs text-slate-900 dark:text-white">
                Safety Check-in Status
              </span>
            </div>
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
              {timeLeftMinutes !== null
                ? `Due in ~${timeLeftMinutes} min`
                : `Every ${session.checkInIntervalMinutes} mins`}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="text-[11px] text-slate-500">
              <span>Last confirmed: </span>
              <strong className="text-slate-800 dark:text-slate-200">
                {session.lastCheckInAt
                  ? new Date(session.lastCheckInAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                  : "Just started"}
              </strong>
            </div>

            {/* "I'm okay ✓" Button */}
            <button
              type="button"
              disabled={checkingIn}
              onClick={handleCheckIn}
              className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs shadow-xs transition flex items-center gap-1.5"
            >
              {checkingIn ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              <span>I&apos;m okay ✓</span>
            </button>
          </div>
        </div>
      </div>

      {/* Emergency Active Full Screen Overlay with Offline Fallback */}
      <EmergencyActiveModal
        isOpen={isEmergencyModalOpen}
        session={session}
        backendStatus={backendSOSStatus}
        onRetrySync={sendSOSBackend}
        onCancelSOS={handleCancelSOS}
      />

      {/* Settings Modal */}
      <SafetySetupModal
        isOpen={isSetupOpen}
        onClose={() => setIsSetupOpen(false)}
        targetType={targetType}
        targetId={targetId}
        targetTitle={targetTitle}
        existingSession={session}
        onSuccess={(updated) => setSession(updated)}
      />
    </>
  );
};
