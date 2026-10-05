"use client";

import React, { useState } from "react";
import { Send, X, ShieldCheck, AlertCircle, MessageSquare } from "lucide-react";

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
  const [introMessage, setIntroMessage] = useState("");
  const [mode, setMode] = useState<"SELECT" | "WITH_NOTE">("SELECT");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isGreen = type === "ACTIVITY";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const payload: any = {
        type,
        introMessage: introMessage.trim(),
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

  const handleSendWithoutNote = (e: React.FormEvent) => {
    e.preventDefault();
    setIntroMessage("");
    handleSubmit(e);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in text-left">
      <div className="w-full max-w-lg bg-white dark:bg-[#111815] rounded-3xl shadow-2xl border border-slate-200 dark:border-emerald-950/80 p-6 relative">
        <button
          onClick={() => {
            if (mode === "WITH_NOTE") {
              setMode("SELECT");
              setIntroMessage("");
            } else {
              onClose();
            }
          }}
          className="absolute top-5 right-5 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-4">
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold mb-2 ${
              isGreen
                ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50"
                : "bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800/50"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Private Join Request</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Interested in Joining {type === "ACTIVITY" ? "Activity" : "Trip"}?
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Send a private request to <strong>{organizerName}</strong> for &ldquo;{title}&rdquo;.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {mode === "SELECT" ? (
          <div className="space-y-3 mt-6">
            <button
              onClick={handleSendWithoutNote}
              disabled={isSubmitting}
              className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-emerald-950/80 hover:bg-slate-50 dark:hover:bg-[#16201b] transition group"
            >
              <div className="flex flex-col items-start text-left">
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  Send without intro note
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Direct request with verified profile only
                </span>
              </div>
              <Send
                className={`w-4 h-4 text-slate-400 transition ${
                  isGreen ? "group-hover:text-emerald-600" : "group-hover:text-orange-500"
                }`}
              />
            </button>
            <button
              onClick={() => setMode("WITH_NOTE")}
              className={`w-full flex items-center justify-between p-4 rounded-2xl border transition group ${
                isGreen
                  ? "border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/70 dark:bg-emerald-950/30 hover:bg-emerald-100/50 dark:hover:bg-emerald-950/50"
                  : "border-orange-200 dark:border-orange-900/50 bg-orange-50/70 dark:bg-orange-950/30 hover:bg-orange-100/50 dark:hover:bg-orange-950/50"
              }`}
            >
              <div className="flex flex-col items-start text-left">
                <span
                  className={`text-sm font-bold ${
                    isGreen ? "text-emerald-800 dark:text-emerald-300" : "text-orange-800 dark:text-orange-300"
                  }`}
                >
                  Send with personalized note
                </span>
                <span
                  className={`text-[11px] mt-0.5 ${
                    isGreen ? "text-emerald-600/80 dark:text-emerald-400/80" : "text-orange-600/80 dark:text-orange-400/80"
                  }`}
                >
                  Introduce yourself to {organizerName}
                </span>
              </div>
              <MessageSquare
                className={`w-4 h-4 ${isGreen ? "text-emerald-600" : "text-orange-500"}`}
              />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Introduce Yourself
              </label>
              <textarea
                required
                rows={4}
                value={introMessage}
                onChange={(e) => setIntroMessage(e.target.value)}
                placeholder="Hi! I'd love to join this because..."
                className={`w-full rounded-2xl border bg-white dark:bg-[#16201b] p-3.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 leading-relaxed transition ${
                  isGreen
                    ? "border-slate-200 dark:border-emerald-950/80 focus:ring-emerald-500/25 focus:border-emerald-500"
                    : "border-slate-200 dark:border-emerald-950/80 focus:ring-orange-500/25 focus:border-orange-500"
                }`}
              />
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                Organizers review profiles and introductory notes before approving.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setMode("SELECT")}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#16201b] rounded-xl transition"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !introMessage.trim()}
                className={`px-5 py-2.5 text-xs font-bold disabled:opacity-50 rounded-xl transition shadow-xs flex items-center gap-1.5 ${
                  isGreen
                    ? "bg-gradient-to-r from-emerald-100 via-teal-50 to-emerald-100 hover:from-emerald-200 hover:to-teal-100 text-emerald-900 border border-emerald-300/90 dark:from-emerald-950/80 dark:to-teal-900/60 dark:text-emerald-300 dark:border-emerald-700/60"
                    : "bg-gradient-to-r from-orange-100 via-amber-50 to-orange-100 hover:from-orange-200 hover:to-amber-100 text-orange-900 border border-orange-300/90 dark:from-orange-950/80 dark:to-amber-900/60 dark:text-orange-300 dark:border-orange-700/60"
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? "Sending..." : "Send Join Request"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

