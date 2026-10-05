"use client";

import React, { useState } from "react";
import { Sparkles, X } from "lucide-react";
import { CompatibilityResult } from "@/lib/scoring";

interface CompatibilityBadgeProps {
  compatibility: CompatibilityResult;
  showModalOnClick?: boolean;
}

export const CompatibilityBadge: React.FC<CompatibilityBadgeProps> = ({
  compatibility,
  showModalOnClick = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (showModalOnClick) setIsOpen(true);
        }}
        title="View transparent compatibility breakdown"
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition hover:opacity-90 shadow-sm ${compatibility.badgeColor}`}
      >
        <Sparkles className="w-3.5 h-3.5 text-orange-500" />
        <span>{compatibility.overallScore}% Match</span>
        <span className="text-[10px] opacity-80 font-normal">({compatibility.matchLevel})</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in text-left">
          <div className="w-full max-w-md bg-white dark:bg-[#111815] rounded-3xl shadow-2xl border border-slate-200 dark:border-emerald-950/80 p-6 relative">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-5 right-5 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <span className={`p-2 rounded-2xl ${compatibility.badgeColor}`}>
                <Sparkles className="w-5 h-5 text-orange-500" />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Compatibility Breakdown
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Overall Score:{" "}
                  <strong className="text-slate-800 dark:text-slate-200">
                    {compatibility.overallScore}% ({compatibility.matchLevel})
                  </strong>
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-[#16201b] p-3.5 rounded-2xl border border-slate-200 dark:border-emerald-950/70 mb-4 leading-relaxed">
              {compatibility.summaryExplanation}
            </p>

            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
              Scoring Factors Breakdown
            </h4>

            <div className="space-y-3">
              {compatibility.factors.map((f, i) => (
                <div key={i} className="text-xs space-y-1">
                  <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                    <span className="font-medium">
                      {f.name} (weight: {Math.round(f.weight * 100)}%)
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">{f.score}/100</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-[#18241f] rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-orange-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${f.score}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{f.detail}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-emerald-950/60 text-[11px] text-slate-500 dark:text-slate-400">
              * Travally uses a deterministic transparent matrix calculating destination overlap, schedule alignment, travel style, and budget preferences.
            </div>
          </div>
        </div>
      )}
    </>
  );
};

