"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ModeToggle } from "@/components/common/ModeToggle";
import {
  Users,
  Calendar,
  Clock,
  Shield,
  ArrowLeft,
  ArrowRight,
  Layers,
  Gamepad2,
  Film,
  Coffee,
  Footprints,
  BookOpen,
  Beer,
  ShoppingBag,
  Compass,
  CheckCircle2,
  UploadCloud,
  X,
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

interface CategoryOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  tag: string;
  hint: string;
  popular?: boolean;
}

const CATEGORIES: CategoryOption[] = [
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
    hint: "First day first show (FDFS), IMAX screenings, regional cinema, indie film discussions",
    popular: true,
  },
  {
    id: "WALKING",
    label: "Turf Sports & Fitness",
    tag: "Cricket & Badminton",
    icon: <IconSports className="w-10 h-10" />,
    hint: "Box cricket, weekend badminton, morning runs at KBR park, turf football",
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

export default function CreateActivityPage() {
  const router = useRouter();

  // Multi-step sliding flow: Step 1 = Tag Selection, Step 2 = Details Form
  const [step, setStep] = useState<1 | 2>(1);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");

  const [formData, setFormData] = useState({
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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedCategoryObj = CATEGORIES.find((c) => c.id === formData.category);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image must be smaller than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle selecting a tag/category -> smoothly slides to step 2
  const handleSelectCategory = (categoryId: string) => {
    setFormData((prev) => ({ ...prev, category: categoryId }));
    setDirection("forward");
    setStep(2);
  };

  const handleBackToTags = () => {
    setDirection("backward");
    setStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const now = new Date();
      const selectedDate = new Date(`${formData.date}T${formData.startTime}`);
      if (selectedDate <= now) {
        throw new Error("Cannot select a date and time in the past.");
      }

      const payload = {
        ...formData,
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

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 pb-36 sm:pb-28">
      {/* Top Breadcrumb Navigation */}
      <div>
        <Link
          href="/discover?mode=companion"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition transform hover:-translate-x-0.5 active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Back to Activities</span>
        </Link>
      </div>

      <div className="bg-white dark:bg-dark-card rounded-3xl border border-slate-200 dark:border-dark-border p-5 sm:p-8 shadow-lg relative overflow-hidden transition-all duration-300">
        {/* Animated 2-Step Progress Indicator Bar */}
        <div className="w-full bg-slate-100 dark:bg-emerald-950/40 h-1.5 rounded-full overflow-hidden mb-6">
          <div
            className="bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 h-full transition-all duration-500 ease-out rounded-full shadow-xs"
            style={{ width: step === 1 ? "50%" : "100%" }}
          />
        </div>

        {/* Responsive Step Progress Header */}
        <div className="mb-6 pb-4 border-b border-slate-100 dark:border-dark-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5 w-full text-center flex flex-col items-center">
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <ModeToggle
                currentMode="companion"
                onModeChange={(mode) => {
                  if (mode === "travel") window.location.href = "/travel/create";
                }}
                size="sm"
              />
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
        {/* STEP 1: CHOOSE ACTIVITY TAG */}
        {/* ========================================================================= */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-1">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-500" />
                <span>Select Activity Tag</span>
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                Tap on any tag below to continue. The form will slide forward automatically.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {CATEGORIES.map((cat) => {
                const isSelected = formData.category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleSelectCategory(cat.id)}
                    className={`p-4 rounded-2xl text-left border-2 transition-all duration-200 flex items-start gap-3.5 group transform active:scale-[0.98] hover:-translate-y-0.5 hover:shadow-md cursor-pointer ${
                      isSelected
                        ? "bg-emerald-50 dark:bg-emerald-950/70 border-emerald-500 text-slate-900 dark:text-white ring-2 ring-emerald-500/30"
                        : "bg-slate-50/80 dark:bg-dark-elevated border-slate-200/90 dark:border-dark-border text-slate-900 dark:text-slate-100 hover:border-emerald-400 dark:hover:border-emerald-500 hover:bg-white dark:hover:bg-dark-card"
                    }`}
                  >
                    <div className="p-2.5 rounded-xl bg-white dark:bg-dark-card shadow-xs border border-slate-200 dark:border-dark-border shrink-0 group-hover:scale-110 transition-transform">
                      {cat.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="block text-sm font-bold text-slate-900 dark:text-white">
                          {cat.label}
                        </span>
                        {cat.popular && (
                          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full shrink-0">
                            Popular
                          </span>
                        )}
                      </div>
                      <span className="block text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 font-medium leading-relaxed">
                        {cat.hint}
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 self-center shrink-0 group-hover:translate-x-1 transition-all" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: DETAILS FORM */}
        {/* ========================================================================= */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            {/* Active Tag Bar & Change Button */}
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
                onClick={handleBackToTags}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-white dark:bg-dark-card border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-dark-elevated transition shadow-2xs active:scale-95 min-h-[36px]"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Change Tag</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title & Description */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                    Activity Title *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Screening of Wim Wenders 'Perfect Days' + Post-Film Coffee"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full rounded-2xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-elevated p-4 text-xs text-slate-900 dark:text-white font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 leading-relaxed transition-all"
                  />
                </div>
              </div>

              {/* Date, Time & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                    Date *
                  </label>
                  <input
                    required
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
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
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
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
                    value={formData.approxDurationHours}
                    onChange={(e) => setFormData({ ...formData, approxDurationHours: e.target.value })}
                    className="w-full rounded-2xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-elevated px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 min-h-[44px]"
                  />
                </div>
              </div>

              {/* Preferences: Gender & Cutoff */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                    Gender Preference
                  </label>
                  <select
                    value={formData.genderPreference}
                    onChange={(e) => setFormData({ ...formData, genderPreference: e.target.value })}
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
                    value={formData.cutoffHoursBeforeStart}
                    onChange={(e) => setFormData({ ...formData, cutoffHoursBeforeStart: e.target.value })}
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

              {/* Requirements */}
              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                  Joining Requirements or Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Please purchase ticket in advance, or bring comfortable shoes"
                  value={formData.additionalRequirements}
                  onChange={(e) => setFormData({ ...formData, additionalRequirements: e.target.value })}
                  className="w-full rounded-2xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-elevated px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 min-h-[44px]"
                />
              </div>

              {/* Cover Image Upload */}
              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                  Cover Image (Optional)
                </label>
                <div className="w-full">
                  {formData.imageUrl ? (
                    <div className="relative w-full h-40 rounded-2xl overflow-hidden border border-slate-200 dark:border-dark-border shadow-sm">
                      <img src={formData.imageUrl} alt="Upload preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, imageUrl: "" })}
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

              {/* Safety & Review Notice */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-elevated border border-slate-200 dark:border-dark-border text-xs text-slate-700 dark:text-slate-300 space-y-1">
                <span className="font-bold text-slate-900 dark:text-white block">
                  Organizer Review &amp; Safety
                </span>
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  Interested companions will submit requests. You review their profile and approve before the private 1-on-1 or group chat is unlocked.
                </p>
              </div>

              {/* Action Buttons with Bottom Safety Spacing */}
              <div className="pt-3 flex items-center justify-between gap-3 border-t border-slate-100 dark:border-dark-border flex-wrap">
                <button
                  type="button"
                  onClick={handleBackToTags}
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
      </div>
    </div>
  );
}
