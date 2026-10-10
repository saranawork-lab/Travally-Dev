"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ModeToggle } from "@/components/common/ModeToggle";
import {
  ArrowLeft,
  ArrowRight,
  X,
  CheckCircle2,
  UploadCloud,
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
  IconCultural,
  IconSlowTravel,
  IconBackpacking,
  IconAdventure,
  IconRoadTrip,
  IconLuxury,
  IconRelaxation,
} from "@/constants/categories";

interface CompanionCategoryOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  tag: string;
  hint: string;
  popular?: boolean;
}

interface TravelStyleOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  desc: string;
  popular?: boolean;
}

const COMPANION_CATEGORIES: CompanionCategoryOption[] = [
  {
    id: "FOOD_CAFES",
    label: "Street Food & Cafes",
    tag: "Food Walks & Breweries",
    icon: <IconFood className="w-10 h-10" />,
    hint: "Midnight biryani runs, Irani chai, brewery hopping, street food tasting",
    popular: true,
  },
  {
    id: "MOVIES",
    label: "Movies & Cinema",
    tag: "Screenings & FDFS",
    icon: <IconMovies className="w-10 h-10" />,
    hint: "First day first show (FDFS), IMAX screenings, regional cinema, film festivals",
    popular: true,
  },
  {
    id: "WALKING",
    label: "Turf Sports & Fitness",
    tag: "Cricket & Badminton",
    icon: <IconSports className="w-10 h-10" />,
    hint: "Box cricket, weekend badminton, morning runs, turf football",
  },
  {
    id: "STUDYING",
    label: "Tech & Networking",
    tag: "Startups & Meetups",
    icon: <IconTech className="w-10 h-10" />,
    hint: "Startup mixers, coding meetups, co-working sessions, founder discussions",
  },
  {
    id: "EVENTS",
    label: "Nightlife & Pubs",
    tag: "Bars & Clubbing",
    icon: <IconPubs className="w-10 h-10" />,
    hint: "Pubs, bars, clubbing, night markets, evening entertainment",
  },
  {
    id: "SHOPPING",
    label: "Shopping & Bazaars",
    tag: "Street Shopping & Malls",
    icon: <IconShopping className="w-10 h-10" />,
    hint: "Night markets, Laad Bazaar, weekend mall hopping, flea markets",
  },
  {
    id: "CITY_EXPLORATION",
    label: "Long Drives & Getaways",
    tag: "Dhabas & Outskirts",
    icon: <IconDrives className="w-10 h-10" />,
    hint: "Late night drives to outskirts, dhaba dinners, weekend morning rides",
  },
  {
    id: "OTHER",
    label: "Other Hangouts",
    tag: "Board Games & Hobbies",
    icon: <IconHangouts className="w-10 h-10" />,
    hint: "Board game cafes, casual meetups, or any other shared interest",
  },
];

const TRAVEL_STYLES: TravelStyleOption[] = [
  {
    id: "CULTURAL",
    label: "Cultural & Heritage",
    icon: <IconCultural className="w-10 h-10" />,
    desc: "Historic districts, architecture, museums, culinary heritage",
    popular: true,
  },
  {
    id: "SLOW_TRAVEL",
    label: "Slow Travel",
    icon: <IconSlowTravel className="w-10 h-10" />,
    desc: "Neighborhood living, unhurried exploration, local immersion",
    popular: true,
  },
  {
    id: "BACKPACKING",
    label: "Backpacking & Hostels",
    icon: <IconBackpacking className="w-10 h-10" />,
    desc: "Hostels, flexible transit, budget-conscious exploration",
  },
  {
    id: "ADVENTURE",
    label: "Adventure & Hiking",
    icon: <IconAdventure className="w-10 h-10" />,
    desc: "Mountain trails, outdoor trekking, coastal walks",
  },
  {
    id: "ROAD_TRIP",
    label: "Scenic Road Trip",
    icon: <IconRoadTrip className="w-10 h-10" />,
    desc: "Coastal drives, countryside exploration, road journeys",
  },
  {
    id: "LUXURY",
    label: "Boutique & Luxury",
    icon: <IconLuxury className="w-10 h-10" />,
    desc: "Curated boutique stays, fine dining, private tours",
  },
  {
    id: "RELAXATION",
    label: "Relaxation & Wellness",
    icon: <IconRelaxation className="w-10 h-10" />,
    desc: "Hot springs, coastal retreats, peaceful escapes",
  },
];

