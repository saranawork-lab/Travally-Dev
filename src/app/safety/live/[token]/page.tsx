"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Calendar,
  Clock,
  PhoneCall,
  RefreshCw,
  Compass,
  Loader2,
  ExternalLink,
  ShieldX,
  History,
  Info,
} from "lucide-react";
import { LiveTrackingMap } from "@/components/safety/LiveTrackingMap";

export default function PublicLiveTrackingPage() {
  const params = useParams();
  const token = params?.token as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState(false);

  const isFetchingRef = useRef(false);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchTracking = async (isManual = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (isManual) setRefreshing(true);

    try {
      const res = await fetch(`/api/safety/track/${token}`);
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Unable to load safety tracking info.");
      }
      setData(json.tracking);
      setLastRefreshed(new Date());
      setError(null);

      // Stop polling if session is terminated or inactive
      if (
        json.tracking &&
        ["REVOKED", "EXPIRED", "COMPLETED", "CANCELLED", "ACTIVITY_CANCELLED"].includes(
          json.tracking.status
        )
      ) {
        if (pollTimerRef.current) {
          clearInterval(pollTimerRef.current);
          pollTimerRef.current = null;
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load safety tracking session.");
    } finally {
      setLoading(false);
      setRefreshing(false);
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    if (token) {
      fetchTracking();
      // Auto refresh every 15 seconds without overlapping
      pollTimerRef.current = setInterval(() => {
        fetchTracking();
      }, 15000);

      // Foreground recovery: immediate fetch when returning to tab
      const handleVisibility = () => {
        if (document.visibilityState === "visible") {
          fetchTracking(true);
        }
      };
      document.addEventListener("visibilitychange", handleVisibility);
      window.addEventListener("focus", handleVisibility);

      return () => {
        if (pollTimerRef.current) {
          clearInterval(pollTimerRef.current);
          pollTimerRef.current = null;
        }
        document.removeEventListener("visibilitychange", handleVisibility);
        window.removeEventListener("focus", handleVisibility);
      };
    }
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-[#0a0f0d] text-slate-900 dark:text-white">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-3" />
        <p className="text-sm font-semibold">Connecting to Travally Safety Network...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-[#0a0f0d] text-center">
        <div className="max-w-md w-full p-6 sm:p-8 bg-white dark:bg-[#121a16] rounded-3xl border border-slate-200 dark:border-emerald-950/80 shadow-lg space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            Tracking Link Inactive
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {error || "This safety tracking session is no longer active or has expired."}
          </p>
          <Link
            href="/"
            className="inline-block px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-dark-elevated text-xs font-bold text-slate-800 dark:text-slate-200"
          >
            Go to Travally Home
          </Link>
        </div>
      </div>
    );
  }

  // Handle Terminal / Inactive States (Revoked, Expired, Concluded)
  const isTerminal = [
    "REVOKED",
    "EXPIRED",
    "COMPLETED",
    "CANCELLED",
    "ACTIVITY_CANCELLED",
    "ACTIVITY_COMPLETED",
  ].includes(data.status);

  if (isTerminal) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#090d0b] text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center p-4 text-center">
        <div className="max-w-md w-full p-6 sm:p-8 bg-white dark:bg-[#121a16] rounded-3xl border border-slate-200 dark:border-emerald-950/80 shadow-xl space-y-5">
          <div className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center ${data.status === "REVOKED"
              ? "bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400"
              : "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400"
            }`}>
            {data.status === "REVOKED" ? <ShieldX className="w-7 h-7" /> : <Clock className="w-7 h-7" />}
          </div>

          <div className="space-y-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-dark-elevated text-slate-600 dark:text-slate-300">
              Tracking Access Concluded
            </span>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              {data.status === "REVOKED"
                ? "Tracking Access Revoked"
                : data.status === "EXPIRED"
                  ? "Tracking Link Expired"
                  : "Activity Concluded"}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              {data.message || "This safety tracking session has ended. Coordinates are no longer being shared."}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-dark-elevated text-xs text-left space-y-1">
            <span className="font-bold text-slate-900 dark:text-white block">Traveler:</span>
            <span className="text-slate-600 dark:text-slate-300 block">
              {data.user?.displayName || "Travally Explorer"}
            </span>
            <p className="text-[11px] text-slate-500 pt-1">
              For privacy and safety, past location coordinates are purged from public view once a link is revoked or concluded.
            </p>
          </div>

          <Link
            href="/"
            className="inline-block w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition"
          >
            Visit Travally
          </Link>
        </div>
      </div>
    );
  }

  // Active Safety Session
  const isSOS = data.sosStatus === "TRIGGERED";
  const isEscalated = data.isCheckInEscalated;
  const hasCoords = data.lastLatitude !== null && data.lastLatitude !== undefined;
  const timeline = data.timeline || [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d0b] text-slate-900 dark:text-slate-100 pb-20">
      {/* Header Bar */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-[#0d1410]/80 backdrop-blur-md border-b border-slate-200 dark:border-emerald-950/80 px-4 py-3 sm:px-6">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">
                Travally Safety Monitor
              </h1>
              <span className="text-[10px] text-slate-500 block">
                Official Live Emergency & Location Portal
              </span>
            </div>
          </div>

          <button
            onClick={() => fetchTracking(true)}
            disabled={refreshing}
            className="p-2 rounded-xl text-slate-500 hover:text-emerald-600 bg-slate-100 dark:bg-dark-elevated transition flex items-center gap-1 text-[11px] font-bold"
            title="Refresh status"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-5 space-y-4 text-left">
        {/* Urgent Status Banner */}
        {isSOS ? (
          <div className="p-4 sm:p-5 rounded-3xl bg-rose-600 text-white shadow-xl shadow-rose-950/20 space-y-2 animate-pulse">
            <div className="flex items-center gap-2">
              <AlertOctagon className="w-6 h-6 stroke-[2.5]" />
              <span className="text-xs font-black uppercase tracking-widest bg-white/20 px-2.5 py-0.5 rounded-full">
                EMERGENCY ALERT ACTIVE
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black">
              {data.user.displayName} Activated SOS Emergency
            </h2>
            <p className="text-xs text-rose-100 leading-relaxed font-medium">
              An explicit emergency SOS was triggered by the user. Review coordinates below and contact emergency services or the traveler immediately.
            </p>
          </div>
        ) : isEscalated ? (
          <div className="p-4 sm:p-5 rounded-3xl bg-amber-500 text-white shadow-xl shadow-amber-950/20 space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
              <span className="text-xs font-black uppercase tracking-widest bg-white/20 px-2.5 py-0.5 rounded-full">
                SAFETY NOTICE
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black">
              {data.user.displayName} Missed Scheduled Check-in
            </h2>
            <p className="text-xs text-amber-100 leading-relaxed font-medium">
              A regular safety check-in deadline was missed. This is an escalation notice sharing their last known coordinates.
            </p>
          </div>
        ) : (
          <div className="p-4 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-extrabold block">Status: Normal & Safe</span>
                <span className="text-[11px] text-emerald-800 dark:text-emerald-300 block">
                  Periodic safety check-ins are active.
                </span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200">
              Safe
            </span>
          </div>
        )}

        {/* User Profile Card */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#121a16] border border-slate-200 dark:border-emerald-950/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center font-black text-sm text-emerald-800 dark:text-emerald-300">
                {data.user.displayName.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {data.user.displayName}
                  </span>
                  {data.user.isVerified && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-0.5">
                      <ShieldCheck className="w-3 h-3" /> Verified
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-500">Travally Traveler</span>
              </div>
            </div>

            <a
              href="tel:112"
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs flex items-center gap-1.5 shadow-sm transition"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Call 112</span>
            </a>
          </div>

          {/* Activity Info */}
          {data.target && (
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-dark-elevated border border-slate-100 dark:border-dark-border text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white truncate">
                  {data.target.title}
                </span>
                <span className="text-[10px] font-semibold text-brand-600 dark:text-brand-400 capitalize">
                  {data.target.type === "ACTIVITY" ? "Companion Activity" : "Travel Trip"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500 text-[11px] truncate">
                <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                <span className="truncate">{data.target.location}</span>
              </div>
            </div>
          )}
        </div>

        {/* Live Map & Location Card */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#121a16] border border-slate-200 dark:border-emerald-950/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-bold text-xs uppercase tracking-wide text-slate-900 dark:text-white">
                Live Location Sharing
              </h3>
            </div>
            <span className="text-[10px] text-slate-400">
              Refreshed: {new Date(lastRefreshed).toLocaleTimeString()}
            </span>
          </div>

          {hasCoords ? (
            <div className="space-y-3">
              <LiveTrackingMap
                latitude={data.lastLatitude}
                longitude={data.lastLongitude}
                accuracy={data.lastLocationAccuracy}
                displayName={data.user.displayName}
              />
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-dark-elevated text-xs space-y-1 font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-[11px]">GPS Coordinates:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {data.lastLatitude.toFixed(5)}, {data.lastLongitude.toFixed(5)}
                  </span>
                </div>
                {data.lastLocationAccuracy && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-[11px]">Accuracy Radius:</span>
                    <span className="text-slate-700 dark:text-slate-300">
                      ±{Math.round(data.lastLocationAccuracy)} meters
                    </span>
                  </div>
                )}
                {data.lastLocationTimestamp && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-[11px]">Recorded At:</span>
                    <span className="text-slate-700 dark:text-slate-300">
                      {new Date(data.lastLocationTimestamp).toLocaleTimeString()}
                    </span>
                  </div>
                )}
              </div>

              {(() => {
                if (!data.lastLocationTimestamp) return null;
                const ageMinutes = Math.floor(
                  (Date.now() - new Date(data.lastLocationTimestamp).getTime()) / 60000
                );
                if (ageMinutes < 5) return null;
                return (
                  <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2">
                    <Clock className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                    <div>
                      <span className="font-bold block">Last known location ({ageMinutes} mins ago)</span>
                      <span className="text-[11px] text-amber-800 dark:text-amber-300 block leading-relaxed">
                        Mobile browsers pause background location streaming when the phone is locked or browser is minimized. Location will auto-refresh as soon as the traveler unlocks their phone.
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-dark-elevated text-center text-xs text-slate-500 space-y-1">
              <MapPin className="w-8 h-8 text-slate-400 mx-auto mb-1 opacity-50" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">
                Location data currently unavailable.
              </p>
              <p className="text-[11px]">
                The traveler has not yet streamed GPS coordinates or their browser is currently suspended.
              </p>
            </div>
          )}
        </div>

        {/* REAL SAFETY UPDATE TIMELINE */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#121a16] border border-slate-200 dark:border-emerald-950/80 shadow-sm space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-bold uppercase tracking-wide text-slate-900 dark:text-white">
                Safety Update Timeline
              </h3>
            </div>
            <span className="text-[10px] text-slate-400">Live Database Events</span>
          </div>

          {timeline.length > 0 ? (
            <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-dark-border">
              {timeline.map((item: any) => {
                const isItemSOS = item.type === "SOS_TRIGGERED";
                const isItemMissed = item.type === "MISSED_CHECKIN";
                const isItemSafe = item.type === "CHECKIN_CONFIRMED" || item.type === "SOS_CANCELLED";

                return (
                  <div key={item.id} className="relative text-left space-y-0.5">
                    {/* Timeline bullet dot */}
                    <div
                      className={`absolute -left-6 top-1 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-dark-card ${isItemSOS
                          ? "bg-rose-600 animate-ping"
                          : isItemMissed
                            ? "bg-amber-500"
                            : isItemSafe
                              ? "bg-emerald-600"
                              : "bg-slate-400"
                        }`}
                    />

                    <div className="flex items-center justify-between gap-2">
                      <span className={`font-bold text-xs ${isItemSOS ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-white"
                        }`}>
                        {item.title}
                      </span>
                      <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                        {new Date(item.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-dark-elevated text-center text-slate-500 text-[11px]">
              No safety events recorded yet for this session.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
