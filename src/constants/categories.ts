/**
 * ═══════════════════════════════════════════════════════════════
 *  TRAVALLY — Category Constants & Configuration
 *  Strictly aligned with the Green and Orange color scheme.
 * ═══════════════════════════════════════════════════════════════
 */

import {
  Film,
  Coffee,
  Footprints,
  BookOpen,
  Music,
  ShoppingBag,
  Building2,
  Sparkles,
} from "lucide-react";
import type { ActivityCategory } from "@/types";

export interface CategoryConfig {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeBg: string;
  tagText: string;
  border: string;
  defaultImage: string;
}

/**
 * Uniform assigned images per category — every user sees the same image
 * for the same category tag across the entire platform.
 */
const CATEGORY_IMAGES: Record<string, string> = {
  MOVIES: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=900&auto=format&fit=crop&q=80",
  FOOD_CAFES: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=900&auto=format&fit=crop&q=80",
  WALKING: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=900&auto=format&fit=crop&q=80",
  STUDYING: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=900&auto=format&fit=crop&q=80",
  EVENTS: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=900&auto=format&fit=crop&q=80",
  SHOPPING: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=900&auto=format&fit=crop&q=80",
  CITY_EXPLORATION: "https://images.unsplash.com/photo-1477959858617-67f30bc75b82?w=900&auto=format&fit=crop&q=80",
  OTHER: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=900&auto=format&fit=crop&q=80",
};

/**
 * Category configuration strictly using Green & Orange accents.
 */
export const CATEGORIES: Record<string, CategoryConfig> = {
  MOVIES: {
    label: "Movies & Cinema",
    icon: Film,
    badgeBg: "bg-emerald-600 text-white",
    tagText: "text-emerald-500 dark:text-emerald-400",
    border: "border-emerald-500/30",
    defaultImage: CATEGORY_IMAGES.MOVIES,
  },
  FOOD_CAFES: {
    label: "Street Food & Cafes",
    icon: Coffee,
    badgeBg: "bg-orange-500 text-white",
    tagText: "text-orange-500 dark:text-orange-400",
    border: "border-orange-500/30",
    defaultImage: CATEGORY_IMAGES.FOOD_CAFES,
  },
  WALKING: {
    label: "Turf Sports & Fitness",
    icon: Footprints,
    badgeBg: "bg-emerald-600 text-white",
    tagText: "text-emerald-500 dark:text-emerald-400",
    border: "border-emerald-500/30",
    defaultImage: CATEGORY_IMAGES.WALKING,
  },
  STUDYING: {
    label: "Tech & Networking",
    icon: BookOpen,
    badgeBg: "bg-emerald-700 text-white",
    tagText: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-600/30",
    defaultImage: CATEGORY_IMAGES.STUDYING,
  },
  EVENTS: {
    label: "Standup & Concerts",
    icon: Music,
    badgeBg: "bg-orange-600 text-white",
    tagText: "text-orange-500 dark:text-orange-400",
    border: "border-orange-500/30",
    defaultImage: CATEGORY_IMAGES.EVENTS,
  },
  SHOPPING: {
    label: "Shopping & Bazaars",
    icon: ShoppingBag,
    badgeBg: "bg-orange-500 text-white",
    tagText: "text-orange-500 dark:text-orange-400",
    border: "border-orange-500/30",
    defaultImage: CATEGORY_IMAGES.SHOPPING,
  },
  CITY_EXPLORATION: {
    label: "Long Drives & Getaways",
    icon: Building2,
    badgeBg: "bg-emerald-600 text-white",
    tagText: "text-emerald-500 dark:text-emerald-400",
    border: "border-emerald-500/30",
    defaultImage: CATEGORY_IMAGES.CITY_EXPLORATION,
  },
  OTHER: {
    label: "Other Hangouts",
    icon: Sparkles,
    badgeBg: "bg-emerald-800 text-white",
    tagText: "text-emerald-500 dark:text-emerald-400",
    border: "border-emerald-500/30",
    defaultImage: CATEGORY_IMAGES.OTHER,
  },
};

/** All valid category keys */
const CATEGORY_KEYS: ActivityCategory[] = [
  "MOVIES",
  "FOOD_CAFES",
  "WALKING",
  "STUDYING",
  "EVENTS",
  "SHOPPING",
  "CITY_EXPLORATION",
  "OTHER",
];

/** Travel style display labels */
const TRAVEL_STYLES: Record<string, string> = {
  BACKPACKING: "Backpacking",
  CULTURAL: "Cultural",
  SLOW_TRAVEL: "Slow Travel",
  ADVENTURE: "Adventure",
  LUXURY: "Luxury",
  ROAD_TRIP: "Road Trip",
  RELAXATION: "Relaxation",
};

/** Gender preference options */
const GENDER_PREFERENCES: Record<string, string> = {
  ANY: "Open to All",
  FEMALE_ONLY: "Women Only",
  MALE_ONLY: "Men Only",
};

/** App-wide configuration */
const APP_CONFIG = {
  name: "Travally",
  tagline: "Social Travel Companion & Activity Discovery",
  supportEmail: "support@travally.app",
  maxFileSize: 5 * 1024 * 1024, // 5MB
  defaultAvatar: "https://avatar.vercel.sh/user",
  paginationLimit: 20,
} as const;
