/**
 * ═══════════════════════════════════════════════════════════════
 *  TRAVALLY — Shared Type Definitions
 *  Single source of truth for TypeScript interfaces used
 *  across both frontend components and backend API routes.
 * ═══════════════════════════════════════════════════════════════
 */

// ── User & Profile ──────────────────────────────────────────────

interface SessionUser {
  id: string;
  email: string;
  role: string;
  displayName: string;
  avatarUrl: string | null;
  isVerified: boolean;
  verificationStatus: string;
  city: string | null;
}

interface UserProfile {
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  age?: number | null;
  gender?: string | null;
  city?: string | null;
  country?: string | null;
  interests?: string;
  preferredActivities?: string;
  isVerified?: boolean;
  verificationStatus?: string;
  linkedinUrl?: string | null;
  discoveryVisible?: boolean;
}

// ── Activity ────────────────────────────────────────────────────

interface ActivityOrganizer {
  id: string;
  email: string;
  profile?: UserProfile | null;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  category: string;
  date: string | Date;
  startTime: string;
  approxDurationHours: number;
  locationName: string;
  meetingPointVenue?: string | null;
  maxParticipants: number;
  currentAcceptedCount: number;
  genderPreference?: string;
  cutoffHoursBeforeStart: number;
  status: string;
  imageUrl?: string | null;
  videoUrl?: string | null;
  organizer: ActivityOrganizer;
  requests?: JoinRequestSummary[];
  conversations?: { id: string }[];
}

// ── Travel Plan ─────────────────────────────────────────────────

interface TravelPlan {
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
  accommodationPreference: string;
  transportPreference: string;
  groupSizeMax: number;
  currentAcceptedCount: number;
  status: string;
  imageUrl?: string | null;
  organizer: ActivityOrganizer;
  requests?: JoinRequestSummary[];
  compatibility?: CompatibilityResult;
}

// ── Join Request ────────────────────────────────────────────────

interface JoinRequestSummary {
  id: string;
  status: string;
}

interface JoinRequestFull extends JoinRequestSummary {
  type: string;
  introMessage?: string | null;
  createdAt: string | Date;
  respondedAt?: string | Date | null;
  applicant: {
    id: string;
    email: string;
    profile?: UserProfile | null;
  };
  activity?: Pick<Activity, "id" | "title" | "category" | "date"> | null;
  travelPlan?: Pick<TravelPlan, "id" | "destination" | "startDate"> | null;
}

// ── Compatibility Scoring ───────────────────────────────────────

interface TravelCompatibilityFactor {
  name: string;
  weight: number;
  score: number;
  detail: string;
}

interface CompatibilityResult {
  overallScore: number;
  matchLevel: "High" | "Good" | "Moderate" | "Exploratory";
  badgeColor: string;
  summaryExplanation: string;
  factors: TravelCompatibilityFactor[];
}

interface UserTravelProfile {
  destinationPreferences?: string[];
  departureCity?: string;
  travelDates?: { start: Date; end: Date };
  preferredTravelStyles?: string[];
  interests?: string[];
  budgetRange?: { min: number; max: number };
}

interface TripTarget {
  destination: string;
  departureCity: string;
  startDate: Date | string;
  endDate: Date | string;
  travelStyle: string;
  interests: string;
  budgetMin?: number | null;
  budgetMax?: number | null;
}

// ── Chat & Messaging ───────────────────────────────────────────

interface Conversation {
  id: string;
  type: string;
  title: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  messages?: ChatMessage[];
}

interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  createdAt: string | Date;
  sender: {
    id: string;
    profile?: Pick<UserProfile, "displayName" | "avatarUrl"> | null;
  };
}

// ── Notification ────────────────────────────────────────────────

interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  actionUrl?: string | null;
  isRead: boolean;
  createdAt: string | Date;
}

// ── Safety ──────────────────────────────────────────────────────

interface BlockRecord {
  id: string;
  blockerId: string;
  blockedId: string;
  type: "BLOCK" | "RESTRICT";
  createdAt: string | Date;
}

interface Report {
  id: string;
  reporterId: string;
  targetType: "USER" | "ACTIVITY" | "TRAVEL";
  targetId: string;
  reason: string;
  details?: string | null;
  status: "PENDING" | "RESOLVED" | "DISMISSED";
}

// ── Enums (string union types) ──────────────────────────────────

export type ActivityCategory =
  | "MOVIES"
  | "FOOD_CAFES"
  | "WALKING"
  | "STUDYING"
  | "EVENTS"
  | "SHOPPING"
  | "CITY_EXPLORATION"
  | "OTHER";

type TravelStyle =
  | "BACKPACKING"
  | "CULTURAL"
  | "SLOW_TRAVEL"
  | "ADVENTURE"
  | "LUXURY"
  | "ROAD_TRIP"
  | "RELAXATION";

type RequestStatus =
  | "PENDING"
  | "ACCEPTED"
  | "DECLINED"
  | "CANCELLED"
  | "EXPIRED";

type ActivityStatus = "OPEN" | "FULL" | "CANCELLED" | "EXPIRED";

type UserRole = "USER" | "ADMIN";
