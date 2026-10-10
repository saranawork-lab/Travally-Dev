"use client";

import React, { useState, useRef } from "react";
import {
  RotateCcw,
  CheckCircle,
  Copy,
  Lock,
  MapPin,
  Wifi,
  Fingerprint,
} from "lucide-react";
import { LogoMark } from "@/components/common/Logo";
import { AvatarBadge } from "@/components/common/AvatarBadge";
import { getBadgeForRank, parseRankFromMembership } from "@/lib/badges";

interface VirtualMembershipCardProps {
  displayName: string;
  avatarUrl?: string | null;
  membershipNumber: string;
  membershipTier?: string;
  membershipStatus?: string;
  memberSince?: string | Date;
  isVerified?: boolean;
  city?: string;
  interests?: string[];
  totalActivities?: number;
  totalTrips?: number;
}

export const VirtualMembershipCard: React.FC<VirtualMembershipCardProps> = ({
  displayName,
  avatarUrl,
  membershipNumber,
  membershipTier = "FOUNDING_EXPLORER",
  membershipStatus = "ACTIVE",
  memberSince,
  isVerified = true,
  city,
  interests = [],
  totalActivities = 0,
  totalTrips = 0,
}) => {
  const [copied, setCopied] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [isHovering, setIsHovering] = useState(false);

  // Format full date: e.g. "Sep 26, 2026"
  const formattedDate = memberSince
    ? new Date(memberSince).toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : new Date().toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

  const tierFormatted =
    membershipTier === "FOUNDING_EXPLORER"
      ? "FOUNDING EXPLORER"
      : membershipTier.replace(/_/g, " ").toUpperCase();

  const tierEmoji =
    membershipTier === "FOUNDING_EXPLORER"
      ? "🏔️"
      : membershipTier === "VOYAGER"
      ? "⛵"
      : membershipTier === "GLOBETROTTER"
      ? "🌍"
      : "🎖️";

  // Calculate membership duration
  const memberSinceDate = memberSince ? new Date(memberSince) : new Date();
  const daysSince = Math.max(0, Math.floor((Date.now() - memberSinceDate.getTime()) / (1000 * 60 * 60 * 24)));
  const memberDuration =
    daysSince < 30
      ? `${daysSince}d`
      : daysSince < 365
      ? `${Math.floor(daysSince / 30)}mo`
      : `${(daysSince / 365).toFixed(1)}yr`;

  const handleCopy = () => {
    navigator.clipboard.writeText(membershipNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const userRank = parseRankFromMembership(membershipNumber);
  const userBadge = getBadgeForRank(userRank);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  };

  // Initials for avatar
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="w-full max-w-md mx-auto space-y-3">
      {/* ── ANIMATED OUTER GLOW WRAPPER ── */}
      <div
        className="relative p-[2px] rounded-[26px] transition-all duration-500"
        style={{
          background: isHovering
            ? "linear-gradient(135deg, #f97316 0%, #10b981 40%, #f59e0b 70%, #059669 100%)"
            : "linear-gradient(135deg, rgba(249,115,22,0.4) 0%, rgba(16,185,129,0.4) 50%, rgba(245,158,11,0.3) 100%)",
        }}
      >
        {/* ── CARD WRAPPER WITH TILT & HOLOGRAPHIC FOIL ── */}
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          onClick={() => setIsFlipped(!isFlipped)}
          style={{
            perspective: "1200px",
          }}
          className="cursor-pointer group select-none"
        >
          <div
            className={`relative w-full aspect-[1.586/1] rounded-[24px] transition-transform duration-700 transform-gpu shadow-2xl ${
              isFlipped ? "[transform:rotateY(180deg)]" : ""
            } [transform-style:preserve-3d]`}
          >
            {/* ════════════════ FRONT OF CARD ════════════════ */}
            <div
              className="absolute inset-0 rounded-[24px] overflow-hidden [backface-visibility:hidden] border border-emerald-500/30 text-white transition-all duration-500"
              style={{
                background:
                  "linear-gradient(145deg, #040d08 0%, #071a11 20%, #0e2a1b 45%, #1a1508 75%, #0d0906 100%)",
                boxShadow: isHovering
                  ? "0 25px 60px -12px rgba(249,115,22,0.25), 0 20px 50px -10px rgba(16,185,129,0.3), inset 0 1px 0 rgba(255,255,255,0.06)"
                  : "0 20px 50px -10px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)",
              }}
            >
              {/* Dynamic Holographic Shimmer Sheen Layer */}
              <div
                className="absolute inset-0 pointer-events-none opacity-30 group-hover:opacity-70 transition-opacity duration-500"
                style={{
                  background: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(255,255,255,0.18) 0%, rgba(249,115,22,0.12) 25%, rgba(16,185,129,0.15) 45%, transparent 65%)`,
                }}
              />

              {/* Subtle Circuit Pattern Overlay */}
              <div
                className="absolute inset-0 pointer-events-none opacity-[0.03]"
                style={{
                  backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 14px, rgba(16,185,129,0.5) 14px, rgba(16,185,129,0.5) 15px),
                                    repeating-linear-gradient(90deg, transparent, transparent 14px, rgba(249,115,22,0.3) 14px, rgba(249,115,22,0.3) 15px)`,
                }}
              />

              {/* Glowing Accent Ambient Mesh Orbs */}
              <div className="absolute -top-16 -right-16 w-56 h-56 bg-gradient-to-bl from-orange-500/20 via-amber-400/10 to-transparent rounded-full blur-3xl pointer-events-none animate-pulse" />
              <div className="absolute -bottom-12 -left-12 w-52 h-52 bg-gradient-to-tr from-emerald-500/20 via-teal-400/10 to-transparent rounded-full blur-3xl pointer-events-none" />

              {/* Card Content */}
              <div className="relative z-10 h-full flex flex-col justify-between p-3.5 sm:p-5 md:p-6">
                {/* Top Bar: Travally Logo + NFC + Chip */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 sm:gap-2.5">
                    <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-emerald-500/25 via-slate-900/80 to-orange-500/15 p-1 border border-emerald-500/30 shadow-lg flex items-center justify-center backdrop-blur-md shrink-0">
                      <LogoMark size={20} animate={false} />
                    </div>
                    <div className="flex flex-col">
                      <span
                        className="text-xs sm:text-sm font-black tracking-[0.12em] sm:tracking-[0.15em] uppercase select-none"
                        style={{
                          backgroundImage:
                            "linear-gradient(to right, #f97316 0%, #f59e0b 40%, #10b981 100%)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                        }}
                      >
                        Travally
                      </span>
                      <span className="text-[7px] sm:text-[8px] font-semibold tracking-[0.2em] text-emerald-400/70 uppercase -mt-0.5">
                        Digital Identity Pass
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    {/* NFC / Contactless Indicator */}
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border border-white/10 flex items-center justify-center">
                      <Wifi className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400/60 rotate-90" />
                    </div>
                    {/* EMV Gold Chip */}
                    <div className="w-8 h-5.5 sm:w-9 sm:h-6 md:w-10 md:h-7 rounded-md bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 p-[1px] shadow-md overflow-hidden">
                      <div className="w-full h-full bg-[#3d2a09]/30 rounded-[3px] border border-amber-300/70 relative">
                        <div className="absolute inset-x-0 top-1/2 h-[0.5px] bg-amber-200/60 -translate-y-1/2" />
                        <div className="absolute inset-y-0 left-1/3 w-[0.5px] bg-amber-200/60" />
                        <div className="absolute inset-y-0 right-1/3 w-[0.5px] bg-amber-200/60" />
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full border border-amber-300/50" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Middle Section: Avatar with Badge Frame + Name + ID */}
                <div className="flex items-center gap-2.5 sm:gap-3.5 -mt-0.5">
                  {/* Avatar Circle with Exclusive Badge Frame */}
                  <div className="relative shrink-0">
                    <AvatarBadge
                      avatarUrl={avatarUrl}
                      displayName={displayName}
                      rank={userRank}
                      badge={userBadge}
                      size="lg"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-sm sm:text-base md:text-lg font-black tracking-wide text-white drop-shadow-md truncate">
                        {displayName}
                      </h3>
                      {userBadge.hasBadge && (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-wider ${userBadge.pillGradient} border border-white/20 shadow-xs shrink-0`}>
                          <span>{userBadge.badgeIcon}</span>
                          <span>{userBadge.badgeLabel}</span>
                        </span>
                      )}
                    </div>
                    {city && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin className="w-2.5 h-2.5 text-orange-400/80 shrink-0" />
                        <span className="text-[9px] sm:text-[10px] text-orange-300/80 font-medium truncate">
                          {city}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1 flex-wrap">
                      <span className="font-mono text-[10px] sm:text-xs tracking-[0.14em] sm:tracking-[0.18em] text-white/90 font-bold whitespace-nowrap">
                        {membershipNumber}
                      </span>
                      <span
                        className="text-[7px] sm:text-[8px] font-black px-1.5 py-[1px] rounded-full uppercase tracking-wider whitespace-nowrap"
                        style={{
                          background:
                            membershipStatus === "ACTIVE"
                              ? "linear-gradient(135deg, rgba(16,185,129,0.25), rgba(5,150,105,0.3))"
                              : "linear-gradient(135deg, rgba(239,68,68,0.25), rgba(185,28,28,0.3))",
                          color: membershipStatus === "ACTIVE" ? "#6ee7b7" : "#fca5a5",
                          border: `1px solid ${membershipStatus === "ACTIVE" ? "rgba(16,185,129,0.4)" : "rgba(239,68,68,0.4)"}`,
                        }}
                      >
                        {membershipStatus}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Stats Bar */}
                <div className="flex items-end justify-between pt-1.5 sm:pt-2 border-t border-white/[0.06] gap-1">
                  {/* Tier */}
                  <div className="space-y-0.5 min-w-0">
                    <span className="block text-[7px] sm:text-[8px] font-semibold uppercase tracking-[0.12em] text-emerald-400/60">
                      Tier
                    </span>
                    <span className="font-bold text-[9px] sm:text-[11px] tracking-tight sm:tracking-wide bg-gradient-to-r from-amber-300 via-orange-300 to-amber-200 bg-clip-text text-transparent flex items-center gap-1 truncate">
                      <span className="shrink-0">{tierEmoji}</span>
                      <span className="truncate">{tierFormatted}</span>
                    </span>
                  </div>

                  {/* Quick Stats */}
                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <div className="text-center">
                      <span className="block text-[7px] sm:text-[8px] font-semibold uppercase tracking-wider text-emerald-400/60">
                        Meetups
                      </span>
                      <span className="font-black text-[10px] sm:text-xs text-white/90">
                        {totalActivities}
                      </span>
                    </div>
                    <div className="w-px h-4 sm:h-5 bg-white/[0.08]" />
                    <div className="text-center">
                      <span className="block text-[7px] sm:text-[8px] font-semibold uppercase tracking-wider text-emerald-400/60">
                        Trips
                      </span>
                      <span className="font-black text-[10px] sm:text-xs text-white/90">
                        {totalTrips}
                      </span>
                    </div>
                    <div className="w-px h-4 sm:h-5 bg-white/[0.08]" />
                    <div className="text-center">
                      <span className="block text-[7px] sm:text-[8px] font-semibold uppercase tracking-wider text-emerald-400/60">
                        Since
                      </span>
                      <span className="font-bold text-[9px] sm:text-[10px] text-white/90 tracking-wide whitespace-nowrap">
                        {formattedDate}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ════════════════ BACK OF CARD ════════════════ */}
            <div
              className="absolute inset-0 rounded-[24px] overflow-hidden [backface-visibility:hidden] [transform:rotateY(180deg)] border border-emerald-500/30 text-white"
              style={{
                background:
                  "linear-gradient(145deg, #040d08 0%, #071a11 20%, #0e2a1b 45%, #1a1508 75%, #0d0906 100%)",
                boxShadow:
                  "0 20px 50px -10px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)",
              }}
            >
              <div className="h-full flex flex-col">
                {/* Magnetic Stripe */}
                <div className="h-9 bg-black/90 mt-4 flex items-center px-5 border-y border-white/[0.06]">
                  <span className="text-[8px] font-mono text-emerald-400/70 tracking-[0.15em] truncate">
                    TRAVALLY SECURE IDENTITY • AES-256 ENCRYPTED • E2EE
                  </span>
                </div>

                {/* Signature + CVV */}
                <div className="flex-1 flex flex-col justify-between p-3.5 sm:p-5 md:p-6">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="flex-1 bg-white/[0.95] rounded-lg py-1.5 sm:py-2.5 px-2.5 sm:px-3 text-slate-800 relative overflow-hidden">
                      <div
                        className="absolute inset-0 opacity-[0.06]"
                        style={{
                          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 3px, #000 3px, #000 3.5px)`,
                        }}
                      />
                      <span className="relative font-serif italic text-sm tracking-wider text-slate-700">
                        {displayName}
                      </span>
                    </div>
                    <div className="w-14 bg-slate-900/80 border border-white/15 rounded-lg p-1.5 text-center">
                      <span className="block text-[7px] text-slate-500 uppercase tracking-wider font-semibold">
                        CVV
                      </span>
                      <span className="font-mono text-xs font-black text-orange-400">
                        •••
                      </span>
                    </div>
                  </div>

                  {/* Permanent Founding Badge Banner on back */}
                  <div className="my-2 p-2 sm:p-2.5 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{userBadge.badgeIcon}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Permanent Rank</span>
                    </div>
                    <span className={`text-xs font-black ${userBadge.textColor}`}>
                      {userBadge.title || `Rank #${userRank}`}
                    </span>
                  </div>

                  {/* Interests Tags */}
                  {interests.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {interests.slice(0, 4).map((interest, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-500/10 text-emerald-300/80 border border-emerald-500/20"
                        >
                          {interest}
                        </span>
                      ))}
                      {interests.length > 4 && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-white/5 text-white/50 border border-white/10">
                          +{interests.length - 4} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Bottom Security */}
                  <div className="space-y-2 pt-3 border-t border-white/[0.06]">
                    {/* Barcode-like pattern */}
                    <div className="flex items-center justify-center gap-[2px] h-6 overflow-hidden opacity-50">
                      {Array.from({ length: 40 }, (_, i) => (
                        <div
                          key={i}
                          className="bg-white/80"
                          style={{
                            width: `${Math.random() > 0.5 ? 2 : 1}px`,
                            height: `${14 + Math.floor(Math.random() * 10)}px`,
                          }}
                        />
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-[8px] font-mono text-emerald-400/60">
                        <Fingerprint className="w-3 h-3" />
                        <span>BIOMETRIC READY</span>
                      </div>
                      <div className="flex items-center gap-1 text-[8px] font-mono text-emerald-400/60">
                        <Lock className="w-2.5 h-2.5" />
                        <span>TAP TO FLIP FRONT</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CARD CONTROLS ── */}
      <div className="flex items-center justify-between px-1 text-xs">
        <span className="text-slate-500 dark:text-slate-400 text-[11px] flex items-center gap-1.5">
          <RotateCcw className="w-3 h-3 text-orange-500/60" />
          <span className="text-slate-400 dark:text-slate-500">
            Tap card to flip
          </span>
        </span>

        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-semibold text-[11px] border border-emerald-200 dark:border-emerald-800/50 transition-all active:scale-95 hover:shadow-sm"
        >
          {copied ? (
            <>
              <CheckCircle className="w-3 h-3 text-emerald-600" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy ID</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
