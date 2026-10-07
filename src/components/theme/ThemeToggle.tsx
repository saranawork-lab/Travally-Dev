"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "./ThemeProvider";
import { Sun, Moon } from "lucide-react";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = "",
  showLabel = false,
}) => {
  const { resolvedTheme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={`w-9 h-9 rounded-full border border-slate-200 dark:border-emerald-900/50 bg-slate-100 dark:bg-[#131c18] animate-pulse ${className}`}
      />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className={`group relative flex items-center justify-center gap-2 p-2 rounded-full border transition-all duration-200 ${
        isDark
          ? "bg-[#131c18] border-emerald-800/40 text-emerald-400 hover:text-emerald-300 hover:border-emerald-500/60 hover:bg-[#18241f] shadow-sm shadow-emerald-950/50"
          : "bg-white border-slate-200 text-slate-700 hover:text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50/50 shadow-sm"
      } ${className}`}
    >
      <div className="relative w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
        {/* Sun Icon for switching to light mode */}
        <Sun
          className={`w-4 h-4 transition-all duration-300 ${
            isDark
              ? "rotate-0 scale-100 text-emerald-400"
              : "-rotate-90 scale-0 opacity-0 absolute"
          }`}
        />
        {/* Moon Icon for switching to dark mode */}
        <Moon
          className={`w-4 h-4 transition-all duration-300 ${
            isDark
              ? "rotate-90 scale-0 opacity-0 absolute"
              : "rotate-0 scale-100 text-slate-700 group-hover:text-emerald-600"
          }`}
        />
      </div>

      {showLabel && (
        <span className="text-xs font-semibold select-none pr-1">
          {isDark ? "Light Mode" : "Dark Mode"}
        </span>
      )}
    </button>
  );
};

export default ThemeToggle;

