"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ModeToggle, AppMode } from "@/components/common/ModeToggle";
import { ActivityCard } from "@/components/activities/ActivityCard";
import { ActivityFilters } from "@/components/activities/ActivityFilters";
import { TripCard } from "@/components/travel/TripCard";
import { TripFilters } from "@/components/travel/TripFilters";
import { DatabaseHealthGuard } from "@/components/common/DatabaseHealthGuard";
import { PlusCircle, SearchX, Compass, Search, MapPin, Users, Calendar, Luggage } from "lucide-react";
import Link from "next/link";

interface DiscoverClientProps {
  initialUser: any;
}

function DiscoverContent({ initialUser }: DiscoverClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialMode = (searchParams.get("mode") as AppMode) || "companion";
  const [mode, setMode] = useState<AppMode>(initialMode);
  const [currentUser, setCurrentUser] = useState<any>(initialUser);
  const [heroSearchY, setHeroSearchY] = useState(0);

  // Companion state
  const [activities, setActivities] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [activitySearch, setActivitySearch] = useState("");
  const [activitySort, setActivitySort] = useState("UPCOMING");
  const [activityOpenSpotsOnly, setActivityOpenSpotsOnly] = useState(false);
  const [loadingActivities, setLoadingActivities] = useState(true);

  // Travel state
  const [travelPlans, setTravelPlans] = useState<any[]>([]);
  const [selectedTravelStyle, setSelectedTravelStyle] = useState("ALL");
  const [tripSearch, setTripSearch] = useState("");
  const [tripSort, setTripSort] = useState("UPCOMING");
  const [tripOpenSpotsOnly, setTripOpenSpotsOnly] = useState(false);
  const [loadingTrips, setLoadingTrips] = useState(true);

  // Keep user in sync; if unauthenticated, redirect immediately to landing page
  useEffect(() => {
    if (!initialUser) {
      fetch("/api/auth/me")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.user) {
            setCurrentUser(data.user);
          } else {
            router.replace("/");
          }
        })
        .catch(() => {
          router.replace("/");
        });
    }
  }, [initialUser, router]);

  // Update mode when URL param changes
  useEffect(() => {
    const urlMode = searchParams.get("mode") as AppMode;
    if (urlMode && (urlMode === "companion" || urlMode === "travel")) {
      setMode(urlMode);
    }
    const q = searchParams.get("search") || "";
    if (urlMode === "travel" || mode === "travel") {
      setTripSearch(q);
    } else {
      setActivitySearch(q);
    }
  }, [searchParams, mode]);

  // Real-time mobile navbar search listener with zero latency
  useEffect(() => {
    const handleTravallySearch = (e: any) => {
      const q = e?.detail ?? "";
      if (mode === "companion") {
        setActivitySearch(q);
      } else {
        setTripSearch(q);
      }
    };
    window.addEventListener("travally-search", handleTravallySearch);
    return () => window.removeEventListener("travally-search", handleTravallySearch);
  }, [mode]);

  // Track scroll for Hero Search fading
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setHeroSearchY(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch activities
  const fetchActivities = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== "ALL") params.set("category", selectedCategory);
      if (activitySearch.trim()) params.set("search", activitySearch.trim());

      const url = params.toString() ? `/api/activities?${params.toString()}` : `/api/activities`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.activities || [];
        setActivities(list);
      }
    } catch (e) {
      console.error("fetchActivities error:", e);
    } finally {
      setLoadingActivities(false);
    }
  };

  // Fetch travel plans
  const fetchTravelPlans = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedTravelStyle !== "ALL") params.set("style", selectedTravelStyle);
      if (tripSearch.trim()) params.set("search", tripSearch.trim());

      const url = params.toString() ? `/api/travel?${params.toString()}` : `/api/travel`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.travelPlans || [];
        setTravelPlans(list);
      }
    } catch (e) {
      console.error("fetchTravelPlans error:", e);
    } finally {
      setLoadingTrips(false);
    }
  };

  useEffect(() => {
    if (mode === "companion") {
      fetchActivities();
    }
  }, [mode, selectedCategory, activitySearch]);

  useEffect(() => {
    if (mode === "travel") {
      fetchTravelPlans();
    }
  }, [mode, selectedTravelStyle, tripSearch]);

  // Filter and sort activities client-side in realtime
  const displayActivities = useMemo(() => {
    let list = [...activities];

    if (activityOpenSpotsOnly) {
      list = list.filter((act) => {
        const max = act.maxParticipants || 1;
        const current = act.currentAcceptedCount || 0;
        return current < max && act.status !== "FULL" && act.status !== "CANCELLED";
      });
    }

    if (activitySort === "UPCOMING") {
      list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } else if (activitySort === "SPOTS_LEFT") {
      list.sort((a, b) => {
        const spotsA = (a.maxParticipants || 1) - (a.currentAcceptedCount || 0);
        const spotsB = (b.maxParticipants || 1) - (b.currentAcceptedCount || 0);
        return spotsB - spotsA;
      });
    } else if (activitySort === "NEWEST") {
      list.sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());
    } else if (activitySort === "TITLE") {
      list.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    }

    return list;
  }, [activities, activityOpenSpotsOnly, activitySort]);

  // Filter and sort travel plans client-side in realtime
  const displayTravelPlans = useMemo(() => {
    let list = [...travelPlans];

    if (tripOpenSpotsOnly) {
      list = list.filter((t) => {
        const max = t.maxTravelers || 4;
        const current = t.requests ? t.requests.filter((r: any) => r.status === "ACCEPTED").length : 0;
        return current < max;
      });
    }

    if (tripSort === "UPCOMING") {
      list.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    } else if (tripSort === "SPOTS_LEFT") {
      list.sort((a, b) => {
        const maxA = a.maxTravelers || 4;
        const maxB = b.maxTravelers || 4;
        return maxB - maxA;
      });
    } else if (tripSort === "NEWEST") {
      list.sort((a, b) => new Date(b.createdAt || b.startDate).getTime() - new Date(a.createdAt || a.startDate).getTime());
    } else if (tripSort === "DESTINATION") {
      list.sort((a, b) => (a.destination || "").localeCompare(b.destination || ""));
    }

    return list;
  }, [travelPlans, tripOpenSpotsOnly, tripSort]);

  const handleModeChange = (newMode: AppMode) => {
    setMode(newMode);
    window.history.replaceState(null, '', `/discover?mode=${newMode}`);
  };

  return (
    <DatabaseHealthGuard>
      <div className="w-full flex flex-col min-h-screen">
        
        {/* ── HERO SECTION ── */}
        <div className="w-full relative h-[25vh] sm:h-[30vh] min-h-[200px] max-h-[280px] bg-slate-100 mb-10 sm:mb-8">
          <div className="absolute inset-0 overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&auto=format&fit=crop&q=80"
              alt="Discover Travally"
              className="absolute inset-0 w-full h-full object-cover object-center animate-fade-in-up"
            />
            {/* White gradient at top to ensure logo legibility, dark at bottom for contrast */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-transparent to-black/20" />
          </div>
          
          {/* Overlapping Mode Toggle Tabs */}
          <div className="absolute bottom-0 left-0 right-0 translate-y-1/2 px-4 sm:px-6 md:px-8 flex justify-center z-20">
            <div className="bg-white dark:bg-[#111815] rounded-2xl sm:rounded-full shadow-lg border border-slate-100 dark:border-emerald-950/60 flex items-stretch h-14 sm:h-16 w-full max-w-sm px-2">
              <button 
                onClick={() => handleModeChange("companion")} 
                className={`flex-1 flex flex-col items-center justify-center relative transition-colors ${mode === 'companion' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}
              >
                <div className="flex items-center justify-center gap-2 font-bold text-[15px] sm:text-base">
                  <Users className="w-5 h-5" />
                  Companion
                </div>
                {mode === "companion" && <div className="absolute bottom-0 left-6 right-6 h-1 bg-emerald-600 dark:bg-emerald-500 rounded-t-full" />}
              </button>
              <div className="w-px bg-slate-100 dark:bg-emerald-900/40 my-3" />
              <button 
                onClick={() => handleModeChange("travel")} 
                className={`flex-1 flex flex-col items-center justify-center relative transition-colors ${mode === 'travel' ? 'text-orange-600 dark:text-orange-400' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}
              >
                <div className="flex items-center justify-center gap-2 font-bold text-[15px] sm:text-base">
                  <Luggage className="w-5 h-5" />
                  Travel
                </div>
                {mode === "travel" && <div className="absolute bottom-0 left-6 right-6 h-1 bg-orange-600 dark:bg-orange-500 rounded-t-full" />}
              </button>
            </div>
          </div>
        </div>

        {/* Existing Feed Content */}
        <div className="max-w-7xl mx-auto w-full px-3.5 sm:px-6 lg:px-8 pt-2 sm:pt-4 pb-32 sm:pb-16 space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {mode === "companion" ? "Discover Companions" : "Discover Travel"}
            </h2>
          </div>

        {/* Mode 1: COMPANION FEED */}
        {mode === "companion" && (
          <section className="space-y-6">
            <ActivityFilters
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              searchQuery={activitySearch}
              onSearchChange={setActivitySearch}
              sortBy={activitySort}
              onSortChange={setActivitySort}
              openSpotsOnly={activityOpenSpotsOnly}
              onOpenSpotsToggle={setActivityOpenSpotsOnly}
              totalCount={displayActivities.length}
            />

            {loadingActivities ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-64 rounded-3xl bg-slate-100 dark:bg-[#131c18] animate-pulse border border-slate-200 dark:border-emerald-950/70"
                  />
                ))}
              </div>
            ) : displayActivities.length === 0 ? (
              <div className="text-center py-16 px-4 bg-white dark:bg-[#111815] rounded-3xl border border-slate-200 dark:border-emerald-950/70 max-w-lg mx-auto">
                <SearchX className="w-10 h-10 text-emerald-600 dark:text-emerald-400 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  No activities match your filter
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                  {activityOpenSpotsOnly
                    ? "Try turning off 'Spots Available' filter to view upcoming activities that are currently full."
                    : "Be the first to organize an activity for this category in your area!"}
                </p>
                <div className="pt-4">
                  <Link
                    href="/activities/create"
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-bold text-emerald-950 dark:text-emerald-200 bg-gradient-to-r from-emerald-100 via-teal-50 to-emerald-100 dark:from-emerald-950/80 dark:to-teal-950/70 hover:from-emerald-200 hover:to-teal-100 border border-emerald-300/80 dark:border-emerald-800/60 shadow-xs transition"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Create an Activity</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayActivities.map((act) => (
                  <ActivityCard
                    key={act.id}
                    activity={act}
                    currentUser={currentUser}
                    onRefresh={fetchActivities}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Mode 2: TRAVEL FEED (Crisp Structured Cards View) */}
        {mode === "travel" && (
          <section className="space-y-6">
            <TripFilters
              selectedStyle={selectedTravelStyle}
              onSelectStyle={setSelectedTravelStyle}
              searchQuery={tripSearch}
              onSearchChange={setTripSearch}
              sortBy={tripSort}
              onSortChange={setTripSort}
              openSpotsOnly={tripOpenSpotsOnly}
              onOpenSpotsToggle={setTripOpenSpotsOnly}
              totalCount={displayTravelPlans.length}
            />

            {loadingTrips ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-96 rounded-3xl bg-slate-100 dark:bg-[#131c18] animate-pulse border border-slate-200 dark:border-emerald-950/70"
                  />
                ))}
              </div>
            ) : displayTravelPlans.length === 0 ? (
              <div className="text-center py-16 px-4 bg-white dark:bg-[#111815] rounded-3xl border border-slate-200 dark:border-emerald-950/70 max-w-lg mx-auto">
                <Compass className="w-10 h-10 text-orange-500 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  No expeditions found for this destination or style
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                  Publish your upcoming destination and connect with fellow explorers traveling at the same time.
                </p>
                <div className="pt-4">
                  <Link
                    href="/travel/create"
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-bold text-orange-950 dark:text-orange-200 bg-gradient-to-r from-orange-100 via-amber-50 to-orange-100 dark:from-orange-950/80 dark:to-amber-950/70 hover:from-orange-200 hover:to-amber-100 border border-orange-300/80 dark:border-orange-800/60 shadow-xs transition"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Publish a Travel Plan</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayTravelPlans.map((trip) => (
                  <TripCard
                    key={trip.id}
                    trip={trip}
                    currentUser={currentUser}
                    onRefresh={fetchTravelPlans}
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </div>
      </div>
    </DatabaseHealthGuard>
  );
}

export function DiscoverClient({ initialUser }: DiscoverClientProps) {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-xs text-slate-400 dark:text-slate-500">
          Loading discover feed...
        </div>
      }
    >
      <DiscoverContent initialUser={initialUser} />
    </Suspense>
  );
}
