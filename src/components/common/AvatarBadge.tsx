"use client";

import React from "react";
import { User } from "lucide-react";
import { getBadgeForRank, UserBadge } from "@/lib/badges";

export interface AvatarBadgeProps {
  avatarUrl?: string | null;
  src?: string | null;
  displayName?: string | null;
  name?: string | null;
  rank?: number | null;
  badge?: UserBadge | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  showBanner?: boolean;
  showRibbon?: boolean;
  showCrown?: boolean;
  className?: string;
}

export function AvatarBadge({
  avatarUrl,
  src,
  displayName,
  name,
  rank,
  badge: customBadge,
  size = "md",
  showBanner = false,
  showRibbon = false,
  showCrown = true,
  className = "",
}: AvatarBadgeProps) {
  const actualUrl = avatarUrl || src;
  const actualName = displayName || name || "Explorer";
  const actualRank = typeof rank === "number" ? rank : 1;
  const actualShowBanner = showBanner || showRibbon;
  const badge = customBadge || getBadgeForRank(actualRank);

  // Size mappings
  const sizeConfig = {
    xs: {
      wrapper: "w-5 h-5 min-w-[20px] min-h-[20px]",
      img: "w-5 h-5",
      text: "text-[9px]",
      crown: "w-2.5 h-2.5 -top-2",
      banner: "text-[7px] px-1 -bottom-2",
    },
    sm: {
      wrapper: "w-7 h-7 min-w-[28px] min-h-[28px]",
      img: "w-7 h-7",
      text: "text-[11px]",
      crown: "w-3 h-3 -top-2.5",
      banner: "text-[8px] px-1.5 -bottom-2.5",
    },
    md: {
      wrapper: "w-9 h-9 min-w-[36px] min-h-[36px]",
      img: "w-9 h-9",
      text: "text-xs",
      crown: "w-3.5 h-3.5 -top-3",
      banner: "text-[9px] px-2 -bottom-3",
    },
    lg: {
      wrapper: "w-14 h-14 min-w-[56px] min-h-[56px]",
      img: "w-14 h-14",
      text: "text-base",
      crown: "w-5 h-5 -top-4",
      banner: "text-[10px] px-2.5 py-0.5 -bottom-3.5",
    },
    xl: {
      wrapper: "w-20 h-20 min-w-[80px] min-h-[80px]",
      img: "w-20 h-20",
      text: "text-2xl",
      crown: "w-6 h-6 -top-5",
      banner: "text-xs px-3 py-0.5 -bottom-4",
    },
    "2xl": {
      wrapper: "w-28 h-28 min-w-[112px] min-h-[112px]",
      img: "w-28 h-28",
      text: "text-4xl",
      crown: "w-8 h-8 -top-6",
      banner: "text-xs px-3.5 py-1 -bottom-4.5",
    },
  };

  const config = sizeConfig[size];

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${config.wrapper} ${className}`}
      title={badge.hasBadge ? `${badge.title} — ${badge.description}` : displayName || "Explorer"}
    >
      {/* Ambient Pulsing Aura Behind Badge (for Founding & Milestone Members) */}
      {badge.hasBadge && (
        <div
          className={`absolute -inset-1.5 rounded-full bg-gradient-to-tr ${badge.glowClass} blur-md opacity-75 pointer-events-none animate-pulse`}
        />
      )}

      {/* Royal Crown / Emblem Topper for Genesis #1 */}
      {showCrown && badge.rank === 1 && (
        <div
          className={`absolute left-1/2 -translate-x-1/2 ${config.crown} z-20 flex items-center justify-center pointer-events-none drop-shadow-[0_2px_8px_rgba(245,158,11,0.9)]`}
        >
          <span className="text-amber-300 animate-bounce">👑</span>
        </div>
      )}

      {/* Pioneer Lightning Topper for Top 10 (#2 - #10) */}
      {showCrown && badge.rank >= 2 && badge.rank <= 10 && (
        <div
          className={`absolute left-1/2 -translate-x-1/2 ${config.crown} z-20 flex items-center justify-center pointer-events-none drop-shadow-[0_2px_8px_rgba(6,182,212,0.9)]`}
        >
          <span className="text-cyan-300">⚡</span>
        </div>
      )}

      {/* Avatar Circle Container with Exclusive Border Frame */}
      <div
        className={`relative w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-slate-100 dark:bg-slate-900 ${
          badge.hasBadge ? badge.ringClass : "ring-1.5 ring-slate-300 dark:ring-emerald-800/60"
        } transition-transform duration-300`}
      >
        {actualUrl ? (
          <img
            src={actualUrl}
            alt={actualName || "Avatar"}
            className="w-full h-full object-cover select-none"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              const nextSibling = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
              if (nextSibling) nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        
        <span 
          className={`font-black text-emerald-800 dark:text-emerald-300 ${config.text} select-none ${actualUrl ? 'hidden' : 'flex'} items-center justify-center w-full h-full`}
        >
          {actualName ? actualName.charAt(0).toUpperCase() : <User className="w-1/2 h-1/2 text-slate-400" />}
        </span>
      </div>

      {/* Ribbon / Pill Banner Under Avatar */}
      {actualShowBanner && badge.hasBadge && (
        <div
          className={`absolute left-1/2 -translate-x-1/2 ${config.banner} z-20 rounded-full ${badge.pillGradient} whitespace-nowrap tracking-tight uppercase shadow-md select-none border border-white/30`}
        >
          <span>{badge.badgeLabel}</span>
        </div>
      )}
    </div>
  );
}
