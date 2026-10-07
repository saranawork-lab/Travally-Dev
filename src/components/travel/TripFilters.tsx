"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  SlidersHorizontal,
  ArrowUpDown,
  Check,
  ChevronDown,
  X,
  Users,
  Zap,
  Calendar,
  Compass,
  Landmark,
  Footprints,
  Luggage,
  Mountain,
  Car,
  Gem,
  RotateCcw,
} from "lucide-react";

import {
  IconCultural,
  IconSlowTravel,
  IconBackpacking,
  IconAdventure,
  IconRoadTrip,
  IconLuxury,
  IconRelaxation,
} from "@/constants/categories";

const TRAVEL_STYLES = [
  { id: "ALL", label: "All Styles", icon: Compass },
  { id: "CULTURAL", label: "Cultural & Heritage", icon: IconCultural },
  { id: "SLOW_TRAVEL", label: "Slow Travel", icon: IconSlowTravel },
  { id: "BACKPACKING", label: "Backpacking & Hostels", icon: IconBackpacking },
  { id: "ADVENTURE", label: "Adventure & Hiking", icon: IconAdventure },
  { id: "ROAD_TRIP", label: "Scenic Road Trip", icon: IconRoadTrip },
  { id: "LUXURY", label: "Boutique & Luxury", icon: IconLuxury },
  { id: "RELAXATION", label: "Relaxation & Wellness", icon: IconRelaxation },
];

const TRIP_SORT_OPTIONS = [
  { id: "UPCOMING", label: "Departure Soonest", shortLabel: "Soonest", icon: Calendar },
  { id: "SPOTS_LEFT", label: "Most Spots Available", shortLabel: "Spots Left", icon: Users },
  { id: "NEWEST", label: "Recently Posted", shortLabel: "Newest", icon: Zap },
  { id: "DESTINATION", label: "Destination (A-Z)", shortLabel: "Destination", icon: ArrowUpDown },
];

export interface TripFiltersProps {
  selectedStyle: string;
  onSelectStyle: (style: string) => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  sortBy?: string;
  onSortChange?: (sort: string) => void;
  openSpotsOnly?: boolean;
  onOpenSpotsToggle?: (val: boolean) => void;
  totalCount?: number;
}

