"use client";

import React from "react";
import { Users, Compass } from "lucide-react";

export type AppMode = "companion" | "travel";

interface ModeToggleProps {
  currentMode: AppMode;
  onModeChange: (mode: AppMode) => void;
  className?: string;
  size?: "sm" | "md";
}

export const ModeToggle: React.FC<ModeToggleProps> = ({
  currentMode,
  onModeChange,
  className = "",
  size = "md",
}) => {
  return (
    <div
      role="radiogroup"
      aria-label="Application Mode Selection"
      className={`inline-flex items-center p-1 rounded-full bg-slate-100 dark:bg-[#131c18] border border-slate-200 dark:border-emerald-950/60 shadow-inner ${className}`}
    >
      <button
        type="button"
        role="radio"
        aria-checked={currentMode === "companion"}
        onClick={() => onModeChange("companion")}
        className={`flex items-center gap-1.5 rounded-full font-medium transition-all duration-200 select-none ${
          size === "sm" ? "px-3 py-1 text-xs" : "px-4 py-1.5 text-sm"
        } ${
          currentMode === "companion"
            ? "bg-gradient-to-r from-emerald-100 via-teal-50 to-emerald-100 dark:from-emerald-950/80 dark:to-teal-950/70 text-emerald-900 dark:text-emerald-200 border border-emerald-300/80 dark:border-emerald-800/70 shadow-xs font-bold"
            : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
        }`}
      >
        <Users className={size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"} />
        <span>Companion Mode</span>
      </button>

      <button
        type="button"
        role="radio"
        aria-checked={currentMode === "travel"}
        onClick={() => onModeChange("travel")}
        className={`flex items-center gap-1.5 rounded-full font-medium transition-all duration-200 select-none ${
          size === "sm" ? "px-3 py-1 text-xs" : "px-4 py-1.5 text-sm"
        } ${
          currentMode === "travel"
            ? "bg-gradient-to-r from-orange-100 via-amber-50 to-orange-100 dark:from-orange-950/80 dark:to-amber-950/70 text-orange-900 dark:text-orange-200 border border-orange-300/80 dark:border-orange-800/70 shadow-xs font-bold"
            : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
        }`}
      >
        <Compass className={size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"} />
        <span>Travel Mode</span>
      </button>
    </div>
  );
};

