"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Compass,
  MapPin,
  Users,
  Wallet,
  Clock3,
  ArrowRight,
  Flag,
  MoreHorizontal,
  ChevronRight,
  Plane,
  Train,
  Car,
  Home,
  ShieldCheck,
} from "lucide-react";
import { formatDate, formatShortDate, safeJsonParse } from "@/lib/utils";
import { VerificationBadge } from "@/components/common/VerificationBadge";
import { CompatibilityBadge } from "@/components/travel/CompatibilityBadge";
import { JoinRequestModal } from "@/components/activities/JoinRequestModal";
import { ReportModal } from "@/components/common/ReportModal";
import { ProfileModal } from "@/components/profile/ProfileModal";
import { CompatibilityResult } from "@/lib/scoring";
import { getTripImage } from "@/lib/images";

export interface TripCardProps {
  trip: {
    id: string;
    destination: string;
    departureCity: string;
    startDate: string | Date;
    endDate: string | Date;
    budgetMin?: number | null;
    budgetMax?: number | null;
    currency: string;
    travelStyle: string;
    interests: string;
    plannedAttractions?: string | null;
    description?: string | null;
    accommodationPreference: string;
    transportPreference: string;
    groupSizeMax: number;
    currentAcceptedCount: number;
    status: string;
    imageUrl?: string | null;
    organizer: {
      id: string;
      email: string;
      profile?: {
        displayName: string;
        avatarUrl?: string | null;
        isVerified?: boolean;
        verificationStatus?: string;
        city?: string | null;
        linkedinUrl?: string | null;
      } | null;
    };
    requests?: { id: string; status: string }[];
    compatibility?: CompatibilityResult;
  };
  currentUser?: any;
  onRefresh?: () => void;
}

