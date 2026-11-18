"use client";

import React, { useState, useEffect } from "react";
import { ShieldAlert, ShieldCheck, X, ArrowRight } from "lucide-react";

interface SafetyOnboardingPromptProps {
  isOpen: boolean;
  targetType: "ACTIVITY" | "TRAVEL";
  targetId: string;
  targetTitle: string;
  isCreator?: boolean;
  onSetUp: () => void;
  onDismiss: () => void;
}

export const SafetyOnboardingPrompt: React.FC<SafetyOnboardingPromptProps> = ({
  isOpen,
  targetType,
  targetId,
  targetTitle,
  isCreator = false,
  onSetUp,
  onDismiss,
}) => {
  if (!isOpen) return null;

  const isTrip = targetType === "TRAVEL";
  const headingText = isCreator
    ? isTrip
      ? "Your trip is ready!"
      : "Your companion activity is ready!"
    : isTrip
      ? "You're confirmed for this trip!"
      : "You're confirmed for this activity!";

  const subText = isTrip
    ? "Would you like to activate Travally Safety SOS for this trip?"
    : "Would you like to activate Travally Safety SOS for this activity?";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in text-left">
      <div className="w-full max-w-md bg-white dark:bg-[#0f1713] rounded-3xl shadow-2xl border border-slate-200 dark:border-emerald-950/80 p-5 sm:p-6 space-y-4 animate-slide-up sm:animate-scale-up relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700/60 flex items-center justify-center text-emerald-700 dark:text-emerald-300 shadow-sm shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <button
            onClick={onDismiss}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1.5">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            Personal Safety Companion
          </span>
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white leading-tight">
            {headingText}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            {subText}
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-dark-elevated border border-slate-200/60 dark:border-dark-border text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
          <p className="font-semibold text-slate-900 dark:text-white">What SOS provides:</p>
          <ul className="list-disc list-inside space-y-0.5 text-slate-500 dark:text-slate-400">
            <li>Automatic &quot;Are you safe?&quot; check-ins</li>
            <li>Emergency contact escalation if you miss a check-in</li>
            <li>One-touch 3-second SOS alert with Call 112</li>
            <li>Secure live location sharing</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onSetUp}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs shadow-md shadow-emerald-900/20 active:scale-[0.98] transition flex items-center justify-center gap-2"
          >
            <span>Set up safety protection</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onDismiss}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
};

