"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  ArrowUpDown,
  Check,
  ChevronDown,
  X,
  Users,
  Layers,
  Zap,
  Calendar,
  RotateCcw,
} from "lucide-react";
import {
  IconMovies,
  IconFood,
  IconSports,
  IconTech,
  IconPubs,
  IconShopping,
  IconDrives,
  IconHangouts,
} from "@/constants/categories";

const CATEGORIES = [
  { id: "ALL", label: "All Activities", icon: Layers },
  { id: "MOVIES", label: "Movies & Cinema", icon: IconMovies },
  { id: "FOOD_CAFES", label: "Street Food & Cafes", icon: IconFood },
  { id: "WALKING", label: "Turf Sports & Fitness", icon: IconSports },
  { id: "STUDYING", label: "Tech & Networking", icon: IconTech },
  { id: "EVENTS", label: "Nightlife & Pubs", icon: IconPubs },
  { id: "CITY_EXPLORATION", label: "Long Drives & Getaways", icon: IconDrives },
  { id: "SHOPPING", label: "Shopping & Bazaars", icon: IconShopping },
  { id: "OTHER", label: "Other Hangouts", icon: IconHangouts },
];

const SORT_OPTIONS = [
  { id: "UPCOMING", label: "Upcoming Soonest", shortLabel: "Soonest", icon: Calendar },
  { id: "SPOTS_LEFT", label: "Most Spots Available", shortLabel: "Spots Left", icon: Users },
  { id: "NEWEST", label: "Recently Added", shortLabel: "Newest", icon: Zap },
  { id: "TITLE", label: "Activity Name (A-Z)", shortLabel: "Name", icon: ArrowUpDown },
];

export interface ActivityFiltersProps {
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  sortBy?: string;
  onSortChange?: (sort: string) => void;
}

export const ActivityFilters: React.FC<ActivityFiltersProps> = ({
  selectedCategory,
  onSelectCategory,
  sortBy = "UPCOMING",
  onSortChange,
}) => {
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const categoryRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  // Click outside to dismiss dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target as Node)) {
        setCategoryOpen(false);
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

  const activeCategory =
    CATEGORIES.find((c) => c.id === selectedCategory) || CATEGORIES[0];
  const activeSort =
    SORT_OPTIONS.find((s) => s.id === sortBy) || SORT_OPTIONS[0];

  const hasActiveFilters =
    selectedCategory !== "ALL" || sortBy !== "UPCOMING";

  const handleReset = () => {
    onSelectCategory("ALL");
    if (onSortChange) onSortChange("UPCOMING");
  };

  const ActiveCategoryIcon = activeCategory.icon;

  return (
    <div className="space-y-2.5 mb-4">
      {/* ── FILTER & SORT CONTROLS BAR (Mobile Horizontal Scrollable Strip) ── */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
        {/* Category Dropdown */}
        <div className="relative shrink-0" ref={categoryRef}>
          <button
            type="button"
            onClick={() => {
              setCategoryOpen(!categoryOpen);
              setSortOpen(false);
            }}
            className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-full text-xs font-semibold transition shadow-xs border select-none whitespace-nowrap shrink-0 ${
              selectedCategory !== "ALL"
                ? "bg-emerald-500 text-white border-emerald-600 shadow-emerald-500/20 font-bold"
                : "bg-white dark:bg-[#111a15] text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-emerald-950/70 hover:border-emerald-400 dark:hover:border-emerald-600"
            }`}
          >
            <ActiveCategoryIcon className="w-3.5 h-3.5 shrink-0" />
            <span>
              {selectedCategory === "ALL" ? "All Categories" : activeCategory.label}
            </span>
            <ChevronDown
              className={`w-3 h-3 opacity-70 transition-transform shrink-0 ${
                categoryOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Category Dropdown Menu */}
          {categoryOpen && (
            <div className="absolute left-0 top-full mt-1.5 w-60 sm:w-64 bg-white dark:bg-[#111a15] border border-slate-200 dark:border-emerald-950/80 rounded-2xl shadow-xl p-1.5 z-50 animate-in fade-in-50 zoom-in-95">
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Filter by Category
              </div>
              <div className="max-h-64 overflow-y-auto space-y-0.5 scrollbar-none">
                {CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        onSelectCategory(cat.id);
                        setCategoryOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
                        isSelected
                          ? "bg-emerald-500 text-white font-bold"
                          : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1a2520]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{cat.label}</span>
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
              setCategoryOpen(false);
            }}
            className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-full text-xs font-semibold transition shadow-xs border select-none whitespace-nowrap shrink-0 ${
              sortBy !== "UPCOMING"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-xs font-bold"
                : "bg-white dark:bg-[#111a15] text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-emerald-950/70 hover:border-emerald-400 dark:hover:border-emerald-600"
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
                {SORT_OPTIONS.map((opt) => {
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
                          ? "bg-emerald-500 text-white font-bold"
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
          {selectedCategory !== "ALL" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
              <ActiveCategoryIcon className="w-3 h-3 shrink-0" />
              <span>{activeCategory.label}</span>
              <button
                type="button"
                onClick={() => onSelectCategory("ALL")}
                className="hover:opacity-75 p-0.5"
                aria-label="Remove category filter"
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