interface UnifiedCreateFlowProps {
  initialMode: "companion" | "travel";
}

export function UnifiedCreateFlow({ initialMode }: UnifiedCreateFlowProps) {
  const [mode, setMode] = useState<"companion" | "travel">(initialMode);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");

  // Step 1: Tag selection, Step 2: Details form
  const [step, setStep] = useState<1 | 2>(1);

  // Companion form state
  const [companionData, setCompanionData] = useState({
    category: "",
    title: "",
    description: "",
    date: "",
    startTime: "18:30",
    approxDurationHours: "2.0",
    genderPreference: "ANY",
    additionalRequirements: "",
    cutoffHoursBeforeStart: "1",
    imageUrl: "",
  });

  // Travel form state
  const [travelData, setTravelData] = useState({
    travelStyle: "",
    destination: "",
    departureCity: "",
    startDate: "",
    endDate: "",
    budgetMin: "8000",
    budgetMax: "15000",
    currency: "INR",
    accommodationPreference: "HOSTEL",
    transportPreference: "TRAIN",
  });

  const [attractionInput, setAttractionInput] = useState("");
  const [attractions, setAttractions] = useState<string[]>([
    "Chalal Riverside Trail & Pine Forest",
    "Manikaran Hot Springs & Gurudwara",
  ]);

  const [interestInput, setInterestInput] = useState("");
  const [interests, setInterests] = useState<string[]>([
    "Mountain Treks",
    "Backpacking",
    "Himachali Cafes",
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedCategoryObj = COMPANION_CATEGORIES.find((c) => c.id === companionData.category);
  const selectedStyleObj = TRAVEL_STYLES.find((s) => s.id === travelData.travelStyle);

  // Smooth mode toggle without unmounting or white screen
  const handleModeChange = (newMode: "companion" | "travel") => {
    if (newMode === mode) return;
    const dir = newMode === "travel" ? "forward" : "backward";
    setDirection(dir);
    setMode(newMode);
    setStep(1);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", newMode === "travel" ? "/travel/create" : "/activities/create");
    }
  };

  const handleSelectCompanionCategory = (id: string) => {
    setCompanionData((prev) => ({ ...prev, category: id }));
    setStep(2);
  };

  const handleSelectTravelStyle = (id: string) => {
    setTravelData((prev) => ({ ...prev, travelStyle: id }));
    setStep(2);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image must be smaller than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setCompanionData({ ...companionData, imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const addAttraction = () => {
    if (attractionInput.trim() && !attractions.includes(attractionInput.trim())) {
      setAttractions([...attractions, attractionInput.trim()]);
      setAttractionInput("");
    }
  };

  const removeAttraction = (index: number) => {
    setAttractions(attractions.filter((_, i) => i !== index));
  };



  const handleCompanionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const now = new Date();
      const selectedDate = new Date(`${companionData.date}T${companionData.startTime}`);
      if (selectedDate <= now) {
        throw new Error("Cannot select a date and time in the past.");
      }

      const payload = {
        ...companionData,
        locationName: "Flexible / Local Area",
        maxParticipants: "2",
      };

      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create activity");
      }

      window.location.href = `/activities/${data.activity.id}`;
    } catch (err: any) {
      setError(err.message || "Failed to create activity");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTravelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        ...travelData,
        groupSizeMax: "3",
        plannedAttractions: attractions,
        interests,
      };

      const res = await fetch("/api/travel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create travel plan");
      }

      window.location.href = `/travel/${data.travelPlan.id}`;
    } catch (err: any) {
      setError(err.message || "Failed to create travel plan");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Directional variants for Image and Text slides
  const imgSlideVariants = {
    enter: (dir: "forward" | "backward") => ({
      x: dir === "forward" ? 22 : -22,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.2, ease: "easeOut" as const },
    },
    exit: (dir: "forward" | "backward") => ({
      x: dir === "forward" ? -22 : 22,
      opacity: 0,
      transition: { duration: 0.16, ease: "easeIn" as const },
    }),
  };

  const textSlideVariants = {
    enter: (dir: "forward" | "backward") => ({
      x: dir === "forward" ? 28 : -28,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.22, ease: "easeOut" as const, delay: 0.03 },
    },
    exit: (dir: "forward" | "backward") => ({
      x: dir === "forward" ? -28 : 28,
      opacity: 0,
      transition: { duration: 0.16, ease: "easeIn" as const },
    }),
  };

  const currentItems = mode === "companion" ? COMPANION_CATEGORIES : TRAVEL_STYLES;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 pb-36 sm:pb-28">
      <div
        className={`rounded-3xl border p-5 sm:p-8 shadow-lg relative overflow-hidden transition-colors duration-300 ${
          mode === "companion"
            ? "bg-white dark:bg-dark-card border-slate-200 dark:border-dark-border"
            : "bg-white dark:bg-[#111815] border-slate-200 dark:border-emerald-950/70"
        }`}
      >
        {/* Animated Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-emerald-950/40 h-1.5 rounded-full overflow-hidden mb-6">
          <div
            className={`h-full transition-all duration-500 ease-out rounded-full shadow-xs ${
              mode === "companion"
                ? "bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500"
                : "bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500"
            }`}
            style={{ width: step === 1 ? "50%" : "100%" }}
          />
        </div>

        {/* Header */}
        <div className="mb-6 pb-4 border-b border-slate-100 dark:border-dark-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5 w-full text-center flex flex-col items-center">
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <ModeToggle currentMode={mode} onModeChange={handleModeChange} size="sm" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Post an Activity
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
              {step === 1
                ? "First, choose the activity tag or category you want to do."
                : "Fill in the details for your planned activity."}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-xs font-semibold text-rose-800 dark:text-rose-200 animate-shake">
            {error}
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 1: CHOOSE TAG / CATEGORY */}
        {/* ========================================================================= */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {currentItems.map((item) => {
                const isSelected =
                  mode === "companion"
                    ? companionData.category === item.id
                    : travelData.travelStyle === item.id;

                const hintText = "hint" in item ? item.hint : (item as any).desc;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (mode === "companion") {
                        handleSelectCompanionCategory(item.id);
                      } else {
                        handleSelectTravelStyle(item.id);
                      }
                    }}
                    className={`p-4 rounded-2xl text-left border-2 transition-colors duration-200 flex items-start gap-3.5 group cursor-pointer overflow-hidden ${
                      isSelected
                        ? mode === "companion"
                          ? "bg-emerald-50 dark:bg-emerald-950/70 border-emerald-500 text-slate-900 dark:text-white ring-2 ring-emerald-500/30"
                          : "bg-orange-50 dark:bg-orange-950/60 border-orange-500 text-slate-900 dark:text-white ring-2 ring-orange-500/30"
                        : mode === "companion"
                        ? "bg-slate-50/80 dark:bg-dark-elevated border-slate-200/90 dark:border-dark-border text-slate-900 dark:text-slate-100 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                        : "bg-slate-50/80 dark:bg-[#16201b] border-slate-200/90 dark:border-emerald-950/60 text-slate-900 dark:text-slate-100 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-100 dark:hover:bg-[#1f2d24]"
                    }`}
                  >
                    {/* Slide Half 1: Image / Icon + Popular Badge */}
                    <div className="flex flex-col items-center gap-1.5 shrink-0 overflow-hidden">
                      <AnimatePresence mode="popLayout" custom={direction} initial={false}>
                        <motion.div
                          key={`${mode}-${item.id}-img`}
                          custom={direction}
                          variants={imgSlideVariants}
                          initial="enter"
                          animate="center"
                          exit="exit"
                          className="flex flex-col items-center gap-1.5"
                        >
                          <div
                            className={`p-2.5 rounded-xl shadow-xs border ${
                              mode === "companion"
                                ? "bg-white dark:bg-dark-card border-slate-200 dark:border-dark-border"
                                : "bg-white dark:bg-[#18241f] border-slate-200 dark:border-emerald-950/60"
                            }`}
                          >
                            {item.icon}
                          </div>
                          {item.popular && (
                            <span
                              className={`text-[9px] uppercase tracking-wide font-bold px-2 py-0.5 rounded-full ${
                                mode === "companion"
                                  ? "text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60"
                                  : "text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-950/80"
                              }`}
                            >
                              Popular
                            </span>
                          )}
                        </motion.div>
                      </AnimatePresence>
                    </div>

                    {/* Slide Half 2: Text Matter (Label & Description) */}
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <AnimatePresence mode="popLayout" custom={direction} initial={false}>
                        <motion.div
                          key={`${mode}-${item.id}-text`}
                          custom={direction}
                          variants={textSlideVariants}
                          initial="enter"
                          animate="center"
                          exit="exit"
                          className="w-full"
                        >
                          <div className="flex items-start justify-between gap-1">
                            <span className="block text-sm font-bold text-slate-900 dark:text-white leading-snug pr-1">
                              {item.label}
                            </span>
                          </div>
                          <span className="block text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 font-medium leading-relaxed">
                            {hintText}
                          </span>
                        </motion.div>
                      </AnimatePresence>
                    </div>

                    {/* Stationary Arrow */}
                    <ArrowRight
                      className={`w-4 h-4 self-center shrink-0 group-hover:translate-x-1 transition-all ${
                        mode === "companion"
                          ? "text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400"
                          : "text-slate-400 group-hover:text-orange-500"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: DETAILS FORM */}
        {/* ========================================================================= */}
        {step === 2 && mode === "companion" && (
          <div className="space-y-6 animate-fade-in">
            {/* Active Tag Bar */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-white dark:bg-dark-elevated shadow-xs">
                  {selectedCategoryObj?.icon}
                </div>
                <div>
                  <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
                    Selected Category Tag
                  </span>
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {selectedCategoryObj?.label}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-white dark:bg-dark-card border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-dark-elevated transition shadow-2xs active:scale-95 min-h-[36px]"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Change Tag</span>
              </button>
            </div>

            <form onSubmit={handleCompanionSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                    Activity Title *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Screening of Wim Wenders 'Perfect Days' + Post-Film Coffee"
                    value={companionData.title}
                    onChange={(e) => setCompanionData({ ...companionData, title: e.target.value })}
                    className="w-full rounded-2xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-elevated px-4 py-3 text-xs text-slate-900 dark:text-white font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                    Description &amp; Plan *
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Describe what you plan to do, why you're excited about this activity, and what kind of companion would enjoy joining..."
                    value={companionData.description}
                    onChange={(e) => setCompanionData({ ...companionData, description: e.target.value })}
                    className="w-full rounded-2xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-elevated p-4 text-xs text-slate-900 dark:text-white font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 leading-relaxed transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                    Date *
                  </label>
                  <input
                    required
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    value={companionData.date}
                    onChange={(e) => setCompanionData({ ...companionData, date: e.target.value })}
                    className="w-full rounded-2xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-elevated px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                    Start Time *
                  </label>
                  <input
                    required
                    type="time"
                    value={companionData.startTime}
                    onChange={(e) => setCompanionData({ ...companionData, startTime: e.target.value })}
                    className="w-full rounded-2xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-elevated px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                    Duration (approx. hours)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="12"
                    value={companionData.approxDurationHours}
                    onChange={(e) => setCompanionData({ ...companionData, approxDurationHours: e.target.value })}
                    className="w-full rounded-2xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-elevated px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 min-h-[44px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                    Gender Preference
                  </label>
                  <select
                    value={companionData.genderPreference}
                    onChange={(e) => setCompanionData({ ...companionData, genderPreference: e.target.value })}
                    className="w-full rounded-2xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-elevated px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 min-h-[44px]"
                  >
                    <option value="ANY">Any gender welcome</option>
                    <option value="FEMALE_ONLY">Women only</option>
                    <option value="MALE_ONLY">Men only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                    Close Requests Before Event
                  </label>
                  <select
                    value={companionData.cutoffHoursBeforeStart}
                    onChange={(e) => setCompanionData({ ...companionData, cutoffHoursBeforeStart: e.target.value })}
                    className="w-full rounded-2xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-elevated px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 min-h-[44px]"
                  >
                    <option value="1">1 hour before start (Default)</option>
                    <option value="0.5">30 minutes before start</option>
                    <option value="2">2 hours before start</option>
                    <option value="3">3 hours before start</option>
                    <option value="6">6 hours before start</option>
                    <option value="12">12 hours before start</option>
                    <option value="24">24 hours before start</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                  Joining Requirements or Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Please purchase ticket in advance, or bring comfortable shoes"
                  value={companionData.additionalRequirements}
                  onChange={(e) => setCompanionData({ ...companionData, additionalRequirements: e.target.value })}
                  className="w-full rounded-2xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-elevated px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                  Cover Image (Optional)
                </label>
                <div className="w-full">
                  {companionData.imageUrl ? (
                    <div className="relative w-full h-40 rounded-2xl overflow-hidden border border-slate-200 dark:border-dark-border shadow-sm">
                      <img src={companionData.imageUrl} alt="Upload preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setCompanionData({ ...companionData, imageUrl: "" })}
                        className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white rounded-full p-1.5 hover:bg-rose-500 transition-colors shadow-md active:scale-95"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 rounded-2xl border-2 border-dashed border-slate-300 dark:border-dark-border bg-slate-50 dark:bg-dark-elevated hover:bg-slate-100 dark:hover:bg-dark-card hover:border-emerald-400 dark:hover:border-emerald-500 transition-colors cursor-pointer group">
                      <div className="flex flex-col items-center justify-center">
                        <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-emerald-500 mb-2 transition-colors" />
                        <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold">Click to upload an image</p>
                        <p className="text-[10px] text-slate-400 mt-1">JPEG, PNG, WEBP up to 5MB</p>
                      </div>
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </label>
                  )}
                </div>
              </div>

              <div className="pt-1 space-y-0.5">
                <span className="font-semibold text-[11px] text-slate-700 dark:text-slate-300 block">
                  Organizer Review &amp; Safety
                </span>
                <p className="text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">
                  Interested companions will submit requests. You review their profile and approve before the private 1-on-1 or group chat is unlocked.
                </p>
              </div>

              <div className="pt-3 flex items-center justify-between gap-3 border-t border-slate-100 dark:border-dark-border flex-wrap">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 rounded-full text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-dark-elevated transition flex items-center gap-1.5 active:scale-95 min-h-[44px]"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Tags</span>
                </button>

                <div className="flex items-center gap-3 ml-auto">
                  <Link
                    href="/discover?mode=companion"
                    className="px-5 py-2.5 rounded-full text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-elevated transition active:scale-95 flex items-center justify-center min-h-[44px]"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-full text-xs font-extrabold text-emerald-950 dark:text-emerald-200 bg-gradient-to-r from-emerald-100 via-teal-50 to-emerald-100 dark:from-emerald-950/80 dark:to-teal-950/70 hover:from-emerald-200 hover:to-teal-100 border border-emerald-300/80 dark:border-emerald-800/60 disabled:opacity-60 transition shadow-xs flex items-center gap-1.5 active:scale-95 min-h-[44px]"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-300" />
                    <span>{isSubmitting ? "Publishing..." : "Publish Activity"}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* STEP 2: TRAVEL DETAILS FORM */}
        {step === 2 && mode === "travel" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/50 flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-white dark:bg-[#16201b] shadow-xs">
                  {selectedStyleObj?.icon}
                </div>
                <div>
                  <span className="text-[10px] font-bold text-orange-800 dark:text-orange-300 uppercase tracking-wider block">
                    Selected Travel Style
                  </span>
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {selectedStyleObj?.label}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-orange-800 dark:text-orange-300 bg-white dark:bg-[#16201b] border border-orange-300 dark:border-orange-800/60 hover:bg-orange-100 dark:hover:bg-[#1f2c26] transition shadow-2xs active:scale-95 min-h-[36px]"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Change Style</span>
              </button>
            </div>

            <form onSubmit={handleTravelSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                    Destination *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Kasol & Parvati Valley, Himachal"
                    value={travelData.destination}
                    onChange={(e) => setTravelData({ ...travelData, destination: e.target.value })}
                    className="w-full rounded-2xl border border-slate-300 dark:border-emerald-950/80 bg-white dark:bg-[#16201b] px-4 py-3 text-xs text-slate-900 dark:text-white font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                    Starting / Departure City *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Chandigarh or New Delhi"
                    value={travelData.departureCity}
                    onChange={(e) => setTravelData({ ...travelData, departureCity: e.target.value })}
                    className="w-full rounded-2xl border border-slate-300 dark:border-emerald-950/80 bg-white dark:bg-[#16201b] px-4 py-3 text-xs text-slate-900 dark:text-white font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 min-h-[44px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                    Start Date *
                  </label>
                  <input
                    required
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    value={travelData.startDate}
                    onChange={(e) => setTravelData({ ...travelData, startDate: e.target.value })}
                    className="w-full rounded-2xl border border-slate-300 dark:border-emerald-950/80 bg-white dark:bg-[#16201b] px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                    End Date *
                  </label>
                  <input
                    required
                    type="date"
                    min={travelData.startDate || new Date().toISOString().split("T")[0]}
                    value={travelData.endDate}
                    onChange={(e) => setTravelData({ ...travelData, endDate: e.target.value })}
                    className="w-full rounded-2xl border border-slate-300 dark:border-emerald-950/80 bg-white dark:bg-[#16201b] px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 min-h-[44px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                    Estimated Min Budget per Person (₹)
                  </label>
                  <input
                    type="number"
                    step="500"
                    placeholder="8000"
                    value={travelData.budgetMin}
                    onChange={(e) => setTravelData({ ...travelData, budgetMin: e.target.value })}
                    className="w-full rounded-2xl border border-slate-300 dark:border-emerald-950/80 bg-white dark:bg-[#16201b] px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                    Estimated Max Budget per Person (₹)
                  </label>
                  <input
                    type="number"
                    step="500"
                    placeholder="15000"
                    value={travelData.budgetMax}
                    onChange={(e) => setTravelData({ ...travelData, budgetMax: e.target.value })}
                    className="w-full rounded-2xl border border-slate-300 dark:border-emerald-950/80 bg-white dark:bg-[#16201b] px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 min-h-[44px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                    Accommodation Preference
                  </label>
                  <select
                    value={travelData.accommodationPreference}
                    onChange={(e) => setTravelData({ ...travelData, accommodationPreference: e.target.value })}
                    className="w-full rounded-2xl border border-slate-300 dark:border-emerald-950/80 bg-white dark:bg-[#16201b] px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 min-h-[44px]"
                  >
                    <option value="HOSTEL">Backpacker Hostel / Homestay</option>
                    <option value="HOTEL">3-Star Hotel / Resort</option>
                    <option value="LUXURY">Boutique Stay / Villa</option>
                    <option value="FLEXIBLE">Flexible / Decide Together</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                    Transit Preference
                  </label>
                  <select
                    value={travelData.transportPreference}
                    onChange={(e) => setTravelData({ ...travelData, transportPreference: e.target.value })}
                    className="w-full rounded-2xl border border-slate-300 dark:border-emerald-950/80 bg-white dark:bg-[#16201b] px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 min-h-[44px]"
                  >
                    <option value="TRAIN">Train Journey</option>
                    <option value="FLIGHT">Flight</option>
                    <option value="BUS">Sleeper Bus / Volvo</option>
                    <option value="SELF_DRIVE">Self Drive Car / Bike</option>
                    <option value="FLEXIBLE">Flexible</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                  Planned Attractions &amp; Key Stops
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Add a landmark or trail stop..."
                    value={attractionInput}
                    onChange={(e) => setAttractionInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addAttraction();
                      }
                    }}
                    className="flex-1 rounded-2xl border border-slate-300 dark:border-emerald-950/80 bg-white dark:bg-[#16201b] px-3.5 py-2 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 min-h-[44px]"
                  />
                  <button
                    type="button"
                    onClick={addAttraction}
                    className="px-4 py-2 rounded-2xl text-xs font-bold bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 hover:bg-orange-200 transition min-h-[44px] shrink-0 active:scale-95"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {attractions.map((att, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-900 dark:text-orange-200 text-xs font-semibold border border-orange-200 dark:border-orange-800/60 shadow-2xs"
                    >
                      <span>{att}</span>
                      <button
                        type="button"
                        onClick={() => removeAttraction(idx)}
                        className="hover:text-rose-500 transition"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-between gap-3 border-t border-slate-100 dark:border-emerald-950/60 flex-wrap">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 rounded-full text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#16201b] transition flex items-center gap-1.5 active:scale-95 min-h-[44px]"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Styles</span>
                </button>

                <div className="flex items-center gap-3 ml-auto">
                  <Link
                    href="/discover?mode=travel"
                    className="px-5 py-2.5 rounded-full text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#16201b] transition active:scale-95 flex items-center justify-center min-h-[44px]"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-full text-xs font-extrabold text-orange-950 dark:text-orange-200 bg-gradient-to-r from-orange-100 via-amber-50 to-orange-100 dark:from-orange-950/80 dark:to-amber-950/70 hover:from-orange-200 hover:to-amber-100 border border-orange-300/80 dark:border-orange-800/60 disabled:opacity-60 transition shadow-xs flex items-center gap-1.5 active:scale-95 min-h-[44px]"
                  >
                    <CheckCircle2 className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    <span>{isSubmitting ? "Publishing..." : "Publish Expedition"}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
