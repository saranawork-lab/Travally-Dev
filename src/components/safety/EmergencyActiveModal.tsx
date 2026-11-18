"use client";

import React, { useState, useEffect } from "react";
import {
  AlertOctagon,
  PhoneCall,
  CheckCircle2,
  MapPin,
  Users,
  Shield,
  Loader2,
  X,
  AlertTriangle,
  WifiOff,
  RefreshCw,
} from "lucide-react";

export type SOSBackendStatus = "PENDING" | "RECORDED" | "OFFLINE_FAILED";

interface EmergencyActiveModalProps {
  isOpen: boolean;
  session: any;
  backendStatus: SOSBackendStatus;
  onRetrySync: () => Promise<void>;
  onCancelSOS: (reason?: string) => Promise<void>;
}

export const EmergencyActiveModal: React.FC<EmergencyActiveModalProps> = ({
  isOpen,
  session,
  backendStatus,
  onRetrySync,
  onCancelSOS,
}) => {
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-retry when connection restores if previously failed
      if (backendStatus === "OFFLINE_FAILED") {
        handleRetry();
      }
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [backendStatus]);

  if (!isOpen) return null;

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await onRetrySync();
    } catch (e) {
      console.error("Retry failed:", e);
    } finally {
      setIsRetrying(false);
    }
  };

  const handleConfirmCancel = async () => {
    setIsCancelling(true);
    try {
      await onCancelSOS(cancelReason || "User verified safety and cancelled SOS.");
      setShowConfirmCancel(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsCancelling(false);
    }
  };

  const hasCoords = session?.lastLatitude !== null && session?.lastLatitude !== undefined;
  const locationText = hasCoords
    ? `${session.lastLatitude.toFixed(4)}, ${session.lastLongitude.toFixed(4)}`
    : "Location permission unavailable";

  const isRecorded = backendStatus === "RECORDED";
  const isOffline = backendStatus === "OFFLINE_FAILED" || !isOnline;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-rose-950/90 backdrop-blur-md animate-fade-in text-left">
      <div className="w-full max-w-md bg-white dark:bg-[#14080a] rounded-3xl shadow-2xl border-2 border-rose-500 overflow-hidden flex flex-col max-h-[95vh]">
        {/* Top Emergency Status Header */}
        <div className="bg-rose-600 px-5 py-5 text-white flex flex-col items-center text-center relative overflow-hidden">
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mb-2 animate-pulse">
            <AlertOctagon className="w-8 h-8 text-white stroke-[2.5]" />
          </div>

          <span className="text-[11px] font-black uppercase tracking-widest bg-white/25 px-3 py-0.5 rounded-full mb-1">
            Emergency Interface Active
          </span>

          <h2 className="text-2xl font-black tracking-tight">
            {isRecorded ? "SOS SENT" : "SOS ACTIVATED LOCALLY"}
          </h2>

          <p className="text-xs text-rose-100 font-medium max-w-xs mt-1">
            {isRecorded
              ? "Your emergency alert has been recorded on the Travally backend. Emergency contact is being notified."
              : isOffline
                ? "Device is offline. Please call 112 directly now."
                : "Submitting emergency alert to Travally safety network..."}
          </p>
        </div>

        {/* Offline Warning Banner with Retry */}
        {isOffline && (
          <div className="bg-amber-600 text-white px-4 py-3 text-xs space-y-2">
            <div className="flex items-start gap-2">
              <WifiOff className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <span className="font-extrabold block">Device Offline Notice:</span>
                <p className="text-[11px] leading-relaxed text-amber-100">
                  Your device is offline. Travally could not send your emergency alert. Please call 112 directly.
                </p>
              </div>
            </div>
            <button
              type="button"
              disabled={isRetrying}
              onClick={handleRetry}
              className="w-full py-1.5 px-3 rounded-lg bg-white/20 hover:bg-white/30 text-white font-bold text-[11px] transition flex items-center justify-center gap-1.5"
            >
              <RefreshCw className={`w-3 h-3 ${isRetrying ? "animate-spin" : ""}`} />
              <span>{isRetrying ? "Retrying Alert Transmission..." : "Retry Sending Alert"}</span>
            </button>
          </div>
        )}

        {/* Status Verification Panel */}
        <div className="p-5 space-y-4 overflow-y-auto text-xs">
          <div className="space-y-2">
            <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Emergency Transmission Status
            </h4>

            {/* Local Activation */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#1f0d10] border border-slate-200 dark:border-rose-950/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">
                    Local Emergency Trigger
                  </span>
                  <span className="text-[10px] text-slate-500">Initiated via 3-second hold</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                Active
              </span>
            </div>

            {/* Backend Record */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#1f0d10] border border-slate-200 dark:border-rose-950/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${isRecorded ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
                  }`}>
                  {isRecorded ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : backendStatus === "PENDING" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <AlertTriangle className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">
                    Travally Backend Record
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {isRecorded ? "Saved in MongoDB Audit Trail" : isOffline ? "Pending network connection" : "Sending..."}
                  </span>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isRecorded ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                }`}>
                {isRecorded ? "Recorded" : isOffline ? "Offline" : "Pending"}
              </span>
            </div>

            {/* Emergency Contact */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#1f0d10] border border-slate-200 dark:border-rose-950/60 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="font-bold text-slate-900 dark:text-white block">
                  Emergency Contact: {session?.contactName || "Designated Contact"}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                  {session?.contactPhone ? `Phone: ${session.contactPhone}` : "In-App Safety Contact"}
                </span>
                <span className="text-[10px] font-bold inline-flex items-center gap-1 mt-0.5">
                  {isRecorded ? (
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Alert & Link Dispatched
                    </span>
                  ) : (
                    <span className="text-amber-600 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Queued for network
                    </span>
                  )}
                </span>
              </div>
            </div>

            {/* Location Status */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#1f0d10] border border-slate-200 dark:border-rose-950/60 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="font-bold text-slate-900 dark:text-white block">
                  Last Known Location
                </span>
                <span className="text-[11px] text-slate-600 dark:text-slate-300 block truncate font-mono">
                  {locationText}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  {session?.lastLocationTimestamp
                    ? `Recorded ${new Date(session.lastLocationTimestamp).toLocaleTimeString()}`
                    : "No GPS fix"}
                </span>
              </div>
            </div>
          </div>

          {/* Emergency Calling Instructions */}
          <div className="p-3 rounded-2xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-[11px] text-rose-900 dark:text-rose-200 leading-relaxed">
            <span className="font-bold block mb-0.5">Emergency Calling Protocol (India):</span>
            Tap below to immediately dial <strong>112</strong> through your device&apos;s dialer.
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-5 pt-0 space-y-2.5">
          {/* Call 112 Button - Always Available Immediately */}
          <a
            href="tel:112"
            className="w-full py-4 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white font-black text-sm uppercase tracking-wide shadow-lg shadow-rose-900/30 flex items-center justify-center gap-2 transition"
          >
            <PhoneCall className="w-5 h-5 stroke-[2.5]" />
            <span>CALL 112 NOW</span>
          </a>

          {/* Cancel SOS Button */}
          <button
            type="button"
            onClick={() => setShowConfirmCancel(true)}
            className="w-full py-3 px-4 rounded-2xl bg-slate-100 dark:bg-dark-elevated hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-extrabold text-xs transition"
          >
            I&apos;M SAFE — CANCEL SOS
          </button>
        </div>
      </div>

      {/* Confirmation Modal to Cancel SOS */}
      {showConfirmCancel && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-[#111] rounded-3xl p-5 space-y-4 border border-slate-200 dark:border-dark-border text-left shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Confirm You Are Safe
              </h3>
              <button
                onClick={() => setShowConfirmCancel(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Cancelling will update your emergency status to normal and notify your emergency contact that you are safe.
            </p>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Optional update note:
              </label>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Accidental press, or arrived home safely"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-elevated text-xs text-slate-900 dark:text-white"
              />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowConfirmCancel(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-dark-border text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Go Back
              </button>
              <button
                type="button"
                disabled={isCancelling}
                onClick={handleConfirmCancel}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-1"
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <span>Yes, I&apos;m Safe</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