export const TripCard: React.FC<TripCardProps> = ({
  trip,
  currentUser,
  onRefresh,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const isOrganizer =
    currentUser?.id && trip.organizer?.id ? currentUser.id === trip.organizer.id : false;
  const userRequest =
    trip.requests && trip.requests.length > 0 ? trip.requests[0] : null;
  const isAccepted = userRequest?.status === "ACCEPTED";
  const isPending = userRequest?.status === "PENDING";

  const maxGroup = trip.groupSizeMax || 1;
  const currentAccepted = trip.currentAcceptedCount || 0;
  const isFull = trip.status === "FULL" || currentAccepted >= maxGroup;
  const spotsLeft = Math.max(0, maxGroup - currentAccepted);
  const percentFilled = Math.min(100, Math.round((currentAccepted / maxGroup) * 100));

  const start = trip.startDate ? new Date(trip.startDate) : new Date();
  const end = trip.endDate ? new Date(trip.endDate) : new Date();
  const durationDays = Math.max(
    1,
    Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  );

  const coverImage = getTripImage(trip);
  const hostName =
    trip.organizer?.profile?.displayName || trip.organizer?.email?.split("@")[0] || "Host";

  const travelStyleLabel = (trip.travelStyle || "EXPEDITION").replace(/_/g, " ");
  const attractions: string[] = safeJsonParse(trip.plannedAttractions || "[]", []);

  return (
    <>
      <div className="group relative w-full bg-white dark:bg-[#111815] rounded-3xl border border-slate-200/90 dark:border-emerald-950/70 shadow-sm hover:shadow-2xl hover:border-orange-400/50 dark:hover:border-orange-500/40 transition-all duration-300 flex flex-col justify-between overflow-hidden">
        {/* ── TOP THUMBNAIL BANNER ── */}
        <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-slate-100 dark:bg-[#16201b]">
          <img
            src={coverImage}
            alt={trip.destination}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {/* Subtle gradient for badge legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent pointer-events-none" />

          {/* Floating Badges on Top */}
          <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between z-10">
            {/* Travel Style Badge */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-gradient-to-r from-orange-100 via-amber-50 to-orange-100 text-orange-950 border border-orange-300/80 shadow-xs tracking-wide uppercase">
              <Compass className="w-3.5 h-3.5 text-orange-700" />
              <span>{travelStyleLabel}</span>
            </span>

            <div className="flex items-center gap-2">
              {/* Spots Left Pill */}
              <span
                className={`px-3 py-1 rounded-full text-[11px] font-bold backdrop-blur-md shadow-xs ${
                  isFull
                    ? "bg-slate-100/90 text-slate-600 border border-slate-300"
                    : spotsLeft <= 1
                    ? "bg-rose-100 text-rose-900 border border-rose-300"
                    : "bg-gradient-to-r from-emerald-100 via-teal-50 to-emerald-100 text-emerald-950 border border-emerald-300/80"
                }`}
              >
                {isFull ? "Trip Full" : `${spotsLeft} spot${spotsLeft > 1 ? "s" : ""} left`}
              </span>

              {/* Action Menu (Report) */}
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setMenuOpen(!menuOpen);
                  }}
                  className="w-8 h-8 rounded-full bg-black/50 hover:bg-black/75 text-white backdrop-blur-md flex items-center justify-center transition border border-white/20"
                  aria-label="Trip actions"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-40 rounded-2xl bg-white dark:bg-[#131c18] border border-slate-200 dark:border-emerald-950/80 shadow-2xl py-1 z-30 text-xs animate-slide-up">
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        setIsReportOpen(true);
                      }}
                      className="w-full px-3.5 py-2 text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2 font-medium"
                    >
                      <Flag className="w-3.5 h-3.5" />
                      <span>Report Trip</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Departure Pill at bottom of image */}
          <div className="absolute bottom-2.5 left-3.5 z-10 flex items-center gap-1.5 text-[11px] font-medium text-white drop-shadow-md">
            <MapPin className="w-3.5 h-3.5 text-orange-400" />
            <span>From: {trip.departureCity || "Flexible"}</span>
          </div>
        </div>

        {/* ── CARD CONTENT BODY (Structured Cards View) ── */}
        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            {/* Header: Destination & Score */}
            <div>
              <div className="flex items-start justify-between gap-2">
                <Link href={`/travel/${trip.id}`} className="group-hover:text-orange-600 dark:group-hover:text-orange-400 transition">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-1 tracking-tight">
                    {trip.destination}
                  </h2>
                </Link>

                {trip.compatibility && (
                  <div className="shrink-0">
                    <CompatibilityBadge compatibility={trip.compatibility} />
                  </div>
                )}
              </div>

              {/* Host row */}
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  setIsProfileModalOpen(true);
                }}
                className="flex items-center gap-2 mt-2 text-left transition hover:opacity-80"
              >
                <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 ring-1 ring-emerald-500/40 flex items-center justify-center text-[10px] font-bold shrink-0">
                  {hostName.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {hostName}
                </span>
                <VerificationBadge
                  status={trip.organizer?.profile?.verificationStatus || "UNVERIFIED"}
                  isVerified={trip.organizer?.profile?.isVerified}
                  hasLinkedin={!!trip.organizer?.profile?.linkedinUrl}
                  size="sm"
                />
              </button>
            </div>

            {/* Description (Readable typography) */}
            {trip.description && (
              <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                {trip.description}
              </p>
            )}

            {/* Key Trip Info Grid */}
            <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
              {/* Dates & Duration */}
              <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-[#16201b] border border-slate-200/80 dark:border-emerald-950/60">
                <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1">
                  <Calendar className="w-3 h-3 text-orange-500" />
                  <span>Travel Dates</span>
                </div>
                <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                  {formatShortDate(trip.startDate)} - {formatShortDate(trip.endDate)}
                </div>
                <div className="text-[11px] text-orange-600 dark:text-orange-400 font-medium">
                  {durationDays} Days Duration
                </div>
              </div>

              {/* Budget Range */}
              <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-[#16201b] border border-slate-200/80 dark:border-emerald-950/60">
                <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1">
                  <Wallet className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>Budget</span>
                </div>
                <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs truncate">
                  {trip.budgetMin && trip.budgetMax
                    ? `${trip.currency === "INR" || trip.currency === "USD" || !trip.currency ? "₹" : trip.currency + " "}${trip.budgetMin.toLocaleString("en-IN")} - ₹${trip.budgetMax.toLocaleString("en-IN")}`
                    : "Flexible Budget"}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Est. per traveler
                </div>
              </div>
            </div>

            {/* Group Capacity Progress Bar */}
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-[11px] font-medium text-slate-600 dark:text-slate-300">
                <span>
                  Group Capacity: <strong className="text-slate-900 dark:text-white">{currentAccepted}</strong> of{" "}
                  <strong>{maxGroup}</strong> joined
                </span>
                <span className={spotsLeft === 0 ? "text-rose-500 font-bold" : "text-emerald-600 dark:text-emerald-400 font-bold"}>
                  {spotsLeft > 0 ? `${spotsLeft} open` : "Full"}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-[#1c2822] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-orange-500 to-orange-600 transition-all duration-300"
                  style={{ width: `${percentFilled}%` }}
                />
              </div>
            </div>

            {/* Planned Attractions Chips */}
            {attractions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {attractions.slice(0, 3).map((item, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-[#18241f] text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-emerald-950/60"
                  >
                    {item}
                  </span>
                ))}
                {attractions.length > 3 && (
                  <span className="text-[10px] text-slate-400 font-medium self-center">
                    +{attractions.length - 3} more
                  </span>
                )}
              </div>
            )}
          </div>

          {/* ── CARD FOOTER / ACTION BAR ── */}
          <div className="pt-3 border-t border-slate-100 dark:border-emerald-950/60 flex items-center gap-2">
            <Link
              href={`/travel/${trip.id}`}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-emerald-900/60 hover:bg-slate-100 dark:hover:bg-[#18241f] text-slate-700 dark:text-slate-200 font-semibold text-xs transition"
            >
              Details
            </Link>

            {isOrganizer ? (
              <span className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-[#18241f] text-slate-500 dark:text-slate-400 text-xs font-bold text-center border border-slate-200/70 dark:border-emerald-950">
                You are Host
              </span>
            ) : isAccepted ? (
              <Link
                href="/chats"
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/25 transition"
              >
                <span>Chat with Group</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            ) : isPending ? (
              <span className="flex-1 py-2.5 rounded-xl bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 text-xs font-bold text-center border border-orange-200 dark:border-orange-800/50">
                Request Pending
              </span>
            ) : isFull ? (
              <button
                disabled
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-[#18241f] text-slate-400 font-bold text-xs"
              >
                Trip Full
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (!currentUser) {
                    window.location.href = "/login";
                    return;
                  }
                  setIsModalOpen(true);
                }}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-orange-100 via-amber-50 to-orange-100 dark:from-orange-950/80 dark:to-amber-950/70 hover:from-orange-200 hover:to-amber-100 text-orange-950 dark:text-orange-200 border border-orange-300/90 dark:border-orange-700 text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all hover:scale-[1.01]"
              >
                <span>Join Expedition</span>
                <ArrowRight className="w-3.5 h-3.5 text-orange-700 dark:text-orange-300" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Join Request Modal */}
      <JoinRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        type="TRAVEL"
        targetId={trip.id}
        title={trip.destination}
        organizerName={hostName}
        onSuccess={() => {
          if (onRefresh) onRefresh();
        }}
      />

      {/* Report Modal */}
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        targetType="TRAVEL"
        targetId={trip.id}
        targetName={trip.destination}
      />

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={trip.organizer}
      />
    </>
  );
};

