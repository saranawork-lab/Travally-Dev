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
  Compass,
  Beer,
} from "lucide-react";
import type { ActivityCategory } from "@/types";
import { CustomCategoryIcon } from "@/components/common/CustomCategoryIcon";

export const IconMovies = (props: any) => <CustomCategoryIcon src="/category-icons/movies.png" alt="Movies & Cinema" {...props} />;
export const IconFood = (props: any) => <CustomCategoryIcon src="/category-icons/food.png" alt="Street Food & Cafes" {...props} />;
export const IconSports = (props: any) => <CustomCategoryIcon src="/category-icons/sports.png" alt="Turf Sports & Fitness" {...props} />;
export const IconTech = (props: any) => <CustomCategoryIcon src="/category-icons/tech.png" alt="Tech & Networking" {...props} />;
export const IconPubs = (props: any) => <CustomCategoryIcon src="/category-icons/pubs.png" alt="Nightlife & Pubs" {...props} />;
export const IconShopping = (props: any) => <CustomCategoryIcon src="/category-icons/shopping.png" alt="Shopping & Bazaars" {...props} />;
export const IconDrives = (props: any) => <CustomCategoryIcon src="/category-icons/drives.png" alt="Long Drives & Getaways" {...props} />;
export const IconHangouts = (props: any) => <CustomCategoryIcon src="/category-icons/hangouts.png" alt="Other Hangouts" {...props} />;

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
    icon: IconMovies,
    badgeBg: "bg-emerald-600 text-white",
    tagText: "text-emerald-500 dark:text-emerald-400",
    border: "border-emerald-500/30",
    defaultImage: CATEGORY_IMAGES.MOVIES,
  },
  FOOD_CAFES: {
    label: "Street Food & Cafes",
    icon: IconFood,
    badgeBg: "bg-orange-500 text-white",
    tagText: "text-orange-500 dark:text-orange-400",
    border: "border-orange-500/30",
    defaultImage: CATEGORY_IMAGES.FOOD_CAFES,
  },
  WALKING: {
    label: "Turf Sports & Fitness",
    icon: IconSports,
    badgeBg: "bg-emerald-600 text-white",
    tagText: "text-emerald-500 dark:text-emerald-400",
    border: "border-emerald-500/30",
    defaultImage: CATEGORY_IMAGES.WALKING,
  },
  STUDYING: {
    label: "Tech & Networking",
    icon: IconTech,
    badgeBg: "bg-emerald-700 text-white",
    tagText: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-600/30",
    defaultImage: CATEGORY_IMAGES.STUDYING,
  },
  EVENTS: {
    label: "Nightlife & Pubs",
    icon: IconPubs,
    badgeBg: "bg-orange-600 text-white",
    tagText: "text-orange-500 dark:text-orange-400",
    border: "border-orange-500/30",
    defaultImage: CATEGORY_IMAGES.EVENTS,
  },
  SHOPPING: {
    label: "Shopping & Bazaars",
    icon: IconShopping,
    badgeBg: "bg-orange-500 text-white",
    tagText: "text-orange-500 dark:text-orange-400",
    border: "border-orange-500/30",
    defaultImage: CATEGORY_IMAGES.SHOPPING,
  },
  CITY_EXPLORATION: {
    label: "Long Drives & Getaways",
    icon: IconDrives,
    badgeBg: "bg-emerald-600 text-white",
    tagText: "text-emerald-500 dark:text-emerald-400",
    border: "border-emerald-500/30",
    defaultImage: CATEGORY_IMAGES.CITY_EXPLORATION,
  },
  OTHER: {
    label: "Other Hangouts",
    icon: IconHangouts,
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

export const IconCultural = (props: any) => <CustomCategoryIcon src="/travel-icons/cultural.png" alt="Cultural & Heritage" {...props} />;
export const IconSlowTravel = (props: any) => <CustomCategoryIcon src="/travel-icons/slow_travel.png" alt="Slow Travel" {...props} />;
export const IconBackpacking = (props: any) => <CustomCategoryIcon src="/travel-icons/backpacking.png" alt="Backpacking & Hostels" {...props} />;
export const IconAdventure = (props: any) => <CustomCategoryIcon src="/travel-icons/adventure.png" alt="Adventure & Hiking" {...props} />;
export const IconRoadTrip = (props: any) => <CustomCategoryIcon src="/travel-icons/road_trip.png" alt="Scenic Road Trip" {...props} />;
export const IconLuxury = (props: any) => <CustomCategoryIcon src="/travel-icons/luxury.png" alt="Boutique & Luxury" {...props} />;
export const IconRelaxation = (props: any) => <CustomCategoryIcon src="/travel-icons/relaxation.png" alt="Relaxation & Wellness" {...props} />;

export interface TravelStyleConfig {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeBg: string;
  tagText: string;
  border: string;
  desc: string;
}

export const TRAVEL_STYLE_CONFIG: Record<string, TravelStyleConfig> = {
  CULTURAL: {
    label: "Cultural & Heritage",
    icon: IconCultural,
    badgeBg: "bg-orange-600 text-white",
    tagText: "text-orange-600 dark:text-orange-400",
    border: "border-orange-500/30",
    desc: "Historic districts, architecture, museums, culinary heritage",
  },
  SLOW_TRAVEL: {
    label: "Slow Travel",
    icon: IconSlowTravel,
    badgeBg: "bg-emerald-600 text-white",
    tagText: "text-emerald-500 dark:text-emerald-400",
    border: "border-emerald-500/30",
    desc: "Neighborhood living, unhurried exploration, local immersion",
  },
  BACKPACKING: {
    label: "Backpacking & Hostels",
    icon: IconBackpacking,
    badgeBg: "bg-orange-500 text-white",
    tagText: "text-orange-500 dark:text-orange-400",
    border: "border-orange-500/30",
    desc: "Hostels, flexible transit, budget-conscious exploration",
  },
  ADVENTURE: {
    label: "Adventure & Hiking",
    icon: IconAdventure,
    badgeBg: "bg-emerald-600 text-white",
    tagText: "text-emerald-500 dark:text-emerald-400",
    border: "border-emerald-500/30",
    desc: "Mountain trails, outdoor trekking, coastal walks",
  },
  ROAD_TRIP: {
    label: "Scenic Road Trip",
    icon: IconRoadTrip,
    badgeBg: "bg-orange-500 text-white",
    tagText: "text-orange-500 dark:text-orange-400",
    border: "border-orange-500/30",
    desc: "Coastal drives, countryside exploration, road journeys",
  },
  LUXURY: {
    label: "Boutique & Luxury",
    icon: IconLuxury,
    badgeBg: "bg-emerald-600 text-white",
    tagText: "text-emerald-500 dark:text-emerald-400",
    border: "border-emerald-500/30",
    desc: "Curated boutique stays, fine dining, private tours",
  },
  RELAXATION: {
    label: "Relaxation & Wellness",
    icon: IconRelaxation,
    badgeBg: "bg-orange-500 text-white",
    tagText: "text-orange-500 dark:text-orange-400",
    border: "border-orange-500/30",
    desc: "Hot springs, coastal retreats, peaceful escapes",
  },
};

/** Travel style display labels */
export const TRAVEL_STYLES: Record<string, string> = {
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
