"use client";

import React, { useState } from "react";
import { Send, X, ShieldCheck, AlertCircle, MessageSquare, Zap, Compass, CheckCircle2, Loader2 } from "lucide-react";

interface JoinRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "ACTIVITY" | "TRAVEL";
  targetId: string;
  title: string;
  organizerName: string;
  onSuccess: () => void;
}

export const JoinRequestModal: React.FC<JoinRequestModalProps> = ({
  isOpen,
  onClose,
  type,
  targetId,
  title,
  organizerName,
  onSuccess,
}) => {
  const [requestMode, setRequestMode] = useState<"QUICK" | "NOTE">("QUICK");
  const [introMessage, setIntroMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isGreen = type === "ACTIVITY";

  const promptSuggestions = [
    "👋 Hey! I'd love to team up for this.",
    "🎒 Experienced explorer, super excited to join!",
    "🧭 Looks like a great plan, count me in!",
  ];

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const payload: any = {
        type,
        introMessage: requestMode === "NOTE" ? introMessage.trim() : "",
      };
      if (type === "ACTIVITY") payload.activityId = targetId;
      else payload.travelPlanId = targetId;

      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit request");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in text-left">
      <div className="w-full max-w-md bg-white dark:bg-[#101713] rounded-3xl shadow-2xl border border-slate-200/90 dark:border-emerald-950/80 p-5 sm:p-6 relative overflow-hidden">
        {/* Top ambient color glow */}
        <div
          className={`absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-20 ${
            isGreen ? "bg-emerald-500" : "bg-orange-500"
          }`}
        />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition active:scale-95 z-10"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header section */}
        <div className="space-y-2 mb-5">
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold tracking-wide uppercase ${
              isGreen
                ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60"
                : "bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800/60"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verified Companion Request</span>
          </div>

          <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
            Connect with {organizerName}
          </h2>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Compass className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate max-w-[320px] font-medium text-slate-700 dark:text-slate-300">
              {title}
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Dual Unique Interactive Selection Cards */}
        <div className="space-y-2.5 mb-4">
          {/* Option A: Quick Request */}
          <button
            type="button"
            onClick={() => setRequestMode("QUICK")}
            className={`w-full p-3.5 rounded-2xl border text-left transition-all relative flex items-start gap-3 ${
              requestMode === "QUICK"
                ? isGreen
                  ? "bg-emerald-500/10 border-emerald-500/60 dark:border-emerald-500/50 shadow-xs ring-1 ring-emerald-500/30"
                  : "bg-orange-500/10 border-orange-500/60 dark:border-orange-500/50 shadow-xs ring-1 ring-orange-500/30"
                : "bg-slate-50/70 dark:bg-[#151f1a]/70 border-slate-200 dark:border-emerald-950/60 hover:border-slate-300 dark:hover:border-emerald-900"
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                requestMode === "QUICK"
                  ? isGreen
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-orange-600 text-white shadow-xs"
                  : "bg-slate-200 dark:bg-slate-800 text-slate-500"
              }`}
            >
              <Zap className="w-4 h-4" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Quick Join
                </span>
                <span className="text-[9.5px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Instant
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                Send a direct request with your verified profile and traveler badges.
              </p>
            </div>
          </button>

          {/* Option B: Personalized Intro Note */}
          <button
            type="button"
            onClick={() => setRequestMode("NOTE")}
            className={`w-full p-3.5 rounded-2xl border text-left transition-all relative flex items-start gap-3 ${
              requestMode === "NOTE"
                ? isGreen
                  ? "bg-emerald-500/10 border-emerald-500/60 dark:border-emerald-500/50 shadow-xs ring-1 ring-emerald-500/30"
                  : "bg-orange-500/10 border-orange-500/60 dark:border-orange-500/50 shadow-xs ring-1 ring-orange-500/30"
                : "bg-slate-50/70 dark:bg-[#151f1a]/70 border-slate-200 dark:border-emerald-950/60 hover:border-slate-300 dark:hover:border-emerald-900"
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                requestMode === "NOTE"
                  ? isGreen
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-orange-600 text-white shadow-xs"
                  : "bg-slate-200 dark:bg-slate-800 text-slate-500"
              }`}
            >
              <MessageSquare className="w-4 h-4" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Add Intro Note
                </span>
                <span className="text-[9.5px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  Custom
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                Include a friendly message to introduce yourself before connecting.
              </p>
            </div>
          </button>
        </div>

        {/* Expandable Composer when "Add Intro Note" is chosen */}
        {requestMode === "NOTE" && (
          <div className="space-y-2 mb-4 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Quick Greeting Prompt Chips */}
            <div className="flex flex-wrap gap-1.5">
              {promptSuggestions.map((prompt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIntroMessage(prompt)}
                  className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-[#17221c] hover:bg-emerald-50 dark:hover:bg-emerald-950/60 border border-slate-200 dark:border-emerald-950 text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-300 transition"
                >
                  {prompt}
                </button>
              ))}
            </div>

            <textarea
              rows={3}
              value={introMessage}
              onChange={(e) => setIntroMessage(e.target.value)}
              placeholder="Hi! I'd love to join this activity because..."
              className={`w-full rounded-2xl border bg-slate-50/60 dark:bg-[#15201b]/80 p-3 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 leading-relaxed transition ${
                isGreen
                  ? "border-emerald-200 dark:border-emerald-950/80 focus:ring-emerald-500/25 focus:border-emerald-500"
                  : "border-orange-200 dark:border-orange-950/80 focus:ring-orange-500/25 focus:border-orange-500"
              }`}
            />
          </div>
        )}

        {/* Bottom Confirmation Action */}
        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={isSubmitting || (requestMode === "NOTE" && !introMessage.trim())}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white transition shadow-md active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50 ${
              isGreen
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-600/20"
                : "bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 shadow-orange-600/20"
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Sending Request...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>
                  {requestMode === "QUICK"
                    ? "Send Quick Request"
                    : "Send with Intro Note"}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