export const TripFilters: React.FC<TripFiltersProps> = ({
  selectedStyle,
  onSelectStyle,
  sortBy = "UPCOMING",
  onSortChange,
  openSpotsOnly = false,
  onOpenSpotsToggle,
  totalCount,
}) => {
  const [styleOpen, setStyleOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const styleRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  // Click outside to dismiss dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (styleRef.current && !styleRef.current.contains(e.target as Node)) {
        setStyleOpen(false);
      }
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const activeStyle =
    TRAVEL_STYLES.find((s) => s.id === selectedStyle) || TRAVEL_STYLES[0];
  const activeSort =
    TRIP_SORT_OPTIONS.find((s) => s.id === sortBy) || TRIP_SORT_OPTIONS[0];

  const hasActiveFilters =
    selectedStyle !== "ALL" || sortBy !== "UPCOMING";

  const handleReset = () => {
    onSelectStyle("ALL");
    if (onSortChange) onSortChange("UPCOMING");
  };

  const ActiveStyleIcon = activeStyle.icon;

  return (
    <div className="space-y-2.5 mb-4">
      {/* ── FILTER & SORT CONTROLS BAR (Mobile Horizontal Scrollable Strip) ── */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
        {/* Travel Style Dropdown */}
        <div className="relative shrink-0" ref={styleRef}>
          <button
            type="button"
            onClick={() => {
              setStyleOpen(!styleOpen);
              setSortOpen(false);
            }}
            className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-full text-xs font-semibold transition shadow-xs border select-none whitespace-nowrap shrink-0 ${
              selectedStyle !== "ALL"
                ? "bg-orange-500 text-white border-orange-600 shadow-orange-500/20 font-bold"
                : "bg-white dark:bg-[#111a15] text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-emerald-950/70 hover:border-orange-400 dark:hover:border-orange-600"
            }`}
          >
            <ActiveStyleIcon className="w-3.5 h-3.5 shrink-0" />
            <span>
              {selectedStyle === "ALL" ? "All Travel Styles" : activeStyle.label}
            </span>
            <ChevronDown
              className={`w-3 h-3 opacity-70 transition-transform shrink-0 ${
                styleOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Travel Style Dropdown Menu */}
          {styleOpen && (
            <div className="absolute left-0 top-full mt-1.5 w-60 sm:w-64 bg-white dark:bg-[#111a15] border border-slate-200 dark:border-emerald-950/80 rounded-2xl shadow-xl p-1.5 z-50 animate-in fade-in-50 zoom-in-95">
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Filter by Travel Style
              </div>
              <div className="max-h-64 overflow-y-auto space-y-0.5 scrollbar-none">
                {TRAVEL_STYLES.map((st) => {
                  const isSelected = selectedStyle === st.id;
                  const Icon = st.icon;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => {
                        onSelectStyle(st.id);
                        setStyleOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
                        isSelected
                          ? "bg-orange-500 text-white font-bold"
                          : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1a2520]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{st.label}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sort By Dropdown */}
        <div className="relative shrink-0" ref={sortRef}>
          <button
            type="button"
            onClick={() => {
              setSortOpen(!sortOpen);
              setStyleOpen(false);
            }}
            className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-full text-xs font-semibold transition shadow-xs border select-none whitespace-nowrap shrink-0 ${
              sortBy !== "UPCOMING"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-xs font-bold"
                : "bg-white dark:bg-[#111a15] text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-emerald-950/70 hover:border-orange-400 dark:hover:border-orange-600"
            }`}
          >
            <ArrowUpDown className="w-3.5 h-3.5 shrink-0 text-slate-400" />
            <span>Sort: {activeSort.shortLabel || activeSort.label}</span>
            <ChevronDown
              className={`w-3 h-3 opacity-70 transition-transform shrink-0 ${
                sortOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Sort Dropdown Menu */}
          {sortOpen && (
            <div className="absolute left-0 top-full mt-1.5 w-56 bg-white dark:bg-[#111a15] border border-slate-200 dark:border-emerald-950/80 rounded-2xl shadow-xl p-1.5 z-50 animate-in fade-in-50 zoom-in-95">
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Sort Order
              </div>
              <div className="space-y-0.5">
                {TRIP_SORT_OPTIONS.map((opt) => {
                  const isSelected = sortBy === opt.id;
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        if (onSortChange) onSortChange(opt.id);
                        setSortOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
                        isSelected
                          ? "bg-orange-500 text-white font-bold"
                          : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1a2520]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span>{opt.label}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Counter or Reset Button */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1 text-[11px] font-bold text-rose-500 hover:text-rose-600 dark:text-rose-400 transition select-none py-1 px-2.5 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 shrink-0"
          >
            <RotateCcw className="w-3 h-3 shrink-0" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* ── ACTIVE FILTER PILLS ── */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          {selectedStyle !== "ALL" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-orange-50 dark:bg-orange-950/50 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-800/60">
              <ActiveStyleIcon className="w-3 h-3 shrink-0" />
              <span>{activeStyle.label}</span>
              <button
                type="button"
                onClick={() => onSelectStyle("ALL")}
                className="hover:opacity-75 p-0.5"
                aria-label="Remove style filter"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          )}

          {sortBy !== "UPCOMING" && onSortChange && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
              <ArrowUpDown className="w-3 h-3 shrink-0" />
              <span>{activeSort.label}</span>
              <button
                type="button"
                onClick={() => onSortChange("UPCOMING")}
                className="hover:opacity-75 p-0.5"
                aria-label="Reset sort"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};
