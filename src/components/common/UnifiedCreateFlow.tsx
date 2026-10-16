"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowLeft,
  X,
  CheckCircle2,
  UploadCloud,
  Camera,
  Sprout,
  Gem,
  Flame,
  Users,
  Compass,
  MapPin,
  Trash2,
  Bike,
  Loader2,
  Info,
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

export type CreateMode =
  | "instant"
  | "companion"
  | "travel"
  | "grow"
  | "treasure"
  | "find-me";

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
    id: "BIKERS_GROUP",
    label: "Bikers Group Trip",
    icon: <Bike className="w-10 h-10 text-amber-500" />,
    desc: "Motorcycle touring, biking expeditions, group highway rides & convoys",
    popular: true,
  },
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

const CREATE_TYPES = [
  {
    id: "instant" as const,
    label: "Post",
    fullTitle: "Create a Post",
    subtitle: "Share photo & moment",
    icon: Camera,
    color: "from-amber-400 to-orange-500",
    activeClass:
      "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20 border-orange-500",
    badge: "Photo / Note",
  },
  {
    id: "companion" as const,
    label: "Activity",
    fullTitle: "Host an Activity",
    subtitle: "Find local hangout companions",
    icon: Users,
    color: "from-emerald-400 to-teal-500",
    activeClass:
      "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20 border-emerald-600",
    badge: "City Meetup",
  },
  {
    id: "travel" as const,
    label: "Travel Trip",
    fullTitle: "Plan Travel Expedition",
    subtitle: "Group trips & Bikers Group Trips",
    icon: Compass,
    color: "from-blue-400 to-indigo-500",
    activeClass:
      "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/20 border-blue-600",
    badge: "Expedition",
  },
  {
    id: "grow" as const,
    label: "Grow Cause",
    fullTitle: "Start a Grow Cause",
    subtitle: "Eco drive, cleanup or humanity",
    icon: Sprout,
    color: "from-teal-400 to-emerald-500",
    activeClass:
      "bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md shadow-teal-600/20 border-teal-600",
    badge: "Eco & Social",
  },
  {
    id: "treasure" as const,
    label: "Treasure",
    fullTitle: "Hide a Treasure Drop",
    subtitle: "Riddle & geo drop on map",
    icon: Gem,
    color: "from-indigo-400 to-violet-500",
    activeClass:
      "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/20 border-indigo-600",
    badge: "Geo Quest",
  },
  {
    id: "find-me" as const,
    label: "Find Me",
    fullTitle: "Drop a Mystery Clue",
    subtitle: "Dating spark & playful meetup",
    icon: Flame,
    color: "from-rose-400 to-pink-500",
    activeClass:
      "bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md shadow-rose-500/20 border-rose-500",
    badge: "Dating & Meetup",
  },
];

export interface UnifiedCreateFlowProps {
  initialMode?: CreateMode;
}

