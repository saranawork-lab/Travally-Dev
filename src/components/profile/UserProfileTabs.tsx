"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Camera,
  Sprout,
  Plane,
  Users,
  Flame,
  Gem,
  MapPin,
  Calendar,
  Clock,
  Compass,
  ArrowRight,
  EyeOff,
  Plus,
  Layers,
} from "lucide-react";
import { UserInstantsSection } from "@/components/home/UserInstantsSection";
import { formatTimeAgo } from "@/lib/utils";

export type ProfileContentTab = "instants" | "activities" | "find-me" | "treasure";
export type ActivitySubFilter = "all" | "companion" | "travel" | "grow";

interface UserProfileTabsProps {
  userId: string;
  userName: string;
  isOwn: boolean;
}

export const UserProfileTabs: React.FC<UserProfileTabsProps> = ({ userId, userName, isOwn }) => {
  const [activeTab, setActiveTab] = useState<ProfileContentTab>("instants");
  const [activityFilter, setActivityFilter] = useState<ActivitySubFilter>("all");

  // Content state caches
  const [growList, setGrowList] = useState<any[]>([]);
  const [travelList, setTravelList] = useState<any[]>([]);
  const [companionList, setCompanionList] = useState<any[]>([]);
  const [findMeList, setFindMeList] = useState<any[]>([]);
  const [treasureList, setTreasureList] = useState<any[]>([]);

  const [loadingGrow, setLoadingGrow] = useState(false);
  const [loadingTravel, setLoadingTravel] = useState(false);
  const [loadingCompanion, setLoadingCompanion] = useState(false);
  const [loadingFindMe, setLoadingFindMe] = useState(false);
  const [loadingTreasure, setLoadingTreasure] = useState(false);

  // Fetch activities data when switching to activities or on initial load
  useEffect(() => {
    if (activeTab === "activities") {
      if (growList.length === 0 && !loadingGrow) {
        setLoadingGrow(true);
        fetch(`/api/home/grow?userId=${userId}`)
          .then(res => res.json())
          .then(data => {
            if (data.initiatives) setGrowList(data.initiatives);
          })
          .catch(console.error)
          .finally(() => setLoadingGrow(false));
      }
      if (travelList.length === 0 && !loadingTravel) {
        setLoadingTravel(true);
        fetch(`/api/travel?userId=${userId}&status=ALL`)
          .then(res => res.json())
          .then(data => {
            if (data.travelPlans) setTravelList(data.travelPlans);
          })
          .catch(console.error)
          .finally(() => setLoadingTravel(false));
      }
      if (isOwn && companionList.length === 0 && !loadingCompanion) {
        setLoadingCompanion(true);
        fetch(`/api/activities?userId=${userId}&status=ALL`)
          .then(res => res.json())
          .then(data => {
            if (data.activities) setCompanionList(data.activities);
          })
          .catch(console.error)
          .finally(() => setLoadingCompanion(false));
      }
    } else if (activeTab === "find-me" && isOwn && findMeList.length === 0) {
      setLoadingFindMe(true);
      fetch(`/api/home/find-me?userId=${userId}`)
        .then(res => res.json())
        .then(data => {
          if (data.clues) setFindMeList(data.clues);
        })
        .catch(console.error)
        .finally(() => setLoadingFindMe(false));
    } else if (activeTab === "treasure" && isOwn && treasureList.length === 0) {
      setLoadingTreasure(true);
      fetch(`/api/home/treasure?userId=${userId}`)
        .then(res => res.json())
        .then(data => {
          if (data.treasures) setTreasureList(data.treasures);
        })
        .catch(console.error)
        .finally(() => setLoadingTreasure(false));
    }
  }, [activeTab, userId, isOwn, growList.length, travelList.length, companionList.length, findMeList.length, treasureList.length, loadingGrow, loadingTravel, loadingCompanion]);

  // Pre-fetch activity counts in background so badge count is accurate
  useEffect(() => {
    fetch(`/api/home/grow?userId=${userId}`)
      .then(res => res.json())
      .then(data => {
        if (data.initiatives) setGrowList(data.initiatives);
      })
      .catch(() => {});

    fetch(`/api/travel?userId=${userId}&status=ALL`)
      .then(res => res.json())
      .then(data => {
        if (data.travelPlans) setTravelList(data.travelPlans);
      })
      .catch(() => {});

    if (isOwn) {
      fetch(`/api/activities?userId=${userId}&status=ALL`)
        .then(res => res.json())
        .then(data => {
          if (data.activities) setCompanionList(data.activities);
        })
        .catch(() => {});
    }
  }, [userId, isOwn]);

  const totalActivitiesCount =
    (isOwn ? companionList.length : 0) + travelList.length + growList.length;

  // Unified top-level navigation tabs
  const tabs: {
    id: ProfileContentTab;
    label: string;
    icon: React.ReactNode;
    color: string;
    privateOnly?: boolean;
    count?: number;
  }[] = [
    {
      id: "instants",
      label: "Posts",
      icon: <Camera className="w-4 h-4" />,
      color: "from-amber-500/20 to-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-300 dark:border-orange-800",
    },
    {
      id: "activities",
      label: "Activities",
      icon: <Compass className="w-4 h-4" />,
      color: "from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800",
      count: totalActivitiesCount > 0 ? totalActivitiesCount : undefined,
    },
    // The following two are strictly owner-only:
    ...(isOwn
      ? [
          {
            id: "find-me" as ProfileContentTab,
            label: "Find Me",
            icon: <Flame className="w-4 h-4" />,
            color: "from-rose-500/20 to-amber-500/20 text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-800",
            privateOnly: true,
            count: findMeList.length > 0 ? findMeList.length : undefined,
          },
          {
            id: "treasure" as ProfileContentTab,
            label: "Treasure",
            icon: <Gem className="w-4 h-4" />,
            color: "from-purple-500/20 to-indigo-500/20 text-purple-600 dark:text-purple-400 border-purple-300 dark:border-purple-800",
            privateOnly: true,
            count: treasureList.length > 0 ? treasureList.length : undefined,
          },
        ]
      : []),
  ];

  const isLoadingActivities =
    loadingGrow || loadingTravel || (isOwn && loadingCompanion);

  return (
    <div className="space-y-6">
      {/* ── Tabs Navigation Bar ── */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 p-1 bg-slate-100/80 dark:bg-[#0c1410] rounded-2xl sm:rounded-full border border-slate-200/80 dark:border-emerald-950/70">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl sm:rounded-full text-xs font-bold transition-all duration-200 whitespace-nowrap shrink-0 ${
                isActive
                  ? "bg-white dark:bg-[#16221c] text-slate-900 dark:text-white shadow-sm border border-slate-200/90 dark:border-emerald-800/80 scale-[1.02]"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-[#111915]/50"
              }`}
            >
              <span className={isActive ? "text-emerald-500" : ""}>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.privateOnly && (
                <span className="p-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 text-[9px]" title="Private to you">
                  <EyeOff className="w-2.5 h-2.5" />
                </span>
              )}
              {tab.count !== undefined && (
                <span className="px-1.5 py-0.2 rounded-full bg-slate-200/80 dark:bg-emerald-950/80 text-[10px] font-black">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Tab Content ── */}
      <div className="transition-all duration-300">
        {/* 1. INSTANTS (POSTS) TAB */}
        {activeTab === "instants" && (
          <UserInstantsSection
            userId={userId}
            userName={userName}
            isOwn={isOwn}
          />
        )}

        {/* 2. UNIFIED ACTIVITIES TAB (Combines Grow, Travel, and Companion) */}
        {activeTab === "activities" && (
          <div className="space-y-5">
            {/* Activities Header with Actions & Description */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-emerald-500" />
                  <span>{isOwn ? "My Activities & Trips" : `${userName}'s Activities`}</span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  {isOwn
                    ? "Your companion meetups, travel expeditions, and grow initiatives"
                    : `Expeditions and green initiatives organized by ${userName}`}
                </p>
              </div>

              {isOwn && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Link
                    href="/create?type=companion"
                    className="px-3 py-1.5 rounded-full text-xs font-bold text-teal-900 dark:text-teal-300 bg-teal-100 dark:bg-teal-950 border border-teal-300 dark:border-teal-800/60 hover:scale-105 transition flex items-center gap-1 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Host Meetup</span>
                  </Link>
                  <Link
                    href="/create?type=travel"
                    className="px-3 py-1.5 rounded-full text-xs font-bold text-blue-900 dark:text-blue-300 bg-blue-100 dark:bg-blue-950 border border-blue-300 dark:border-blue-800/60 hover:scale-105 transition flex items-center gap-1 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Plan Trip</span>
                  </Link>
                  <Link
                    href="/create?type=grow"
                    className="px-3 py-1.5 rounded-full text-xs font-bold text-emerald-900 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800/60 hover:scale-105 transition flex items-center gap-1 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Grow Mission</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Sub-Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              <button
                type="button"
                onClick={() => setActivityFilter("all")}
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  activityFilter === "all"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-slate-100 dark:bg-[#121c17] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Layers className="w-3 h-3" />
                <span>All ({totalActivitiesCount})</span>
              </button>

              {isOwn && (
                <button
                  type="button"
                  onClick={() => setActivityFilter("companion")}
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    activityFilter === "companion"
                      ? "bg-teal-600 text-white shadow-sm"
                      : "bg-slate-100 dark:bg-[#121c17] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Users className="w-3 h-3 text-teal-400" />
                  <span>Companion ({companionList.length})</span>
                  <span title="Private to you" className="inline-flex items-center">
                    <EyeOff className="w-2.5 h-2.5 opacity-70" />
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setActivityFilter("travel")}
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  activityFilter === "travel"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-slate-100 dark:bg-[#121c17] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Plane className="w-3 h-3 text-blue-400" />
                <span>Travel ({travelList.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActivityFilter("grow")}
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  activityFilter === "grow"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-slate-100 dark:bg-[#121c17] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Sprout className="w-3 h-3 text-emerald-400" />
                <span>Grow ({growList.length})</span>
              </button>
            </div>

            {/* Activities Content Area */}
            {isLoadingActivities ? (
              <div className="py-12 text-center text-xs text-slate-400 animate-pulse">
                Loading activities and trips...
              </div>
            ) : totalActivitiesCount === 0 ? (
              <div className="py-12 px-4 rounded-3xl bg-white dark:bg-[#111815] border border-slate-200/80 dark:border-emerald-950/70 text-center space-y-3">
                <Compass className="w-9 h-9 text-emerald-500 mx-auto opacity-60" />
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {isOwn ? "No activities or trips created yet" : `${userName} has no active activities yet`}
                </p>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  {isOwn
                    ? "Create companion meetups, plan road trips, or launch green community initiatives to connect with other explorers."
                    : "Check back later to see upcoming expeditions and community missions."}
                </p>
                {isOwn && (
                  <div className="pt-2 flex items-center justify-center gap-2 flex-wrap">
                    <Link
                      href="/create?type=companion"
                      className="px-3.5 py-1.5 rounded-full text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition shadow-sm"
                    >
                      Host First Activity
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Companion Activities (Only shown for owner) */}
                {isOwn &&
                  (activityFilter === "all" || activityFilter === "companion") &&
                  companionList.map((act) => (
                    <Link
                      key={`comp-${act.id}`}
                      href={`/activities/${act.id}`}
                      className="group rounded-3xl bg-white dark:bg-[#111815] border border-slate-200 dark:border-emerald-950/80 p-4 space-y-3 shadow-sm hover:shadow-lg hover:border-teal-500/50 transition-all block"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 font-bold text-[10px] border border-teal-200 dark:border-teal-800 flex items-center gap-1">
                            <Users className="w-2.5 h-2.5" />
                            <span>{act.category || "COMPANION"}</span>
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.5 rounded-full" title="Only you can see this in your profile">
                            <EyeOff className="w-2.5 h-2.5 text-slate-400" />
                            <span>Private</span>
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                          {act.status || "OPEN"}
                        </span>
                      </div>
                      <div>
                        <h5 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1 group-hover:text-teal-500 transition-colors">
                          {act.title}
                        </h5>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                          {act.description}
                        </p>
                      </div>
                      <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100 dark:border-emerald-950/60">
                        <span className="flex items-center gap-1 text-slate-500">
                          <MapPin className="w-3 h-3 text-teal-500" />
                          <span className="truncate max-w-[120px]">{act.locationName}</span>
                        </span>
                        <span className="text-teal-600 dark:text-teal-400 font-bold flex items-center gap-1">
                          <span>Manage</span>
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </Link>
                  ))}

                {/* 2. Travel Plans */}
                {(activityFilter === "all" || activityFilter === "travel") &&
                  travelList.map((trip) => (
                    <Link
                      key={`travel-${trip.id}`}
                      href={`/travel/${trip.id}`}
                      className="group rounded-3xl bg-white dark:bg-[#111815] border border-slate-200 dark:border-emerald-950/80 p-4 space-y-3 shadow-sm hover:shadow-lg hover:border-blue-500/50 transition-all block"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-bold text-[10px] border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                          <Plane className="w-2.5 h-2.5" />
                          <span>{trip.travelStyle || "TRAVEL"}</span>
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {trip.startDate ? new Date(trip.startDate).toLocaleDateString() : "Flexible"}
                        </span>
                      </div>
                      <div>
                        <h5 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1 group-hover:text-blue-500 transition-colors">
                          {trip.destination}
                        </h5>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                          {trip.description}
                        </p>
                      </div>
                      <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100 dark:border-emerald-950/60">
                        <span className="text-slate-500 font-medium">
                          Budget: {trip.estimatedCost ? `₹${trip.estimatedCost}` : "Shared"}
                        </span>
                        <span className="text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1">
                          <span>Details</span>
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </Link>
                  ))}

                {/* 3. Grow Initiatives */}
                {(activityFilter === "all" || activityFilter === "grow") &&
                  growList.map((item) => (
                    <div
                      key={`grow-${item.id}`}
                      className="group rounded-3xl bg-white dark:bg-[#111815] border border-slate-200 dark:border-emerald-950/80 p-4 space-y-3 shadow-sm hover:shadow-lg hover:border-emerald-500/50 transition-all"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                          <Sprout className="w-2.5 h-2.5" />
                          <span>{item.causeCategory || "GROW"}</span>
                        </span>
                        {item.date && (
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-emerald-500" />
                            <span>{item.date}</span>
                          </span>
                        )}
                      </div>
                      <div>
                        <h5 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">
                          {item.title}
                        </h5>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                          {item.description}
                        </p>
                      </div>
                      <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100 dark:border-emerald-950/60">
                        <span className="flex items-center gap-1 text-slate-500">
                          <MapPin className="w-3 h-3 text-emerald-500" />
                          <span className="truncate max-w-[120px]">{item.locationName}</span>
                        </span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {item.volunteersCount || 1} / {item.volunteersNeeded || 10} volunteers
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* 3. FIND ME TAB (OWNER ONLY) */}
        {activeTab === "find-me" && isOwn && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-rose-500" />
                  <span>My Find Me Beacons</span>
                  <span className="text-[10px] font-semibold text-slate-400 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">
                    Private to you
                  </span>
                </h4>
                <p className="text-[11px] text-slate-400">Live clues & hangout signals you dropped</p>
              </div>
              <Link
                href="/?tab=find-me"
                className="px-3 py-1.5 rounded-full text-xs font-bold text-rose-900 dark:text-rose-300 bg-rose-100 dark:bg-rose-950 border border-rose-300 dark:border-rose-800/60 hover:scale-105 transition flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Drop Clue</span>
              </Link>
            </div>

            {loadingFindMe ? (
              <div className="py-12 text-center text-xs text-slate-400 animate-pulse">Loading clues...</div>
            ) : findMeList.length === 0 ? (
              <div className="py-12 px-4 rounded-3xl bg-white dark:bg-[#111815] border border-slate-200/80 dark:border-emerald-950/70 text-center space-y-2">
                <Flame className="w-8 h-8 text-rose-500 mx-auto opacity-60" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No active Find Me beacons</p>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  Drop a clue about where you are right now (e.g., a cafe or bookstore) to let serendipity connect you with travelers.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {findMeList.map((clue) => (
                  <div
                    key={clue.id}
                    className="rounded-3xl bg-white dark:bg-[#111815] border border-slate-200 dark:border-emerald-950/80 p-4 space-y-3 shadow-sm hover:border-rose-500/50 transition-all"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 font-bold text-[10px] border border-rose-200 dark:border-rose-800">
                        {clue.vibeTag || "Beacon"}
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatTimeAgo(clue.createdAt)}</span>
                      </span>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 leading-relaxed italic">
                        &ldquo;{clue.clueText}&rdquo;
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100 dark:border-emerald-950/60">
                      <span className="flex items-center gap-1 text-slate-500">
                        <MapPin className="w-3 h-3 text-rose-500" />
                        <span>Near {clue.hintArea}</span>
                      </span>
                      <span className="font-bold text-rose-600 dark:text-rose-400">
                        {clue.guessesCount || 0} guesses
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 4. TREASURE TAB (OWNER ONLY) */}
        {activeTab === "treasure" && isOwn && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Gem className="w-4 h-4 text-purple-500" />
                  <span>My Hidden Treasures</span>
                  <span className="text-[10px] font-semibold text-slate-400 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">
                    Private to you
                  </span>
                </h4>
                <p className="text-[11px] text-slate-400">Treasure spots and riddles you created</p>
              </div>
              <Link
                href="/?tab=treasure"
                className="px-3 py-1.5 rounded-full text-xs font-bold text-purple-900 dark:text-purple-300 bg-purple-100 dark:bg-purple-950 border border-purple-300 dark:border-purple-800/60 hover:scale-105 transition flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Hide Treasure</span>
              </Link>
            </div>

            {loadingTreasure ? (
              <div className="py-12 text-center text-xs text-slate-400 animate-pulse">Loading treasures...</div>
            ) : treasureList.length === 0 ? (
              <div className="py-12 px-4 rounded-3xl bg-white dark:bg-[#111815] border border-slate-200/80 dark:border-emerald-950/70 text-center space-y-2">
                <Gem className="w-8 h-8 text-purple-500 mx-auto opacity-60" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No treasures placed yet</p>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  Hide digital souvenir badges or fun riddles on the map for explorers discovering your city.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {treasureList.map((t) => (
                  <div
                    key={t.id}
                    className="rounded-3xl bg-white dark:bg-[#111815] border border-slate-200 dark:border-emerald-950/80 p-4 space-y-3 shadow-sm hover:border-purple-500/50 transition-all"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-bold text-[10px] border border-purple-200 dark:border-purple-800">
                        {t.difficulty || "MEDIUM"}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {t.findersCount || 0} claimed
                      </span>
                    </div>
                    <div>
                      <h5 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">{t.title}</h5>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 italic">&ldquo;{t.hintRiddle}&rdquo;</p>
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100 dark:border-emerald-950/60">
                      <span className="flex items-center gap-1 text-slate-500">
                        <MapPin className="w-3 h-3 text-purple-500" />
                        <span className="truncate max-w-[140px]">{t.locationName || `${t.latitude}, ${t.longitude}`}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
