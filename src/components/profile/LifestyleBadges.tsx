"use client";

import React from "react";
import Link from "next/link";
import {
  Cigarette,
  Wine,
  Salad,
  Sparkles,
  Settings,
  EyeOff,
  Coffee,
  Sun,
  Moon,
  PawPrint,
  Dumbbell,
  Compass,
} from "lucide-react";

export interface LifestyleHabits {
  smokingHabit?: "NON_SMOKER" | "OCCASIONAL" | "REGULAR" | "PREFER_NOT_TO_SAY" | string | null;
  drinkingHabit?: "NON_DRINKER" | "SOCIAL" | "REGULAR" | "PREFER_NOT_TO_SAY" | string | null;
  dietaryPreference?: "PURE_VEG" | "EGGETARIAN" | "NON_VEG" | "VEGAN" | "ANY" | string | null;
  lifestyleTags?: string[];
  showLifestylePublic?: boolean;
}

interface LifestyleBadgesProps {
  lifestyle?: LifestyleHabits;
  isOwn: boolean;
}

export const LifestyleBadges: React.FC<LifestyleBadgesProps> = ({ lifestyle, isOwn }) => {
  const showPublic = lifestyle?.showLifestylePublic !== false;

  // If visitor and user turned off public visibility, don't show
  if (!isOwn && !showPublic) {
    return null;
  }

  const smoking = lifestyle?.smokingHabit;
  const drinking = lifestyle?.drinkingHabit;
  const diet = lifestyle?.dietaryPreference;
  const tags = Array.isArray(lifestyle?.lifestyleTags) ? lifestyle.lifestyleTags : [];

  const hasAnyHabit =
    (smoking && smoking !== "PREFER_NOT_TO_SAY") ||
    (drinking && drinking !== "PREFER_NOT_TO_SAY") ||
    (diet && diet !== "ANY") ||
    tags.length > 0;

  if (!hasAnyHabit) {
    if (!isOwn) return null;
    return (
      <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-[#111915] border border-slate-200/80 dark:border-emerald-950/70 text-xs">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span className="text-slate-600 dark:text-slate-300 font-semibold">
            Add your lifestyle badges (smoker / drinker / diet)
          </span>
        </div>
        <Link
          href="/settings"
          className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Edit in Settings</span>
        </Link>
      </div>
    );
  }

  const getSmokingBadge = () => {
    switch (smoking) {
      case "NON_SMOKER":
        return {
          icon: "🚭",
          label: "Non-Smoker",
          bg: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
        };
      case "OCCASIONAL":
        return {
          icon: "🚬",
          label: "Social Smoker",
          bg: "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
        };
      case "REGULAR":
        return {
          icon: "💨",
          label: "Regular Smoker",
          bg: "bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800",
        };
      default:
        return null;
    }
  };

  const getDrinkingBadge = () => {
    switch (drinking) {
      case "NON_DRINKER":
        return {
          icon: "🧃",
          label: "Non-Drinker",
          bg: "bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800",
        };
      case "SOCIAL":
        return {
          icon: "🥂",
          label: "Social Drinker",
          bg: "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
        };
      case "REGULAR":
        return {
          icon: "🍷",
          label: "Regular Drinker",
          bg: "bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
        };
      default:
        return null;
    }
  };

  const getDietBadge = () => {
    switch (diet) {
      case "PURE_VEG":
        return {
          icon: "🥗",
          label: "Pure Veg",
          bg: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
        };
      case "EGGETARIAN":
        return {
          icon: "🍳",
          label: "Eggetarian",
          bg: "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
        };
      case "NON_VEG":
        return {
          icon: "🍗",
          label: "Non-Veg",
          bg: "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800",
        };
      case "VEGAN":
        return {
          icon: "🥑",
          label: "Vegan",
          bg: "bg-lime-50 dark:bg-lime-950/50 text-lime-700 dark:text-lime-300 border-lime-200 dark:border-lime-800",
        };
      default:
        return null;
    }
  };

  const smokingBadge = getSmokingBadge();
  const drinkingBadge = getDrinkingBadge();
  const dietBadge = getDietBadge();

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
          <span>Lifestyle &amp; Habits</span>
          {!showPublic && isOwn && (
            <span className="flex items-center gap-0.5 text-[9px] text-amber-600 dark:text-amber-400 font-semibold px-1.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50">
              <EyeOff className="w-2.5 h-2.5" />
              <span>Private to you</span>
            </span>
          )}
        </h4>
        {isOwn && (
          <Link
            href="/settings"
            className="text-[11px] font-bold text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition flex items-center gap-1"
          >
            <Settings className="w-3 h-3" />
            <span>Edit</span>
          </Link>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {/* Smoking Badge */}
        {smokingBadge && (
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border text-xs font-bold shadow-xs transition hover:scale-105 select-none ${smokingBadge.bg}`}
          >
            <span className="text-sm leading-none">{smokingBadge.icon}</span>
            <span>{smokingBadge.label}</span>
          </div>
        )}

        {/* Drinking Badge */}
        {drinkingBadge && (
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border text-xs font-bold shadow-xs transition hover:scale-105 select-none ${drinkingBadge.bg}`}
          >
            <span className="text-sm leading-none">{drinkingBadge.icon}</span>
            <span>{drinkingBadge.label}</span>
          </div>
        )}

        {/* Dietary Badge */}
        {dietBadge && (
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border text-xs font-bold shadow-xs transition hover:scale-105 select-none ${dietBadge.bg}`}
          >
            <span className="text-sm leading-none">{dietBadge.icon}</span>
            <span>{dietBadge.label}</span>
          </div>
        )}

        {/* Additional Lifestyle Tags */}
        {tags.map((tag: string) => (
          <div
            key={tag}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-2xl border border-slate-200 dark:border-emerald-950/80 bg-slate-50 dark:bg-[#121c17] text-slate-700 dark:text-slate-300 text-xs font-semibold select-none shadow-xs"
          >
            <span>{tag}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
