"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Clock3,
  XCircle,
  Flag,
  MoreHorizontal,
  MessageSquare,
  MenuSquare,
  Bookmark,
  ChevronRight,
  EyeOff,
  UserX
} from "lucide-react";
import { formatDate, isPastCutoff } from "@/lib/utils";
import { VerificationBadge } from "@/components/common/VerificationBadge";
import { JoinRequestModal } from "@/components/activities/JoinRequestModal";
import { ReportModal } from "@/components/common/ReportModal";
import { getActivityImage } from "@/lib/images";
import { CATEGORIES } from "@/constants/categories";
import type { Activity } from "@/types";

export interface ActivityCardProps {
  activity: Activity;
  currentUser?: any;
  onRefresh?: () => void;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({
  activity,
  currentUser,
  onRefresh,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const categoryKey = (activity.category || "").toUpperCase();
  const categoryCfg = CATEGORIES[categoryKey] || CATEGORIES.OTHER;
  const CategoryIcon = categoryCfg?.icon || CATEGORIES.OTHER.icon;
  const coverImage = getActivityImage(activity);

  const isPast = activity.startTime
    ? isPastCutoff(activity.date, activity.startTime, activity.cutoffHoursBeforeStart || 0)
    : false;
  const isOrganizer = currentUser?.id && activity.organizer?.id ? currentUser.id === activity.organizer.id : false;
  const userRequest = activity.requests && activity.requests.length > 0 ? activity.requests[0] : null;

  const maxParts = activity.maxParticipants || 1;
  const currentCount = activity.currentAcceptedCount || 0;
  const isFull = activity.status === "FULL" || currentCount >= maxParts;
  const isCancelled = activity.status === "CANCELLED";
  const spotsLeft = Math.max(0, maxParts - currentCount);
  const percentFilled = Math.min(100, Math.round((currentCount / maxParts) * 100));

  const hostName = activity.organizer?.profile?.displayName || activity.organizer?.email?.split("@")[0] || "Host";

  const handleCancelRequest = async () => {
    if (!userRequest) return;
    if (!confirm("Are you sure you want to cancel your join request?")) return;

    setIsCancelling(true);
    try {
      const res = await fetch(`/api/requests/${userRequest.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        if (onRefresh) onRefresh();
      } else {
        alert("Failed to cancel request");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleNotInterested = () => {
    setIsDismissed(true);
  };

  const handleBlockOrganizer = async () => {
    if (!confirm(`Are you sure you want to block ${hostName}? You will no longer see their posts or activities.`)) return;

    try {
      const res = await fetch("/api/safety/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockedId: activity.organizer?.id }),
      });
      if (res.ok) {
        setIsDismissed(true);
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (isDismissed) return null;

  return (
    <>
      <div className="group relative w-full rounded-3xl overflow-hidden bg-gradient-to-br from-[#f2faf8] to-[#e4f3f0] shadow-lg hover:shadow-xl transition-all duration-500 border border-white/60">
        
        {/* Background Image with Fades */}
        <div className="absolute top-0 right-0 w-full h-[55%] z-0" style={{ backgroundImage: `url(${coverImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
          {/* Fades to make the left text readable and bottom blend into the card bg */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#f2faf8] via-[#f2faf8]/80 to-transparent w-[80%]" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#e4f3f0]" />
        </div>

        {/* Top Floating Actions */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e0f5f0]/90 backdrop-blur-md border border-[#c4eee4]">
            <CategoryIcon className="w-3.5 h-3.5 text-[#0a524a]" />
            <span className="text-xs font-bold tracking-wide text-[#0a524a]">
              {categoryCfg.label}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {!isFull && !isCancelled && !isPast && (
              <div className="px-3 py-1 rounded-full bg-[#0eb9a2] shadow-[0_0_15px_rgba(14,185,162,0.5)] font-bold text-xs text-white">
                {spotsLeft} spots left
              </div>
            )}
            {isCancelled && (
              <div className="px-3 py-1 rounded-full bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)] font-bold text-xs text-white flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5" /> Cancelled
              </div>
            )}
            
            <div className="relative">
              <button 
                onClick={(e) => { e.preventDefault(); setMenuOpen(!menuOpen); }}
                className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-md border border-white shadow-sm flex items-center justify-center hover:bg-white transition-colors text-slate-700"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-40 rounded-2xl bg-white border border-slate-200 shadow-xl py-1 z-30 text-xs animate-in fade-in zoom-in-95">
                  <button
                    onClick={() => { setMenuOpen(false); handleNotInterested(); }}
                    className="w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                    <span>Not Interested</span>
                  </button>
                  {!isOrganizer && (
                    <button
                      onClick={() => { setMenuOpen(false); handleBlockOrganizer(); }}
                      className="w-full px-3 py-2 text-left text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      <span>Block Host</span>
                    </button>
                  )}
                  <button
                    onClick={() => { setMenuOpen(false); setIsReportOpen(true); }}
                    className="w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Flag className="w-3.5 h-3.5 text-rose-500" />
                    <span>Report Activity</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Container */}
        <div className="relative z-10 px-5 pt-20 pb-5 flex flex-col justify-end min-h-[480px]">
          
          {/* Header Info */}
          <div className="mb-3">
            <Link href={`/activities/${activity.id}`}>
              <h2 className="text-xl font-extrabold leading-tight text-slate-900 mb-3 max-w-[85%] hover:text-[#0eb9a2] transition-colors line-clamp-2">
                {activity.title}
              </h2>
            </Link>
            
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                HOST
              </span>
              <div className="flex items-center gap-1.5 ml-1">
                <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-white dark:border-emerald-800 shadow-sm flex items-center justify-center text-[9px] font-bold shrink-0">
                  {hostName.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-bold text-slate-900">
                  {hostName}
                </span>
                <VerificationBadge
                  status={activity.organizer?.profile?.verificationStatus || "UNVERIFIED"}
                  isVerified={activity.organizer?.profile?.isVerified}
                  hasLinkedin={!!activity.organizer?.profile?.linkedinUrl}
                  size="sm"
                />
              </div>
            </div>
            
            {activity.description && (
              <p className="text-xs text-slate-500 italic leading-relaxed max-w-[90%] line-clamp-2">
                &ldquo;{activity.description}&rdquo;
              </p>
            )}
          </div>

          {/* Stats Glass Panel */}
          <div className="w-full bg-white/70 backdrop-blur-xl border border-white rounded-[1.5rem] shadow-[0_4px_20px_rgb(0,0,0,0.05)] p-4 mb-4 grid grid-cols-3 divide-x divide-slate-200/60">
            
            {/* Col 1: Date & Time */}
            <div className="flex flex-col px-1">
              <div className="w-8 h-8 rounded-full bg-[#eefaf7] border border-[#d5f0e9] text-[#0eb9a2] flex items-center justify-center mb-2">
                <Calendar className="w-3.5 h-3.5" />
              </div>
              <p className="text-[10px] text-slate-500 mb-0.5">Date & Time</p>
              <p className="text-xs font-bold text-slate-900 leading-tight mb-0.5">{formatDate(activity.date)}</p>
              <p className="text-[10px] text-slate-500">{activity.startTime} ({activity.approxDurationHours}h)</p>
            </div>

            {/* Col 2: Location */}
            <div className="flex flex-col px-3">
              <div className="w-8 h-8 rounded-full bg-[#eefaf7] border border-[#d5f0e9] text-[#0eb9a2] flex items-center justify-center mb-2">
                <MapPin className="w-3.5 h-3.5" />
              </div>
              <p className="text-[10px] text-slate-500 mb-0.5">Location</p>
              <p className="text-xs font-bold text-slate-900 leading-tight line-clamp-2">{activity.locationName}</p>
            </div>

            {/* Col 3: Joined */}
            <div className="flex flex-col pl-3 pr-1">
              <div className="w-8 h-8 rounded-full bg-[#eefaf7] border border-[#d5f0e9] text-[#0eb9a2] flex items-center justify-center mb-2">
                <Users className="w-3.5 h-3.5" />
              </div>
              <p className="text-[10px] text-slate-500 mb-0.5">Joined</p>
              <p className="text-xs font-bold text-slate-900 leading-tight mb-1.5">{currentCount} of {maxParts} joined</p>
              
              <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden flex items-center relative mb-1">
                <div 
                  className="h-full bg-[#cbd5e1] rounded-full absolute left-0" 
                  style={{ width: `${percentFilled}%` }}
                />
                {spotsLeft > 0 && (
                  <span className="absolute right-0 -top-3.5 text-[9px] font-bold text-[#0eb9a2]">
                    {spotsLeft} left
                  </span>
                )}
              </div>
            </div>
            
          </div>


          {/* Actions */}
          <div className="flex items-center gap-2.5">
            <Link 
              href={`/activities/${activity.id}`}
              className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-white border border-slate-100 shadow-[0_2px_8px_rgb(0,0,0,0.04)] hover:bg-slate-50 transition-colors"
            >
              <MenuSquare className="w-4 h-4 mb-0.5 text-slate-700" />
              <span className="text-[9px] font-semibold text-slate-600">Details</span>
            </Link>

            <button 
              className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-white border border-slate-100 shadow-[0_2px_8px_rgb(0,0,0,0.04)] hover:bg-slate-50 transition-colors"
            >
              <Bookmark className="w-4 h-4 mb-0.5 text-slate-700" />
              <span className="text-[9px] font-semibold text-slate-600">Save</span>
            </button>

            {isOrganizer ? (
              <button disabled className="flex-1 h-12 rounded-[1.25rem] bg-slate-200 border border-slate-300 text-slate-500 font-bold text-sm flex items-center justify-center">
                Host / You
              </button>
            ) : userRequest ? (
              <Link
                href="/chats"
                className="flex-1 h-12 rounded-[1.25rem] bg-gradient-to-r from-emerald-100 via-teal-50 to-emerald-100 hover:from-emerald-200 hover:to-teal-100 text-emerald-950 border border-emerald-300/90 font-bold text-sm flex items-center justify-between px-4 transition-all shadow-xs"
              >
                <span>Chat with Group</span>
                <div className="w-6 h-6 rounded-full bg-emerald-200/80 text-emerald-800 flex items-center justify-center">
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            ) : isCancelled || isFull || isPast ? (
              <button disabled className="flex-1 h-12 rounded-[1.25rem] bg-slate-100 border border-slate-200 text-slate-400 font-bold text-sm flex items-center justify-center">
                {isCancelled ? 'Cancelled' : isFull ? 'Full' : 'Closed'}
              </button>
            ) : (
              <button
                onClick={() => {
                  if (!currentUser) {
                    window.location.href = "/login";
                    return;
                  }
                  setIsModalOpen(true);
                }}
                className="flex-1 h-12 rounded-[1.25rem] bg-gradient-to-r from-emerald-100 via-teal-50 to-emerald-100 hover:from-emerald-200 hover:to-teal-100 text-emerald-950 border border-emerald-300/90 font-bold text-sm flex items-center justify-between px-4 transition-all shadow-xs"
              >
                <span>Join Activity</span>
                <div className="w-6 h-6 rounded-full bg-emerald-200/80 text-emerald-800 flex items-center justify-center">
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </button>
            )}
          </div>

        </div>
      </div>

      <JoinRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        type="ACTIVITY"
        targetId={activity.id}
        title={activity.title}
        organizerName={hostName}
        onSuccess={() => {
          if (onRefresh) onRefresh();
        }}
      />

      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        targetType="ACTIVITY"
        targetId={activity.id}
        targetName={activity.title}
      />
    </>
  );
};

