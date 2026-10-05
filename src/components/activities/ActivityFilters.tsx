"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  SlidersHorizontal,
  ArrowUpDown,
  Check,
  ChevronDown,
  X,
  Users,
  Sparkles,
  Calendar,
  Film,
  Coffee,
  Footprints,
  BookOpen,
  Ticket,
  Compass,
  ShoppingBag,
  RotateCcw,
} from "lucide-react";

const CATEGORIES = [
  { id: "ALL", label: "All Activities", icon: Sparkles },
  { id: "MOVIES", label: "Movies & Cinema", icon: Film },
  { id: "FOOD_CAFES", label: "Street Food & Cafes", icon: Coffee },
  { id: "WALKING", label: "Turf Sports & Fitness", icon: Footprints },
  { id: "STUDYING", label: "Tech & Networking", icon: BookOpen },
  { id: "EVENTS", label: "Standup & Concerts", icon: Ticket },
  { id: "CITY_EXPLORATION", label: "Long Drives & Getaways", icon: Compass },
  { id: "SHOPPING", label: "Shopping & Bazaars", icon: ShoppingBag },
];

const SORT_OPTIONS = [
  { id: "UPCOMING", label: "Upcoming Soonest", icon: Calendar },
  { id: "SPOTS_LEFT", label: "Most Spots Available", icon: Users },
  { id: "NEWEST", label: "Recently Added", icon: Sparkles },
  { id: "TITLE", label: "Activity Name (A-Z)", icon: ArrowUpDown },
];

export interface ActivityFiltersProps {
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  sortBy?: string;
  onSortChange?: (sort: string) => void;
  openSpotsOnly?: boolean;
  onOpenSpotsToggle?: (val: boolean) => void;
  totalCount?: number;
}

export const ActivityFilters: React.FC<ActivityFiltersProps> = ({
  selectedCategory,
  onSelectCategory,
  sortBy = "UPCOMING",
  onSortChange,
  openSpotsOnly = false,
  onOpenSpotsToggle,
  totalCount,
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
    selectedCategory !== "ALL" || openSpotsOnly || sortBy !== "UPCOMING";

  const handleReset = () => {
    onSelectCategory("ALL");
    if (onOpenSpotsToggle) onOpenSpotsToggle(false);
    if (onSortChange) onSortChange("UPCOMING");
  };

  const ActiveCategoryIcon = activeCategory.icon;

  return (
    <div className="space-y-3 mb-6">
      {/* ── FILTER & SORT CONTROLS BAR ── */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Dropdown */}
          <div className="relative" ref={categoryRef}>
            <button
              type="button"
              onClick={() => {
                setCategoryOpen(!categoryOpen);
                setSortOpen(false);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition shadow-xs border select-none min-h-[40px] ${
                selectedCategory !== "ALL"
                  ? "bg-emerald-500 text-white border-emerald-600 shadow-emerald-500/20"
                  : "bg-white dark:bg-[#131c18] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-emerald-950/70 hover:border-emerald-400 dark:hover:border-emerald-600"
              }`}
            >
              <ActiveCategoryIcon className="w-3.5 h-3.5 shrink-0" />
              <span>
                {selectedCategory === "ALL"
                  ? "All Categories"
                  : activeCategory.label}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 opacity-70 transition-transform ${
                  categoryOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Category Dropdown Menu */}
            {categoryOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-60 sm:w-64 bg-white dark:bg-[#131c18] border border-slate-200 dark:border-emerald-950/80 rounded-2xl shadow-xl p-1.5 z-50 animate-in fade-in-50 zoom-in-95">
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
          <div className="relative" ref={sortRef}>
            <button
              type="button"
              onClick={() => {
                setSortOpen(!sortOpen);
                setCategoryOpen(false);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition shadow-xs border select-none min-h-[40px] ${
                sortBy !== "UPCOMING"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-xs"
                  : "bg-white dark:bg-[#131c18] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-emerald-950/70 hover:border-emerald-400 dark:hover:border-emerald-600"
              }`}
            >
              <ArrowUpDown className="w-3.5 h-3.5 shrink-0 text-slate-500" />
              <span>Sort: {activeSort.label}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 opacity-70 transition-transform ${
                  sortOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Sort Dropdown Menu */}
            {sortOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-56 bg-white dark:bg-[#131c18] border border-slate-200 dark:border-emerald-950/80 rounded-2xl shadow-xl p-1.5 z-50 animate-in fade-in-50 zoom-in-95">
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

          {/* Quick Filter: Open Spots Only */}
          {onOpenSpotsToggle && (
            <button
              type="button"
              onClick={() => onOpenSpotsToggle(!openSpotsOnly)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-semibold transition shadow-xs border select-none min-h-[40px] ${
                openSpotsOnly
                  ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 font-bold"
                  : "bg-white dark:bg-[#131c18] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-emerald-950/70 hover:border-slate-300"
              }`}
            >
              <Users className="w-3.5 h-3.5 shrink-0" />
              <span>Spots Available</span>
              {openSpotsOnly && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              )}
            </button>
          )}
        </div>

        {/* Counter or Reset */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 transition select-none py-1 px-2"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset filters</span>
          </button>
        )}
      </div>

      {/* ── ACTIVE FILTER PILLS (IF ANY ARE APPLIED) ── */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {selectedCategory !== "ALL" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
              <ActiveCategoryIcon className="w-3 h-3" />
              <span>{activeCategory.label}</span>
              <button
                type="button"
                onClick={() => onSelectCategory("ALL")}
                className="hover:opacity-75 p-0.5"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          )}

          {openSpotsOnly && onOpenSpotsToggle && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
              <Users className="w-3 h-3" />
              <span>Spots Available</span>
              <button
                type="button"
                onClick={() => onOpenSpotsToggle(false)}
                className="hover:opacity-75 p-0.5"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          )}

          {sortBy !== "UPCOMING" && onSortChange && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
              <ArrowUpDown className="w-3 h-3" />
              <span>{activeSort.label}</span>
              <button
                type="button"
                onClick={() => onSortChange("UPCOMING")}
                className="hover:opacity-75 p-0.5"
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

