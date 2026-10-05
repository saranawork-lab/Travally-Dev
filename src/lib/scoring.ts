import { safeJsonParse } from "./utils";

interface TravelCompatibilityFactor {
  name: string;
  weight: number; // e.g. 0.35
  score: number;  // 0 to 100
  detail: string;
}

export interface CompatibilityResult {
  overallScore: number; // 0 to 100
  matchLevel: "High" | "Good" | "Moderate" | "Exploratory";
  badgeColor: string;
  summaryExplanation: string;
  factors: TravelCompatibilityFactor[];
}

export interface UserTravelProfile {
  destinationPreferences?: string[];
  departureCity?: string;
  travelDates?: { start: Date; end: Date };
  preferredTravelStyles?: string[];
  interests?: string[];
  budgetRange?: { min: number; max: number };
}

export interface TripTarget {
  destination: string;
  departureCity: string;
  startDate: Date | string;
  endDate: Date | string;
  travelStyle: string;
  interests: string; // JSON string
  budgetMin?: number | null;
  budgetMax?: number | null;
}

/**
 * Computes a deterministic, transparent compatibility score between a user and a travel trip.
 * Weights:
 * - Destination / Region compatibility: 35%
 * - Date Overlap / Schedule alignment: 25%
 * - Travel Style Compatibility: 20%
 * - Shared Interests & Activities: 15%
 * - Budget Range Alignment: 5%
 */
export function calculateTravelCompatibility(
  userProfile: UserTravelProfile,
  trip: TripTarget
): CompatibilityResult {
  const tripInterests: string[] = safeJsonParse(trip.interests, []);
  const tripStart = new Date(trip.startDate);
  const tripEnd = new Date(trip.endDate);

  // 1. Destination Match (Weight: 35%)
  let destScore = 60; // base exploratory score
  let destDetail = "Different destination or general region";
  const userDestinations = userProfile.destinationPreferences || [];
  const normalizedTripDest = trip.destination.toLowerCase();

  const exactDestMatch = userDestinations.some(d =>
    normalizedTripDest.includes(d.toLowerCase()) || d.toLowerCase().includes(normalizedTripDest)
  );

  if (exactDestMatch || userDestinations.length === 0) {
    destScore = exactDestMatch ? 100 : 75;
    destDetail = exactDestMatch
      ? `Exact destination match for "${trip.destination}"`
      : "Open destination preference allows exploration";
  }

  // 2. Date Overlap (Weight: 25%)
  let dateScore = 50;
  let dateDetail = "Different travel window";

  if (userProfile.travelDates) {
    const userStart = new Date(userProfile.travelDates.start);
    const userEnd = new Date(userProfile.travelDates.end);

    const overlapStart = new Date(Math.max(userStart.getTime(), tripStart.getTime()));
    const overlapEnd = new Date(Math.min(userEnd.getTime(), tripEnd.getTime()));

    if (overlapStart <= overlapEnd) {
      const overlapDays = Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const tripDays = Math.ceil((tripEnd.getTime() - tripStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const ratio = Math.min(1, overlapDays / tripDays);
      dateScore = Math.round(60 + ratio * 40);
      dateDetail = `${overlapDays} overlapping days with your travel window`;
    } else {
      dateScore = 40;
      dateDetail = "Flexible travel dates can be coordinated";
    }
  } else {
    dateScore = 80;
    dateDetail = "Upcoming trip with active companion search";
  }

  // 3. Travel Style Match (Weight: 20%)
  let styleScore = 50;
  let styleDetail = `${trip.travelStyle} style trip`;
  const userStyles = userProfile.preferredTravelStyles || [];

  if (userStyles.length > 0) {
    const matchedStyle = userStyles.some(s => s.toUpperCase() === trip.travelStyle.toUpperCase());
    if (matchedStyle) {
      styleScore = 100;
      styleDetail = `Aligned on ${trip.travelStyle.toLowerCase()} travel style`;
    } else {
      styleScore = 55;
      styleDetail = `Complementary travel style (${trip.travelStyle.toLowerCase()})`;
    }
  } else {
    styleScore = 75;
    styleDetail = `Standard ${trip.travelStyle.toLowerCase()} travel style`;
  }

  // 4. Shared Interests (Weight: 15%)
  const userInterests = userProfile.interests || [];
  const commonInterests = userInterests.filter(i =>
    tripInterests.some(ti => ti.toLowerCase() === i.toLowerCase())
  );
  let interestScore = 50;
  let interestDetail = "Diverse travel activities planned";

  if (commonInterests.length > 0) {
    interestScore = Math.min(100, 60 + commonInterests.length * 20);
    interestDetail = `Shared passions: ${commonInterests.slice(0, 3).join(", ")}`;
  } else if (userInterests.length === 0) {
    interestScore = 70;
    interestDetail = `${tripInterests.slice(0, 2).join(", ")} featured in trip`;
  }

  // 5. Budget Alignment (Weight: 5%)
  let budgetScore = 70;
  let budgetDetail = "Budget ranges are within reasonable parity";
  if (userProfile.budgetRange && trip.budgetMin && trip.budgetMax) {
    const overlaps =
      userProfile.budgetRange.min <= trip.budgetMax &&
      userProfile.budgetRange.max >= trip.budgetMin;
    budgetScore = overlaps ? 100 : 50;
    budgetDetail = overlaps ? "Matching budget expectations" : "Varying budget range";
  }

  const factors: TravelCompatibilityFactor[] = [
    { name: "Destination & Region", weight: 0.35, score: destScore, detail: destDetail },
    { name: "Date Alignment", weight: 0.25, score: dateScore, detail: dateDetail },
    { name: "Travel Style", weight: 0.20, score: styleScore, detail: styleDetail },
    { name: "Shared Interests", weight: 0.15, score: interestScore, detail: interestDetail },
    { name: "Budget Range", weight: 0.05, score: budgetScore, detail: budgetDetail },
  ];

  const overall = Math.round(
    factors.reduce((sum, f) => sum + f.score * f.weight, 0)
  );

  let matchLevel: "High" | "Good" | "Moderate" | "Exploratory" = "Good";
  let badgeColor = "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30";
  if (overall >= 85) {
    matchLevel = "High";
    badgeColor = "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30";
  } else if (overall >= 70) {
    matchLevel = "Good";
    badgeColor = "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30";
  } else if (overall >= 55) {
    matchLevel = "Moderate";
    badgeColor = "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30";
  } else {
    matchLevel = "Exploratory";
    badgeColor = "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30";
  }

  const topFactor = [...factors].sort((a, b) => b.score - a.score)[0];
  const summaryExplanation = `${matchLevel} Compatibility (${overall}%): ${topFactor.detail}.`;

  return {
    overallScore: overall,
    matchLevel,
    badgeColor,
    summaryExplanation,
    factors,
  };
}
