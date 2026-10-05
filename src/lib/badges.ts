/**
 * Travally Founding Member & Milestone Badge System
 * 
 * Rules:
 * - Members #1 to #100: Every single member gets an exclusive permanent founding badge!
 *   - #1: "Genesis Explorer #1" (Mythic Gold aura, royal crown, animated glow)
 *   - #2 to #10: "Top 10 Pioneer #N" (Cyan & Gold energy aura, electric pioneer emblem)
 *   - #11 to #100: "Century Pioneer #N" (Emerald & Platinum luster aura, pioneer chevron)
 * - Members > #100: ONLY milestone hundreds get an exclusive badge:
 *   - #200, #300, #400, #500, #600, #700, #800, #900: "Centurion #N" (Solar Amber crest)
 *   - #1000: "Millennium Explorer #1000" (Historic Millennium Nova crest)
 *   - Other members (e.g. 101, 142, 205) have normal member ranking without the exclusive milestone badge.
 */

type BadgeTier = "MEMBER";

export interface UserBadge {
  hasBadge: boolean;
  rank: number;
  title: string | null;
  tier: BadgeTier;
  badgeLabel: string;
  badgeIcon: string;
  icon?: string;
  frameStyle: string;
  ringClass: string;
  glowClass: string;
  pillGradient: string;
  textColor: string;
  borderColor: string;
  description: string;
  isMilestone: boolean;
}

export function getBadgeForRank(rank: number = 365): UserBadge {
  const safeRank = Math.max(365, Math.floor(rank));

  // No badges at all - every user is a standard verified member
  return {
    hasBadge: false,
    rank: safeRank,
    title: null,
    tier: "MEMBER",
    badgeLabel: `#${safeRank}`,
    badgeIcon: "🧭",
    frameStyle: "member",
    ringClass: "ring-1.5 ring-slate-300 dark:ring-emerald-800/60",
    glowClass: "from-slate-500/10 to-transparent",
    pillGradient: "bg-slate-200 dark:bg-emerald-950/80 text-slate-700 dark:text-emerald-300 font-bold",
    textColor: "text-slate-400",
    borderColor: "border-slate-300 dark:border-emerald-900/60",
    description: `Verified Member #${safeRank}`,
    isMilestone: false,
  };
}

export function parseRankFromMembership(membershipNumber?: string | null): number {
  if (!membershipNumber) return 365;
  const match = membershipNumber.match(/\d+/);
  if (match) {
    const num = parseInt(match[0], 10);
    return isNaN(num) || num < 365 ? 365 : num;
  }
  return 365;
}

