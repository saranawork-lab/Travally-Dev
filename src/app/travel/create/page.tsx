"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ModeToggle } from "@/components/common/ModeToggle";
import {
  Compass,
  Calendar,
  Wallet,
  ArrowLeft,
  ArrowRight,
  Plus,
  X,
  CheckCircle2,
  Landmark,
  Trees,
  Backpack,
  Mountain,
  Car,
  Gem,
  Heart,
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

interface TravelStyleOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  desc: string;
  popular?: boolean;
}

const STYLES: TravelStyleOption[] = [
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

export default function CreateTravelPlanPage() {
  const router = useRouter();

  // Multi-step sliding flow: Step 1 = Style Tag Selection, Step 2 = Trip Details
  const [step, setStep] = useState<1 | 2>(1);

  const [formData, setFormData] = useState({
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

  const selectedStyleObj = STYLES.find((s) => s.id === formData.travelStyle);

  const handleSelectStyle = (styleId: string) => {
    setFormData({ ...formData, travelStyle: styleId });
    setStep(2);
  };

  const handleBackToStyles = () => {
    setStep(1);
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

  const addInterest = () => {
    if (interestInput.trim() && !interests.includes(interestInput.trim())) {
      setInterests([...interests, interestInput.trim()]);
      setInterestInput("");
    }
  };

  const removeInterest = (index: number) => {
    setInterests(interests.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        ...formData,
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

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 pb-36 sm:pb-28">
      <div>
        <Link
          href="/discover?mode=travel"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-orange-500 dark:hover:text-orange-400 transition transform hover:-translate-x-0.5 active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 text-orange-500" />
          <span>Back to Travel Expeditions</span>
        </Link>
      </div>

      <div className="bg-white dark:bg-[#111815] rounded-3xl border border-slate-200 dark:border-emerald-950/70 p-5 sm:p-8 shadow-xl relative overflow-hidden transition-all duration-300">
        {/* Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-emerald-950/40 h-1.5 rounded-full overflow-hidden mb-6">
          <div
            className="bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500 h-full transition-all duration-500 ease-out rounded-full shadow-xs"
            style={{ width: step === 1 ? "50%" : "100%" }}
          />
        </div>

        {/* Step Progress Header */}
        <div className="mb-6 pb-4 border-b border-slate-100 dark:border-emerald-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5 w-full text-center flex flex-col items-center">
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <ModeToggle
                currentMode="travel"
                onModeChange={(mode) => {
                  if (mode === "companion") window.location.href = "/activities/create";
                }}
                size="sm"
              />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Publish a Travel Plan
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
              {step === 1
                ? "First, select your travel style tag."
                : "Enter your destination, dates, and journey details."}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-900/60 text-xs font-semibold text-rose-800 dark:text-rose-200 animate-shake">
            {error}
          </div>
        )}

        {/* STEP 1: CHOOSE TRAVEL STYLE TAG */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-1">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Compass className="w-4 h-4 text-orange-500" />
                <span>Select Your Travel Style</span>
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                Tap on any style tag below to slide forward to trip details.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {STYLES.map((st) => {
                const isSelected = formData.travelStyle === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => handleSelectStyle(st.id)}
                    className={`p-4 rounded-2xl text-left border-2 transition-all duration-200 flex items-start gap-3.5 group transform active:scale-[0.98] hover:-translate-y-0.5 hover:shadow-md cursor-pointer ${
                      isSelected
                        ? "bg-orange-50 dark:bg-orange-950/60 border-orange-500 text-slate-900 dark:text-white ring-2 ring-orange-500/30"
                        : "bg-slate-50/80 dark:bg-[#16201b] border-slate-200/90 dark:border-emerald-950/60 text-slate-900 dark:text-slate-100 hover:border-orange-400 dark:hover:border-orange-500 hover:bg-white dark:hover:bg-[#131c18]"
                    }`}
                  >
                    <div className="p-2.5 rounded-xl bg-white dark:bg-[#18241f] shadow-xs border border-slate-200 dark:border-emerald-950/60 shrink-0 group-hover:scale-110 transition-transform">
                      {st.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="block text-sm font-bold text-slate-900 dark:text-white">
                          {st.label}
                        </span>
                        {st.popular && (
                          <span className="text-[10px] font-bold text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-950/80 px-2 py-0.5 rounded-full shrink-0">
                            Popular
                          </span>
                        )}
                      </div>
                      <span className="block text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 font-medium leading-relaxed">
                        {st.desc}
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-orange-500 self-center shrink-0 group-hover:translate-x-1 transition-all" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: TRIP DETAILS */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            {/* Active Style Bar */}
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
                onClick={handleBackToStyles}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-orange-700 dark:text-orange-300 bg-white dark:bg-[#16201b] border border-orange-300 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-[#1b2721] transition shadow-2xs active:scale-95 min-h-[36px]"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Change Style</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Destination & Departure */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                    Destination City or Region *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Kasol & Parvati Valley, Himachal"
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
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
                    value={formData.departureCity}
                    onChange={(e) => setFormData({ ...formData, departureCity: e.target.value })}
                    className="w-full rounded-2xl border border-slate-300 dark:border-emerald-950/80 bg-white dark:bg-[#16201b] px-4 py-3 text-xs text-slate-900 dark:text-white font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 min-h-[44px]"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                    Start Date *
                  </label>
                  <input
                    required
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
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
                    min={formData.startDate || new Date().toISOString().split("T")[0]}
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full rounded-2xl border border-slate-300 dark:border-emerald-950/80 bg-white dark:bg-[#16201b] px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 min-h-[44px]"
                  />
                </div>
              </div>

              {/* Budget Range */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                    Estimated Min Budget per Person (₹)
                  </label>
                  <input
                    type="number"
                    step="500"
                    placeholder="8000"
                    value={formData.budgetMin}
                    onChange={(e) => setFormData({ ...formData, budgetMin: e.target.value })}
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
                    value={formData.budgetMax}
                    onChange={(e) => setFormData({ ...formData, budgetMax: e.target.value })}
                    className="w-full rounded-2xl border border-slate-300 dark:border-emerald-950/80 bg-white dark:bg-[#16201b] px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 min-h-[44px]"
                  />
                </div>
              </div>

              {/* Preferences */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                    Accommodation Preference
                  </label>
                  <select
                    value={formData.accommodationPreference}
                    onChange={(e) => setFormData({ ...formData, accommodationPreference: e.target.value })}
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
                    value={formData.transportPreference}
                    onChange={(e) => setFormData({ ...formData, transportPreference: e.target.value })}
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

              {/* Planned Attractions */}
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

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-between gap-3 border-t border-slate-100 dark:border-emerald-950/60 flex-wrap">
                <button
                  type="button"
                  onClick={handleBackToStyles}
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
