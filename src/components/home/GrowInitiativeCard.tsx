"use client";

import React from "react";
import {
  MapPin,
  Calendar,
  Users,
  Sprout,
  Waves,
  Trees,
  HeartHandshake,
  PawPrint,
  ShieldAlert,
  Loader2,
  Check,
} from "lucide-react";

export interface GrowInitiative {
  id: string;
  organizerId: string;
  organizerName: string;
  organizerAvatar?: string | null;
  organizerCity?: string | null;
  title: string;
  description: string;
  causeCategory: string;
  locationName: string;
  date?: string | null;
  volunteersNeeded: number;
  volunteersCount: number;
  joinedUserIds: string[];
  imageUrl?: string | null;
  createdAt: string;
}

interface GrowInitiativeCardProps {
  item: GrowInitiative;
  currentUser?: { id: string } | null;
  hasJoined: boolean;
  isJoining: boolean;
  onToggleJoin: (id: string) => void | Promise<void>;
  onOpenProfile: (user: {
    id: string;
    email: string;
    profile: {
      displayName?: string;
      fullName?: string;
      avatarUrl?: string | null;
    };
  }) => void;
  className?: string;
}

export const GrowInitiativeCard: React.FC<GrowInitiativeCardProps> = ({
  item,
  hasJoined,
  isJoining,
  onToggleJoin,
  onOpenProfile,
  className = "",
}) => {
  // Category styling config
  const getCauseConfig = (cat: string) => {
    switch (cat?.toUpperCase()) {
      case "PLANTATION":
        return {
          label: "Plantation",
          icon: Sprout,
          badge:
            "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60",
          iconColor: "text-emerald-600 dark:text-emerald-400",
        };
      case "CLEAN_OCEAN":
      case "CLEAN_BEACH":
        return {
          label: "Clean Ocean",
          icon: Waves,
          badge:
            "bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border-cyan-200/80 dark:border-cyan-800/60",
          iconColor: "text-cyan-600 dark:text-cyan-400",
        };
      case "NATURE":
        return {
          label: "Nature Care",
          icon: Trees,
          badge:
            "bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-200/80 dark:border-teal-800/60",
          iconColor: "text-teal-600 dark:text-teal-400",
        };
      case "HUMANITY":
      case "COMMUNITY_AID":
        return {
          label: "Humanity Aid",
          icon: HeartHandshake,
          badge:
            "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60",
          iconColor: "text-amber-600 dark:text-amber-400",
        };
      case "ANIMAL_WELFARE":
        return {
          label: "Animal Rescue",
          icon: PawPrint,
          badge:
            "bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border-orange-200/80 dark:border-orange-800/60",
          iconColor: "text-orange-600 dark:text-orange-400",
        };
      default:
        return {
          label: cat ? cat.replace(/_/g, " ") : "Eco Action",
          icon: Sprout,
          badge:
            "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60",
          iconColor: "text-emerald-600 dark:text-emerald-400",
        };
    }
  };

  const cause = getCauseConfig(item.causeCategory);
  const CauseIcon = cause.icon;

  const count = item.volunteersCount || 0;
  const needed = Math.max(1, item.volunteersNeeded || 10);
  const pct = Math.min(100, Math.round((count / needed) * 100));
  const spotsLeft = Math.max(0, needed - count);

  return (
    <div
      className={`h-auto flex flex-col justify-between rounded-[24px] bg-white dark:bg-[#0c1410] border border-slate-200/85 dark:border-emerald-950/80 hover:border-emerald-500/40 p-4 sm:p-5 shadow-sm hover:shadow-[0_12px_28px_-8px_rgba(16,185,129,0.12)] transition-all duration-200 group relative select-none ${className}`}
    >
      {/* ── TOP SECTION: Cause Badge + Host Info ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {/* Cause category badge */}
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10.5px] font-black uppercase tracking-wider border shadow-xs ${cause.badge}`}
          >
            <CauseIcon className={`w-3 h-3 ${cause.iconColor}`} />
            <span>{cause.label}</span>
          </span>

          {/* Organizer link with avatar */}
          <button
            type="button"
            onClick={() =>
              onOpenProfile({
                id: item.organizerId,
                email: "",
                profile: {
                  displayName: item.organizerName,
                  fullName: item.organizerName,
                  avatarUrl: item.organizerAvatar,
                },
              })
            }
            className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-300 transition group/host cursor-pointer"
            title={`View ${item.organizerName}'s profile`}
          >
            <div className="w-5 h-5 rounded-full overflow-hidden bg-emerald-100 dark:bg-emerald-950/80 flex items-center justify-center text-[10px] font-bold text-emerald-800 dark:text-emerald-300 shrink-0 border border-emerald-300/60 dark:border-emerald-800/60">
              {item.organizerAvatar ? (
                <img
                  src={item.organizerAvatar}
                  alt={item.organizerName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{item.organizerName.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <span className="font-medium group-hover/host:underline truncate max-w-[150px]">
              Organized by <strong className="font-semibold text-slate-700 dark:text-slate-200">{item.organizerName}</strong>
            </span>
          </button>
        </div>

        {/* ── INITIATIVE TITLE (Bold, High Contrast, Prominent) ── */}
        <h3 className="font-extrabold text-base sm:text-[17px] text-slate-900 dark:text-white leading-snug tracking-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
          {item.title}
        </h3>

        {/* ── FULL HIGHLIGHTED DESCRIPTION (Auto-adjusts card height with no truncation) ── */}
        <p className="text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed font-normal whitespace-pre-wrap break-words">
          {item.description}
        </p>

        {/* ── LOCATION & DATE DETAILS (Clean, Crisp, Minimal) ── */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400 pt-1">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
            <span className="font-medium truncate max-w-[220px]" title={item.locationName}>
              {item.locationName}
            </span>
          </span>

          {item.date && (
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="font-medium">
                {new Date(item.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* ── BOTTOM SECTION: Volunteer Progress Meter + Action Button (45% / 10% / 45% RATIO) ── */}
      <div className="pt-3.5 mt-3.5 border-t border-slate-100 dark:border-emerald-950/60 flex items-center justify-between gap-3 sm:gap-4">
        {/* Left: 45% Ratio for Volunteer Counter & Full Width Progress Bar */}
        <div className="w-[45%] sm:w-[44%] flex-shrink-0 space-y-1.5">
          <div className="flex items-center justify-between gap-1 text-xs">
            <span className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 font-bold text-[11.5px] truncate">
              <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>
                <strong className="text-slate-900 dark:text-white">{count}</strong>/{needed}
              </span>
            </span>

            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-full shrink-0 border border-emerald-200/60 dark:border-emerald-800/40">
              {spotsLeft === 0 ? "Full" : `${spotsLeft} left`}
            </span>
          </div>

          {/* Micro progress bar stretching across the 45% column */}
          <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-emerald-950/60 overflow-hidden shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* ~10% Spacing gap in between */}

        {/* Right: 45% Ratio for Redesigned Button */}
        <div className="w-[45%] sm:w-[44%] flex-shrink-0 flex justify-end">
          <button
            type="button"
            onClick={() => onToggleJoin(item.id)}
            disabled={isJoining}
            className={`w-full group relative overflow-hidden inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-2.5 rounded-2xl text-[11.5px] sm:text-xs font-extrabold transition-all duration-200 active:scale-95 cursor-pointer disabled:opacity-60 select-none shadow-sm ${
              hasJoined
                ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 border border-emerald-300/80 dark:border-emerald-700/60 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
                : "bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600 hover:from-emerald-500 hover:via-teal-400 hover:to-cyan-500 text-white shadow-[0_4px_16px_rgba(20,184,166,0.35)] hover:shadow-[0_6px_22px_rgba(20,184,166,0.5)] border border-white/20"
            }`}
          >
            {/* Subtle light shimmer sweep on hover */}
            {!hasJoined && !isJoining && (
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
            )}

            {isJoining ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                <span className="truncate">Updating...</span>
              </>
            ) : hasJoined ? (
              <>
                <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
                <span className="truncate">Joined</span>
              </>
            ) : (
              <>
                <Sprout className="w-3.5 h-3.5 text-cyan-200 group-hover:scale-110 group-hover:rotate-12 transition-transform shrink-0" />
                <span className="truncate">Volunteer & Join</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
