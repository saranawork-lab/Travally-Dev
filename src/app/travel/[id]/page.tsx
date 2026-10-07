"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  Compass,
  MapPin,
  Users,
  Wallet,
  CheckCircle,
  Clock3,
  ArrowLeft,
  Plane,
  Home,
  Flag,
} from "lucide-react";
import { formatDate, safeJsonParse } from "@/lib/utils";
import { VerificationBadge } from "@/components/common/VerificationBadge";
import { CompatibilityBadge } from "@/components/travel/CompatibilityBadge";
import { JoinRequestModal } from "@/components/activities/JoinRequestModal";
import { ReportModal } from "@/components/common/ReportModal";
import { TRAVEL_STYLE_CONFIG } from "@/constants/categories";

export default function TravelPlanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [trip, setTrip] = useState<any>(null);
  const [userRequest, setUserRequest] = useState<any>(null);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [reopening, setReopening] = useState(false);

  const fetchTrip = async () => {
    try {
      const res = await fetch(`/api/travel/${id}`);
      if (res.ok) {
        const data = await res.json();
        setTrip(data.travelPlan);
        setUserRequest(data.userRequest);
        setIsOrganizer(data.isOrganizer);
        if (data.currentUser) setCurrentUser(data.currentUser);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchTrip();
  }, [id]);

  const handleCancelJoinRequest = async () => {
    if (!userRequest) return;
    if (!confirm("Are you sure you want to cancel your trip join request?")) return;
    setIsCancelling(true);
    try {
      const res = await fetch(`/api/requests/${userRequest.id}`, { method: "DELETE" });
      if (res.ok) {
        fetchTrip();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center text-xs text-slate-500 dark:text-slate-400">
        Loading travel plan details...
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Trip Not Found</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">This travel plan may have concluded or been cancelled.</p>
        <Link
          href="/discover?mode=travel"
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-bold text-orange-900 dark:text-orange-200 bg-gradient-to-r from-orange-100 via-amber-50 to-orange-100 dark:from-orange-950/80 dark:to-amber-950/70 hover:from-orange-200 hover:to-amber-100 border border-orange-300/80 dark:border-orange-800/60 shadow-xs transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Travel Mode
        </Link>
      </div>
    );
  }

  const isFull = trip.status === "FULL" || trip.currentAcceptedCount >= trip.groupSizeMax;
  const spotsLeft = Math.max(0, trip.groupSizeMax - trip.currentAcceptedCount);
  const attractionsList: string[] = safeJsonParse(trip.plannedAttractions, []);
  const interestsList: string[] = safeJsonParse(trip.interests, []);

  const handleReopenTrip = async () => {
    setReopening(true);
    try {
      const res = await fetch(`/api/travel/${id}/reopen`, { method: "POST" });
      if (res.ok) {
        fetchTrip();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setReopening(false);
    }
  };

  const isSpotOpenedPrompt =
    isOrganizer &&
    (trip?.status === "CLOSED" || trip?.status === "FULL") &&
    trip.currentAcceptedCount < trip.groupSizeMax;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 pb-24">
      <div>
        <Link
          href="/discover?mode=travel"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Travel Expeditions</span>
        </Link>
      </div>

      {/* Smart Reopening Flow Prompt for Trip Creator */}
      {isSpotOpenedPrompt && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm animate-fade-in">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
              <CheckCircle className="w-4 h-4" />
            </div>
            <div>
              <strong className="block text-xs font-bold text-amber-900 dark:text-amber-200">
                A spot has opened up! ({trip.currentAcceptedCount}/{trip.groupSizeMax} spots filled)
              </strong>
              <p className="text-[11px] text-amber-800 dark:text-amber-300">
                A confirmed traveler left this trip. Would you like to reopen this trip to the public feed and discovery views?
              </p>
            </div>
          </div>
          <button
            onClick={handleReopenTrip}
            disabled={reopening}
            className="px-4 py-2 rounded-xl text-xs font-bold text-orange-900 dark:text-orange-200 bg-gradient-to-r from-orange-100 via-amber-50 to-orange-100 dark:from-orange-950/80 dark:to-amber-950/70 hover:from-orange-200 hover:to-amber-100 border border-orange-300/80 dark:border-orange-800/60 shadow-xs transition active:scale-95 shrink-0 self-start sm:self-center"
          >
            {reopening ? "Reopening..." : "Reopen Trip to Public"}
          </button>
        </div>
      )}

      <div className="bg-white dark:bg-[#111815] rounded-3xl border border-slate-200/90 dark:border-emerald-950/70 p-6 sm:p-8 shadow-xl space-y-6">
        {/* Style & Compatibility */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {(() => {
            const styleCfg = TRAVEL_STYLE_CONFIG[trip.travelStyle];
            const StyleIcon = styleCfg?.icon || Compass;
            return (
              <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800/60 flex items-center gap-2 shadow-2xs">
                <StyleIcon className="w-4 h-4 shrink-0" />
                <span>{styleCfg?.label || trip.travelStyle.replace("_", " ")} Expedition</span>
              </span>
            );
          })()}

          <div className="flex items-center gap-2">
            {trip.compatibility && (
              <CompatibilityBadge compatibility={trip.compatibility} />
            )}
            <button
              onClick={() => setIsReportOpen(true)}
              className="p-1.5 text-slate-400 hover:text-rose-500 transition"
              title="Report this trip"
            >
              <Flag className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Destination */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {trip.destination}
        </h1>

        {/* Organizer Header */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-[#16201b] border border-slate-200/60 dark:border-emerald-950/60">
          <Link
            href={`/profile/${trip.organizer.id}`}
            className="flex items-center gap-3 hover:opacity-90 transition min-w-0"
          >
            <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-950/80 border border-orange-300 dark:border-orange-700/60 flex items-center justify-center font-black text-sm text-orange-800 dark:text-orange-300 ring-2 ring-orange-500/25 shrink-0 shadow-sm">
              {(trip.organizer.profile?.displayName || "T").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  {trip.organizer.profile?.displayName || "Trip Planner"}
                </span>
                <VerificationBadge
                  status={trip.organizer.profile?.verificationStatus || "UNVERIFIED"}
                  isVerified={trip.organizer.profile?.isVerified}
                  hasLinkedin={!!trip.organizer.profile?.linkedinUrl}
                  showLabel
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                Departing from {trip.departureCity} • Trip Host
              </p>
            </div>
          </Link>

          <Link
            href={`/profile/${trip.organizer.id}`}
            className="hidden sm:inline-flex text-xs font-semibold text-orange-600 dark:text-orange-400 hover:underline"
          >
            View Profile
          </Link>
        </div>

        {/* Structured Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-y border-slate-100 dark:border-emerald-950/60 text-xs">
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-[#16201b]">
            <Calendar className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900 dark:text-white block">Travel Dates</span>
              <span className="text-slate-600 dark:text-slate-300">
                {formatDate(trip.startDate)} to {formatDate(trip.endDate)}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-[#16201b]">
            <Wallet className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900 dark:text-white block">Estimated Budget</span>
              <span className="text-slate-600 dark:text-slate-300">
                {trip.budgetMin && trip.budgetMax
                  ? `${trip.currency === "INR" || trip.currency === "USD" || !trip.currency ? "₹" : trip.currency + " "}${trip.budgetMin.toLocaleString("en-IN")} – ₹${trip.budgetMax.toLocaleString("en-IN")} per traveler`
                  : "Flexible budget range"}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-[#16201b]">
            <Home className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900 dark:text-white block">Accommodation & Transport</span>
              <span className="text-slate-600 dark:text-slate-300 capitalize">
                {trip.accommodationPreference.toLowerCase()} • {trip.transportPreference.toLowerCase()}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-[#16201b]">
            <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900 dark:text-white block">Group Size & Spots</span>
              <span className="text-slate-600 dark:text-slate-300">
                {trip.currentAcceptedCount} of {trip.groupSizeMax} companions confirmed ({spotsLeft} spots available)
              </span>
            </div>
          </div>
        </div>

        {/* Planned Itinerary & Highlights */}
        {attractionsList.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Planned Attractions & Itinerary Highlights
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {attractionsList.map((attraction, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-[#16201b] border border-slate-200/60 dark:border-emerald-950/60 text-xs text-slate-700 dark:text-slate-200 font-medium"
                >
                  <MapPin className="w-4 h-4 text-orange-500 shrink-0" />
                  <span>{attraction}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Shared Interests */}
        {interestsList.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Trip Passions & Interests
            </h2>
            <div className="flex flex-wrap gap-2">
              {interestsList.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-[#16201b] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-emerald-950/60"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Confirmed Travel Companions */}
        {trip.participants && trip.participants.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Confirmed Travel Team ({trip.participants.length})
            </h2>
            <div className="flex items-center gap-3 flex-wrap">
              {trip.participants.map((p: any) => (
                <Link
                  key={p.id}
                  href={`/profile/${p.user.id}`}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-[#16201b] hover:bg-slate-200 dark:hover:bg-[#1c2822] transition text-xs"
                >
                  <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700/60 flex items-center justify-center text-[10px] font-bold text-emerald-800 dark:text-emerald-300 shrink-0">
                    {(p.user.profile?.displayName || "U").charAt(0).toUpperCase()}
                  </div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {p.user.profile?.displayName}
                  </span>
                  {p.role === "ORGANIZER" && (
                    <span className="text-[10px] text-orange-500 font-bold">(Host)</span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 dark:border-emerald-950/60">
          <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed max-w-sm">
            * Flights and hotel reservations remain external. Travally facilitates traveler matching and secure communication.
          </p>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {isOrganizer ? (
              <Link
                href="/requests"
                className="px-5 py-2.5 rounded-full text-xs font-bold text-orange-900 dark:text-orange-200 bg-gradient-to-r from-orange-100 via-amber-50 to-orange-100 dark:from-orange-950/80 dark:to-amber-950/70 hover:from-orange-200 hover:to-amber-100 border border-orange-300/80 dark:border-orange-800/60 shadow-xs transition"
              >
                Review Companion Requests
              </Link>
            ) : userRequest ? (
              userRequest.status === "PENDING" ? (
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800/60 flex items-center gap-1.5">
                    <Clock3 className="w-3.5 h-3.5" /> Request Pending Host Approval
                  </span>
                  <button
                    onClick={handleCancelJoinRequest}
                    disabled={isCancelling}
                    className="text-xs text-rose-600 hover:underline"
                  >
                    Cancel Request
                  </button>
                </div>
              ) : userRequest.status === "ACCEPTED" ? (
                <Link
                  href="/chats"
                  className="px-5 py-2.5 rounded-full text-xs font-bold text-emerald-900 dark:text-emerald-200 bg-gradient-to-r from-emerald-100 via-teal-50 to-emerald-100 dark:from-emerald-950/80 dark:to-teal-950/70 hover:from-emerald-200 hover:to-teal-100 border border-emerald-300/80 dark:border-emerald-800/60 shadow-xs transition flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                  <span>Enter Private Trip Chat</span>
                </Link>
              ) : (
                <span className="px-3 py-1.5 rounded-xl text-xs bg-slate-100 dark:bg-[#16201b] text-slate-500">
                  Request {userRequest.status}
                </span>
              )
            ) : isFull ? (
              <button
                disabled
                className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-[#16201b] text-slate-400 cursor-not-allowed"
              >
                Trip Full
              </button>
            ) : (
              <button
                onClick={() => {
                  if (!currentUser) router.push("/login");
                  else setIsModalOpen(true);
                }}
                className="w-full sm:w-auto px-6 py-2.5 rounded-full text-xs font-bold text-orange-900 dark:text-orange-200 bg-gradient-to-r from-orange-100 via-amber-50 to-orange-100 dark:from-orange-950/80 dark:to-amber-950/70 hover:from-orange-200 hover:to-amber-100 border border-orange-300/80 dark:border-orange-800/60 shadow-xs transition hover:scale-105 active:scale-95"
              >
                Request to Join Expedition
              </button>
            )}
          </div>
        </div>
      </div>

      <JoinRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        type="TRAVEL"
        targetId={trip.id}
        title={trip.destination}
        organizerName={trip.organizer.profile?.displayName || "Trip Host"}
        onSuccess={() => fetchTrip()}
      />

      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        targetType="TRAVEL"
        targetId={trip.id}
        targetName={trip.destination}
      />
    </div>
  );
}