function UnifiedCreateFlowContent({ initialMode = "companion" }: UnifiedCreateFlowProps) {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const searchParams = useSearchParams();

  const [mode, setMode] = useState<CreateMode>(initialMode);
  const [step, setStep] = useState<1 | 2>(1);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync mode with query parameter if present
  useEffect(() => {
    const queryType = searchParams?.get("type") || searchParams?.get("mode");
    if (queryType && CREATE_TYPES.some((ct) => ct.id === queryType)) {
      setMode(queryType as CreateMode);
      setStep(1);
    }
  }, [searchParams]);

  // 1. INSTANT FORM STATE
  const [instantData, setInstantData] = useState({
    content: "",
    locationName: "",
    imageUrl: "",
  });
  const [instantImageError, setInstantImageError] = useState<string | null>(null);

  // 2. COMPANION FORM STATE
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

  // 3. TRAVEL FORM STATE
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
    transportPreference: "MOTORCYCLE",
  });
  const [attractionInput, setAttractionInput] = useState("");
  const [attractions, setAttractions] = useState<string[]>([
    "Highway Vista Points & Dhabas",
    "Hill Pass Viewpoint",
  ]);

  // 4. GROW INITIATIVE FORM STATE
  const [growData, setGrowData] = useState({
    title: "",
    description: "",
    causeCategory: "CLEAN_OCEAN",
    locationName: "",
    date: "",
    volunteersNeeded: "",
  });

  // 5. TREASURE FORM STATE
  const [treasureData, setTreasureData] = useState({
    title: "",
    hintRiddle: "",
    locationName: "",
    latitude: "",
    longitude: "",
    difficulty: "MEDIUM",
  });

  // 6. FIND ME FORM STATE
  const [findMeData, setFindMeData] = useState({
    clueText: "",
    hintArea: "",
    vibeTag: "Coffee & Books",
  });

  // Localized companion categories
  const localizedCompanionCategories = [
    { ...COMPANION_CATEGORIES[0], label: t.catFoodTitle, hint: t.catFoodHint },
    { ...COMPANION_CATEGORIES[1], label: t.catMoviesTitle, hint: t.catMoviesHint },
    { ...COMPANION_CATEGORIES[2], label: t.catSportsTitle, hint: t.catSportsHint },
    { ...COMPANION_CATEGORIES[3], label: t.catTechTitle, hint: t.catTechHint },
    { ...COMPANION_CATEGORIES[4], label: t.catPubsTitle, hint: t.catPubsHint },
    { ...COMPANION_CATEGORIES[5], label: t.catShoppingTitle, hint: t.catShoppingHint },
    { ...COMPANION_CATEGORIES[6], label: t.catDrivesTitle, hint: t.catDrivesHint },
    { ...COMPANION_CATEGORIES[7], label: t.catOtherTitle, hint: t.catOtherHint },
  ];

  // Localized travel styles with Bikers Group Trip
  const localizedTravelStyles = [
    {
      ...TRAVEL_STYLES[0],
      label: t.styleBikersTitle || "Bikers Group Trip",
      desc: t.styleBikersDesc || "Motorcycle touring, biking expeditions, group highway rides & convoys",
    },
    { ...TRAVEL_STYLES[1], label: t.styleCulturalTitle, desc: t.styleCulturalDesc },
    { ...TRAVEL_STYLES[2], label: t.styleSlowTravelTitle, desc: t.styleSlowTravelDesc },
    { ...TRAVEL_STYLES[3], label: t.styleBackpackingTitle, desc: t.styleBackpackingDesc },
    { ...TRAVEL_STYLES[4], label: t.styleAdventureTitle, desc: t.styleAdventureDesc },
    { ...TRAVEL_STYLES[5], label: t.styleRoadTripTitle, desc: t.styleRoadTripDesc },
    { ...TRAVEL_STYLES[6], label: t.styleLuxuryTitle, desc: t.styleLuxuryDesc },
    { ...TRAVEL_STYLES[7], label: t.styleRelaxationTitle, desc: t.styleRelaxationDesc },
  ];

  const selectedCategoryObj = localizedCompanionCategories.find((c) => c.id === companionData.category);
  const selectedStyleObj = localizedTravelStyles.find((s) => s.id === travelData.travelStyle);

  const handleModeChange = (newMode: CreateMode) => {
    if (newMode === mode) return;
    setError(null);
    setDirection("forward");
    setMode(newMode);
    setStep(1);
    if (typeof window !== "undefined") {
      const url =
        newMode === "companion"
          ? "/activities/create"
          : newMode === "travel"
          ? "/travel/create"
          : `/activities/create?type=${newMode}`;
      window.history.replaceState(null, "", url);
    }
  };

  // Instant image upload handler
  const handleInstantImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInstantImageError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setInstantImageError("Image must be smaller than 5MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setInstantImageError("Please select a valid image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setInstantData((prev) => ({ ...prev, imageUrl: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Companion cover image upload
  const handleCompanionImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  // Attractions management
  const addAttraction = () => {
    if (attractionInput.trim() && !attractions.includes(attractionInput.trim())) {
      setAttractions([...attractions, attractionInput.trim()]);
      setAttractionInput("");
    }
  };
  const removeAttraction = (index: number) => {
    setAttractions(attractions.filter((_, i) => i !== index));
  };

  // SUBMIT 1: INSTANT
  const handleInstantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instantData.content.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/home/instants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: instantData.content.trim(),
          locationName: instantData.locationName.trim() || undefined,
          imageUrl: instantData.imageUrl.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to publish instant");
      window.location.href = "/?tab=instants";
    } catch (err: any) {
      setError(err.message || "Failed to publish instant");
      setIsSubmitting(false);
    }
  };

  // SUBMIT 2: COMPANION
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
      if (!res.ok) throw new Error(data.error || "Failed to create activity");
      window.location.href = `/activities/${data.activity.id}`;
    } catch (err: any) {
      setError(err.message || "Failed to create activity");
      setIsSubmitting(false);
    }
  };

  // SUBMIT 3: TRAVEL
  const handleTravelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const payload = {
        ...travelData,
        groupSizeMax: "4",
        plannedAttractions: attractions,
        interests: travelData.travelStyle === "BIKERS_GROUP" ? ["Biking Convoys", "Highway Cruises", "Riding Clubs"] : ["Sightseeing", "Local Culture"],
      };

      const res = await fetch("/api/travel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create travel plan");
      window.location.href = `/travel/${data.travelPlan.id}`;
    } catch (err: any) {
      setError(err.message || "Failed to create travel plan");
      setIsSubmitting(false);
    }
  };

  // SUBMIT 4: GROW
  const handleGrowSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!growData.title.trim() || !growData.description.trim() || !growData.locationName.trim() || !growData.date) {
      setError("Please fill in all required fields.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/home/grow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: growData.title.trim(),
          description: growData.description.trim(),
          causeCategory: growData.causeCategory,
          locationName: growData.locationName.trim(),
          date: growData.date || undefined,
          volunteersNeeded: Number(growData.volunteersNeeded) || 10,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create Grow initiative");
      window.location.href = "/?tab=grow";
    } catch (err: any) {
      setError(err.message || "Failed to create Grow initiative");
      setIsSubmitting(false);
    }
  };

  // SUBMIT 5: TREASURE
  const handleTreasureSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!treasureData.title.trim() || !treasureData.hintRiddle.trim() || !treasureData.locationName.trim()) {
      setError("Please fill in all required fields.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/home/treasure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: treasureData.title.trim(),
          hintRiddle: treasureData.hintRiddle.trim(),
          locationName: treasureData.locationName.trim(),
          latitude: parseFloat(treasureData.latitude) || 17.385,
          longitude: parseFloat(treasureData.longitude) || 78.4867,
          difficulty: treasureData.difficulty,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to hide treasure");
      window.location.href = "/?tab=treasure";
    } catch (err: any) {
      setError(err.message || "Failed to hide treasure");
      setIsSubmitting(false);
    }
  };

  // SUBMIT 6: FIND ME
  const handleFindMeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!findMeData.clueText.trim() || !findMeData.hintArea.trim()) {
      setError("Please fill in all required clue fields.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/home/find-me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clueText: findMeData.clueText.trim(),
          hintArea: findMeData.hintArea.trim(),
          vibeTag: findMeData.vibeTag,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to drop clue");
      window.location.href = "/?tab=find-me";
    } catch (err: any) {
      setError(err.message || "Failed to drop clue");
      setIsSubmitting(false);
    }
  };

  const activeTypeConfig = CREATE_TYPES.find((ct) => ct.id === mode) || CREATE_TYPES[0];

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-6 pb-36 sm:pb-28">

      <div className="rounded-3xl border border-slate-200/90 dark:border-emerald-950/70 bg-white dark:bg-[#111815] p-4 sm:p-7 shadow-xl relative overflow-hidden transition-all">
        {/* Creation Hub Header & Type Selector */}
        <div className="mb-6 pb-5 border-b border-slate-100 dark:border-emerald-950/60">
          <div className="text-center mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-800/60">
              <Compass className="w-3 h-3 text-emerald-500" />
              <span>Central Creation Studio</span>
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1.5">
              What would you like to create?
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Select any creation type below to publish directly across Travally
            </p>
          </div>

          {/* 6 Responsive Creation Category Pills */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {CREATE_TYPES.map((type) => {
              const Icon = type.icon;
              const isActive = mode === type.id;
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => handleModeChange(type.id)}
                  className={`flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl border transition-all text-center select-none cursor-pointer group ${
                    isActive
                      ? `${type.activeClass} font-black scale-[1.02]`
                      : "bg-slate-50/80 dark:bg-[#16201b] border-slate-200/90 dark:border-emerald-950/70 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1c2a22]"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center mb-1 transition-transform group-hover:scale-110 ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-white dark:bg-[#101713] text-slate-700 dark:text-slate-300 shadow-2xs"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] sm:text-xs font-bold block truncate max-w-full">
                    {type.label}
                  </span>
                  <span
                    className={`text-[9px] hidden sm:block truncate max-w-full opacity-80 ${
                      isActive ? "text-white/90" : "text-slate-400"
                    }`}
                  >
                    {type.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-xs font-semibold text-rose-800 dark:text-rose-200 animate-shake flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════════════════ */}
        {/* MODE 1: POST AN INSTANT PHOTO MOMENT */}
        {/* ══════════════════════════════════════════════════════════════════════════════════ */}
        {mode === "instant" && (
          <form onSubmit={handleInstantSubmit} className="space-y-5 animate-fade-in">
            <div className="p-3.5 rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-xs">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-orange-950 dark:text-orange-200">
                    Share a Community Post
                  </h3>
                  <p className="text-[11px] text-orange-700/80 dark:text-orange-300/80">
                    Live travel photos, hangout memories, and spontaneous road snippets
                  </p>
                </div>
              </div>
            </div>

            {/* Direct Image File Upload Dropzone */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Upload Photo (Camera / Gallery)
              </label>
              {instantData.imageUrl ? (
                <div className="relative w-full h-56 rounded-2xl overflow-hidden border border-slate-200 dark:border-emerald-950 bg-slate-900 shadow-inner group">
                  <img
                    src={instantData.imageUrl}
                    alt="Uploaded instant preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <label className="cursor-pointer px-3.5 py-1.5 rounded-full bg-white text-slate-900 text-xs font-bold shadow-md hover:bg-slate-100 transition flex items-center gap-1.5">
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Change</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleInstantImageUpload}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setInstantData({ ...instantData, imageUrl: "" })}
                      className="px-3.5 py-1.5 rounded-full bg-rose-600 text-white text-xs font-bold shadow-md hover:bg-rose-700 transition flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setInstantData({ ...instantData, imageUrl: "" })}
                    className="sm:hidden absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white hover:bg-rose-600 transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-40 rounded-2xl border-2 border-dashed border-slate-300 dark:border-emerald-950/80 bg-slate-50 dark:bg-[#16201b]/60 hover:bg-orange-50/40 dark:hover:bg-[#1c2822] hover:border-orange-400 dark:hover:border-orange-500/60 transition-all cursor-pointer group">
                  <div className="flex flex-col items-center justify-center p-3 text-center">
                    <div className="w-11 h-11 rounded-2xl bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-2xs">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Tap to take photo or choose from gallery
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      JPEG, PNG, WEBP, GIF up to 5MB
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleInstantImageUpload}
                    className="hidden"
                  />
                </label>
              )}
              {instantImageError && (
                <p className="text-[11px] text-rose-500 font-medium mt-1">
                  {instantImageError}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                What&apos;s happening? *
              </label>
              <textarea
                value={instantData.content}
                onChange={(e) => setInstantData({ ...instantData, content: e.target.value })}
                placeholder="Share a photo moment, local food spot, highway pitstop, or spontaneous thought with the community..."
                required
                rows={3}
                className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-[#16201b] border border-slate-200 dark:border-emerald-950 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Location Tag (Optional)
              </label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={instantData.locationName}
                  onChange={(e) => setInstantData({ ...instantData, locationName: e.target.value })}
                  placeholder="e.g. Charminar, Jubilee Hills, or Leh Highway Pass"
                  className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#16201b] border border-slate-200 dark:border-emerald-950 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                />
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-emerald-950/60">
              <Link
                href="/?tab=instants"
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#18241f]"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting || !instantData.content.trim()}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 shadow-md hover:from-orange-600 hover:to-amber-600 transition disabled:opacity-50 flex items-center gap-1.5 active:scale-95"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-3.5 h-3.5" />
                    <span>Publish Post</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ══════════════════════════════════════════════════════════════════════════════════ */}
        {/* MODE 2: COMPANION ACTIVITY (STEP 1: CATEGORIES, STEP 2: DETAILS) */}
        {/* ══════════════════════════════════════════════════════════════════════════════════ */}
        {mode === "companion" && step === 1 && (
          <div className="space-y-5 animate-fade-in">
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                    Choose Activity Category
                  </h3>
                  <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80">
                    Select what kind of hangout you are organizing
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {localizedCompanionCategories.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setCompanionData((prev) => ({ ...prev, category: item.id }));
                    setStep(2);
                  }}
                  className="p-4 rounded-2xl text-left border-2 transition-all flex items-start gap-3.5 cursor-pointer bg-slate-50/80 dark:bg-[#16201b] border-slate-200/90 dark:border-emerald-950/60 hover:border-emerald-400 dark:hover:border-emerald-600 hover:bg-emerald-50/30 dark:hover:bg-[#1c2a22]"
                >
                  <div className="p-2 rounded-xl bg-white dark:bg-[#18241f] shadow-xs border border-slate-200/80 dark:border-emerald-950/60 shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      {item.label}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                      {item.hint}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {mode === "companion" && step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-white dark:bg-dark-elevated shadow-xs">
                  {selectedCategoryObj?.icon}
                </div>
                <div>
                  <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
                    {t.selectedCategoryTag}
                  </span>
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {selectedCategoryObj?.label}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-white dark:bg-[#16201b] border border-emerald-300 dark:border-emerald-800/60 hover:bg-emerald-100 transition shadow-2xs active:scale-95"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{t.changeTag}</span>
              </button>
            </div>

            <form onSubmit={handleCompanionSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                  {t.activityTitleLabel}
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Midnight Biryani Run & Charminar Chai"
                  value={companionData.title}
                  onChange={(e) => setCompanionData({ ...companionData, title: e.target.value })}
                  className="w-full rounded-2xl border border-slate-300 dark:border-emerald-950/80 bg-white dark:bg-[#16201b] px-4 py-3 text-xs text-slate-900 dark:text-white font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                  {t.descriptionPlanLabel}
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe what you have planned, where to meet, and what kind of buddy you're looking for..."
                  value={companionData.description}
                  onChange={(e) => setCompanionData({ ...companionData, description: e.target.value })}
                  className="w-full rounded-2xl border border-slate-300 dark:border-emerald-950/80 bg-white dark:bg-[#16201b] p-3 text-xs text-slate-900 dark:text-white font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                    {t.dateLabel}
                  </label>
                  <input
                    required
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    value={companionData.date}
                    onChange={(e) => setCompanionData({ ...companionData, date: e.target.value })}
                    className="w-full rounded-2xl border border-slate-300 dark:border-emerald-950/80 bg-white dark:bg-[#16201b] px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                    {t.startTimeLabel}
                  </label>
                  <input
                    required
                    type="time"
                    value={companionData.startTime}
                    onChange={(e) => setCompanionData({ ...companionData, startTime: e.target.value })}
                    className="w-full rounded-2xl border border-slate-300 dark:border-emerald-950/80 bg-white dark:bg-[#16201b] px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 min-h-[44px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                    {t.durationLabel}
                  </label>
                  <select
                    value={companionData.approxDurationHours}
                    onChange={(e) => setCompanionData({ ...companionData, approxDurationHours: e.target.value })}
                    className="w-full rounded-2xl border border-slate-300 dark:border-emerald-950/80 bg-white dark:bg-[#16201b] px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 min-h-[44px]"
                  >
                    <option value="1.0">~ 1 hour</option>
                    <option value="2.0">~ 2 hours</option>
                    <option value="3.5">~ 3.5 hours</option>
                    <option value="5.0">Half Day (5+ hrs)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                    {t.genderPrefLabel}
                  </label>
                  <select
                    value={companionData.genderPreference}
                    onChange={(e) => setCompanionData({ ...companionData, genderPreference: e.target.value })}
                    className="w-full rounded-2xl border border-slate-300 dark:border-emerald-950/80 bg-white dark:bg-[#16201b] px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 min-h-[44px]"
                  >
                    <option value="ANY">{t.genderAny}</option>
                    <option value="FEMALE_ONLY">{t.genderWomenOnly}</option>
                    <option value="MALE_ONLY">{t.genderMenOnly}</option>
                  </select>
                </div>
              </div>

              {/* Cover Image Upload */}
              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                  {t.coverImageLabel}
                </label>
                {companionData.imageUrl ? (
                  <div className="relative w-full h-40 rounded-2xl overflow-hidden border border-slate-200 dark:border-emerald-950 shadow-sm">
                    <img src={companionData.imageUrl} alt="Upload preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setCompanionData({ ...companionData, imageUrl: "" })}
                      className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 hover:bg-rose-500 transition shadow-md"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-28 rounded-2xl border-2 border-dashed border-slate-300 dark:border-emerald-950 bg-slate-50 dark:bg-[#16201b] hover:border-emerald-500 transition cursor-pointer">
                    <UploadCloud className="w-6 h-6 text-slate-400 mb-1" />
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold">{t.clickToUpload}</p>
                    <input type="file" className="hidden" accept="image/*" onChange={handleCompanionImageUpload} />
                  </label>
                )}
              </div>

              <div className="pt-3 flex items-center justify-between gap-3 border-t border-slate-100 dark:border-emerald-950/60">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 rounded-full text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{t.backToTags}</span>
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-full text-xs font-extrabold text-white bg-gradient-to-r from-emerald-600 to-teal-600 shadow-md transition disabled:opacity-60 flex items-center gap-1.5 active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSubmitting ? t.publishing : t.publishActivity}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════════════════ */}
        {/* MODE 3: TRAVEL EXPEDITION (STEP 1: STYLES INCL BIKERS GROUP, STEP 2: DETAILS) */}
        {/* ══════════════════════════════════════════════════════════════════════════════════ */}
        {mode === "travel" && step === 1 && (
          <div className="space-y-5 animate-fade-in">
            <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-blue-950 dark:text-blue-200">
                    Choose Travel Style & Expedition
                  </h3>
                  <p className="text-[11px] text-blue-700/80 dark:text-blue-300/80">
                    Plan multi-day adventures, road trips, or Bikers Group Trips
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {localizedTravelStyles.map((item) => {
                const isSelected = travelData.travelStyle === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setTravelData((prev) => ({
                        ...prev,
                        travelStyle: item.id,
                        transportPreference: item.id === "BIKERS_GROUP" ? "MOTORCYCLE" : prev.transportPreference,
                      }));
                      setStep(2);
                    }}
                    className={`p-4 rounded-2xl text-left border-2 transition-all flex items-start gap-3.5 cursor-pointer ${
                      isSelected
                        ? "bg-blue-50/70 dark:bg-blue-950/40 border-blue-500 dark:border-blue-500 shadow-sm"
                        : "bg-slate-50/80 dark:bg-[#16201b] border-slate-200/90 dark:border-emerald-950/60 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50/30 dark:hover:bg-[#1c2a22]"
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-white dark:bg-[#18241f] shadow-xs border border-slate-200/80 dark:border-emerald-950/60 shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white block">
                          {item.label}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                        {item.desc}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {mode === "travel" && step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/50 flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-white dark:bg-[#16201b] shadow-xs">
                  {selectedStyleObj?.icon}
                </div>
                <div>
                  <span className="text-[10px] font-bold text-orange-800 dark:text-orange-300 uppercase tracking-wider block">
                    {t.selectedTravelStyle}
                  </span>
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {selectedStyleObj?.label}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-orange-800 dark:text-orange-300 bg-white dark:bg-[#16201b] border border-orange-300 dark:border-orange-800/60 hover:bg-orange-100 transition shadow-2xs active:scale-95"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{t.changeStyle}</span>
              </button>
            </div>

            <form onSubmit={handleTravelSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                    {t.destinationLabel}
                  </label>
                  <input
                    required
                    type="text"
                    placeholder={
                      travelData.travelStyle === "BIKERS_GROUP"
                        ? "e.g. Manali to Leh Biker Expedition, Ladakh"
                        : "e.g. Kasol & Parvati Valley, Himachal"
                    }
                    value={travelData.destination}
                    onChange={(e) => setTravelData({ ...travelData, destination: e.target.value })}
                    className="w-full rounded-2xl border border-slate-300 dark:border-emerald-950/80 bg-white dark:bg-[#16201b] px-4 py-3 text-xs text-slate-900 dark:text-white font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                    {t.departureCityLabel}
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Chandigarh, Hyderabad or New Delhi"
                    value={travelData.departureCity}
                    onChange={(e) => setTravelData({ ...travelData, departureCity: e.target.value })}
                    className="w-full rounded-2xl border border-slate-300 dark:border-emerald-950/80 bg-white dark:bg-[#16201b] px-4 py-3 text-xs text-slate-900 dark:text-white font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 min-h-[44px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                    {t.startDateLabel}
                  </label>
                  <input
                    required
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    value={travelData.startDate}
                    onChange={(e) => setTravelData({ ...travelData, startDate: e.target.value })}
                    className="w-full rounded-2xl border border-slate-300 dark:border-emerald-950/80 bg-white dark:bg-[#16201b] px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                    {t.endDateLabel}
                  </label>
                  <input
                    required
                    type="date"
                    min={travelData.startDate || new Date().toISOString().split("T")[0]}
                    value={travelData.endDate}
                    onChange={(e) => setTravelData({ ...travelData, endDate: e.target.value })}
                    className="w-full rounded-2xl border border-slate-300 dark:border-emerald-950/80 bg-white dark:bg-[#16201b] px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 min-h-[44px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                    {t.minBudgetLabel} (₹)
                  </label>
                  <input
                    type="number"
                    step="500"
                    placeholder="8000"
                    value={travelData.budgetMin}
                    onChange={(e) => setTravelData({ ...travelData, budgetMin: e.target.value })}
                    className="w-full rounded-2xl border border-slate-300 dark:border-emerald-950/80 bg-white dark:bg-[#16201b] px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                    {t.maxBudgetLabel} (₹)
                  </label>
                  <input
                    type="number"
                    step="500"
                    placeholder="15000"
                    value={travelData.budgetMax}
                    onChange={(e) => setTravelData({ ...travelData, budgetMax: e.target.value })}
                    className="w-full rounded-2xl border border-slate-300 dark:border-emerald-950/80 bg-white dark:bg-[#16201b] px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 min-h-[44px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                    {t.accommodationLabel}
                  </label>
                  <select
                    value={travelData.accommodationPreference}
                    onChange={(e) => setTravelData({ ...travelData, accommodationPreference: e.target.value })}
                    className="w-full rounded-2xl border border-slate-300 dark:border-emerald-950/80 bg-white dark:bg-[#16201b] px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 min-h-[44px]"
                  >
                    <option value="HOSTEL">{t.accHostel}</option>
                    <option value="HOTEL">{t.accHotel}</option>
                    <option value="LUXURY">{t.accLuxury}</option>
                    <option value="FLEXIBLE">{t.accFlexible}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                    {t.transitPrefLabel}
                  </label>
                  <select
                    value={travelData.transportPreference}
                    onChange={(e) => setTravelData({ ...travelData, transportPreference: e.target.value })}
                    className="w-full rounded-2xl border border-slate-300 dark:border-emerald-950/80 bg-white dark:bg-[#16201b] px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 min-h-[44px]"
                  >
                    <option value="MOTORCYCLE">🏍️ Motorcycle / Biking Convoy</option>
                    <option value="SELF_DRIVE">🚗 Road Trip & Self Drive</option>
                    <option value="TRAIN">{t.transitTrain}</option>
                    <option value="FLIGHT">{t.transitFlight}</option>
                    <option value="BUS">{t.transitBus}</option>
                    <option value="FLEXIBLE">{t.transitFlexible}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                  Planned Stops & Attractions
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
                    Add Stop
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

              <div className="pt-3 flex items-center justify-between gap-3 border-t border-slate-100 dark:border-emerald-950/60">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 rounded-full text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{t.backToStyles}</span>
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-full text-xs font-extrabold text-white bg-gradient-to-r from-orange-500 to-amber-500 shadow-md transition disabled:opacity-60 flex items-center gap-1.5 active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSubmitting ? t.publishing : t.publishTrip}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════════════════ */}
        {/* MODE 4: GROW INITIATIVE (ECO & SOCIAL CAUSE) */}
        {/* ══════════════════════════════════════════════════════════════════════════════════ */}
        {mode === "grow" && (
          <form onSubmit={handleGrowSubmit} className="space-y-5 animate-fade-in">
            <div className="p-3.5 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
                  <Sprout className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-teal-950 dark:text-teal-200">
                    Launch a Community Grow Cause
                  </h3>
                  <p className="text-[11px] text-teal-700/80 dark:text-teal-300/80">
                    Rally travelers & locals to clean oceans, plant saplings, or support humanity
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Cause Title *
              </label>
              <input
                required
                type="text"
                placeholder="e.g. Versova Beach Ocean Clean & Plastic Recovery"
                value={growData.title}
                onChange={(e) => setGrowData({ ...growData, title: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-[#16201b] border border-slate-200 dark:border-emerald-950 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 min-h-[44px]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Cause Category
                </label>
                <select
                  value={growData.causeCategory}
                  onChange={(e) => setGrowData({ ...growData, causeCategory: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#16201b] border border-slate-200 dark:border-emerald-950 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 min-h-[44px]"
                >
                  <option value="CLEAN_OCEAN">🌊 Clean Oceans & Beaches</option>
                  <option value="NATURE">🌲 Nature & Trail Care</option>
                  <option value="PLANTATION">🌱 Tree Plantation Drive</option>
                  <option value="HUMANITY">🤝 Humanity & Food Drive</option>
                  <option value="ANIMAL_WELFARE">🐾 Animal Rescue & Shelter</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Volunteers Needed Goal
                </label>
                <input
                  type="number"
                  min="2"
                  max="200"
                  placeholder="15"
                  value={growData.volunteersNeeded}
                  onChange={(e) => setGrowData({ ...growData, volunteersNeeded: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#16201b] border border-slate-200 dark:border-emerald-950 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 min-h-[44px]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Meeting Location *
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Juhu Beach Pillar 4 or Cubbon Park Gate"
                  value={growData.locationName}
                  onChange={(e) => setGrowData({ ...growData, locationName: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-[#16201b] border border-slate-200 dark:border-emerald-950 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Date *
                </label>
                <input
                  required
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  value={growData.date}
                  onChange={(e) => setGrowData({ ...growData, date: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#16201b] border border-slate-200 dark:border-emerald-950 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 min-h-[44px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Description & Plan *
              </label>
              <textarea
                required
                rows={3}
                placeholder="Explain the environmental/social goal, what tools volunteers should bring, and meeting instructions..."
                value={growData.description}
                onChange={(e) => setGrowData({ ...growData, description: e.target.value })}
                className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-[#16201b] border border-slate-200 dark:border-emerald-950 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-emerald-950/60">
              <Link
                href="/?tab=grow"
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#18241f]"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-teal-600 to-emerald-600 shadow-md hover:from-teal-700 hover:to-emerald-700 transition disabled:opacity-50 flex items-center gap-1.5 active:scale-95"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Launching Cause...</span>
                  </>
                ) : (
                  <>
                    <Sprout className="w-3.5 h-3.5" />
                    <span>Launch Grow Initiative</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ══════════════════════════════════════════════════════════════════════════════════ */}
        {/* MODE 5: TREASURE QUEST DROP */}
        {/* ══════════════════════════════════════════════════════════════════════════════════ */}
        {mode === "treasure" && (
          <form onSubmit={handleTreasureSubmit} className="space-y-5 animate-fade-in">
            <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Gem className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                    Hide a Geo-Treasure Quest
                  </h3>
                  <p className="text-[11px] text-indigo-700/80 dark:text-indigo-300/80">
                    Drop a location riddle on the map for curious explorers to discover and solve
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Treasure Name / Title *
              </label>
              <input
                required
                type="text"
                placeholder="e.g. The Whispering Banyan of Golconda"
                value={treasureData.title}
                onChange={(e) => setTreasureData({ ...treasureData, title: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-[#16201b] border border-slate-200 dark:border-emerald-950 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Hint Riddle *
              </label>
              <textarea
                required
                rows={3}
                placeholder="Write a clever clue or riddle that guides explorers to find the exact spot..."
                value={treasureData.hintRiddle}
                onChange={(e) => setTreasureData({ ...treasureData, hintRiddle: e.target.value })}
                className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-[#16201b] border border-slate-200 dark:border-emerald-950 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Location Landmark *
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Golconda Fort North Outer Wall"
                  value={treasureData.locationName}
                  onChange={(e) => setTreasureData({ ...treasureData, locationName: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-[#16201b] border border-slate-200 dark:border-emerald-950 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Riddle Difficulty
                </label>
                <select
                  value={treasureData.difficulty}
                  onChange={(e) => setTreasureData({ ...treasureData, difficulty: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#16201b] border border-slate-200 dark:border-emerald-950 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 min-h-[44px]"
                >
                  <option value="EASY">🟢 Easy Explorer</option>
                  <option value="MEDIUM">🟡 Moderate Mystery</option>
                  <option value="HARD">🔴 Cryptic Expert</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Latitude Coordinate
                </label>
                <input
                  type="text"
                  value={treasureData.latitude}
                  onChange={(e) => setTreasureData({ ...treasureData, latitude: e.target.value })}
                  placeholder="17.3850"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#16201b] border border-slate-200 dark:border-emerald-950 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Longitude Coordinate
                </label>
                <input
                  type="text"
                  value={treasureData.longitude}
                  onChange={(e) => setTreasureData({ ...treasureData, longitude: e.target.value })}
                  placeholder="78.4867"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#16201b] border border-slate-200 dark:border-emerald-950 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 min-h-[44px]"
                />
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-emerald-950/60">
              <Link
                href="/?tab=treasure"
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#18241f]"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-blue-600 shadow-md hover:from-indigo-700 hover:to-blue-700 transition disabled:opacity-50 flex items-center gap-1.5 active:scale-95"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Hiding Drop...</span>
                  </>
                ) : (
                  <>
                    <Gem className="w-3.5 h-3.5" />
                    <span>Hide Treasure Drop</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ══════════════════════════════════════════════════════════════════════════════════ */}
        {/* MODE 6: FIND ME MYSTERY CLUE */}
        {/* ══════════════════════════════════════════════════════════════════════════════════ */}
        {mode === "find-me" && (
          <form onSubmit={handleFindMeSubmit} className="space-y-5 animate-fade-in">
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-xs">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-rose-950 dark:text-rose-200">
                    Drop a Mystery Dating Clue
                  </h3>
                  <p className="text-[11px] text-rose-700/80 dark:text-rose-300/80">
                    Leave a playful hint about your spot and let someone guess to connect for a date
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Your Mystery Clue *
              </label>
              <textarea
                required
                rows={3}
                placeholder="e.g. Reading Murakami by the corner window with a yellow matchbook on the saucer..."
                value={findMeData.clueText}
                onChange={(e) => setFindMeData({ ...findMeData, clueText: e.target.value })}
                className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-[#16201b] border border-slate-200 dark:border-emerald-950 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Neighborhood Area / Vicinity *
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Bandra West, Mumbai or Indiranagar, Bangalore"
                  value={findMeData.hintArea}
                  onChange={(e) => setFindMeData({ ...findMeData, hintArea: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-[#16201b] border border-slate-200 dark:border-emerald-950 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Vibe Tag
                </label>
                <select
                  value={findMeData.vibeTag}
                  onChange={(e) => setFindMeData({ ...findMeData, vibeTag: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#16201b] border border-slate-200 dark:border-emerald-950 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/20 min-h-[44px]"
                >
                  <option value="Coffee & Books">☕ Coffee & Books</option>
                  <option value="Sunset & Chai">🌅 Sunset & Chai</option>
                  <option value="Art & Vinyl">🎨 Art & Vinyl</option>
                  <option value="Late Night Drive">🚗 Late Night Drive</option>
                  <option value="Rooftop Drinks">🍸 Rooftop Drinks</option>
                </select>
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-emerald-950/60">
              <Link
                href="/?tab=find-me"
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#18241f]"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-rose-500 to-pink-500 shadow-md hover:from-rose-600 hover:to-pink-600 transition disabled:opacity-50 flex items-center gap-1.5 active:scale-95"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Dropping Clue...</span>
                  </>
                ) : (
                  <>
                    <Flame className="w-3.5 h-3.5" />
                    <span>Drop Mystery Clue</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export function UnifiedCreateFlow(props: UnifiedCreateFlowProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-xs text-slate-400">
          Loading Creation Studio...
        </div>
      }
    >
      <UnifiedCreateFlowContent {...props} />
    </Suspense>
  );
}
