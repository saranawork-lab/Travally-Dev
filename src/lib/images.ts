/**
 * Travally Visual Media & Photography Utilities
 * Curated high-resolution imagery for activities and travel plans.
 * Each category tag has ONE specific assigned image visible to all users.
 */

const CATEGORY_ASSIGNED_IMAGES: Record<string, string> = {
  MOVIES: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=900&auto=format&fit=crop&q=80",
  FOOD_CAFES: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=900&auto=format&fit=crop&q=80",
  WALKING: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=900&auto=format&fit=crop&q=80",
  STUDYING: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=900&auto=format&fit=crop&q=80",
  EVENTS: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=900&auto=format&fit=crop&q=80",
  SHOPPING: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=900&auto=format&fit=crop&q=80",
  CITY_EXPLORATION: "https://images.unsplash.com/photo-1477959858617-67f30bc75b82?w=900&auto=format&fit=crop&q=80",
  OTHER: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=900&auto=format&fit=crop&q=80",
};

const CATEGORY_META: Record<
  string,
  {
    label: string;
    tagBg: string;
    tagText: string;
    border: string;
    defaultImage: string;
  }
> = {
  MOVIES: {
    label: "Movies & Cinema",
    tagBg: "bg-purple-600/90 text-white backdrop-blur-md",
    tagText: "text-purple-400",
    border: "border-purple-500/20",
    defaultImage: CATEGORY_ASSIGNED_IMAGES.MOVIES,
  },
  FOOD_CAFES: {
    label: "Food & Cafes",
    tagBg: "bg-amber-600/90 text-white backdrop-blur-md",
    tagText: "text-amber-400",
    border: "border-amber-500/20",
    defaultImage: CATEGORY_ASSIGNED_IMAGES.FOOD_CAFES,
  },
  WALKING: {
    label: "Walking & Trails",
    tagBg: "bg-emerald-600/90 text-white backdrop-blur-md",
    tagText: "text-emerald-400",
    border: "border-emerald-500/20",
    defaultImage: CATEGORY_ASSIGNED_IMAGES.WALKING,
  },
  STUDYING: {
    label: "Studying & Co-work",
    tagBg: "bg-blue-600/90 text-white backdrop-blur-md",
    tagText: "text-blue-400",
    border: "border-blue-500/20",
    defaultImage: CATEGORY_ASSIGNED_IMAGES.STUDYING,
  },
  EVENTS: {
    label: "Events & Shows",
    tagBg: "bg-rose-600/90 text-white backdrop-blur-md",
    tagText: "text-rose-400",
    border: "border-rose-500/20",
    defaultImage: CATEGORY_ASSIGNED_IMAGES.EVENTS,
  },
  SHOPPING: {
    label: "Shopping & Markets",
    tagBg: "bg-indigo-600/90 text-white backdrop-blur-md",
    tagText: "text-indigo-400",
    border: "border-indigo-500/20",
    defaultImage: CATEGORY_ASSIGNED_IMAGES.SHOPPING,
  },
  CITY_EXPLORATION: {
    label: "City Exploration",
    tagBg: "bg-teal-600/90 text-white backdrop-blur-md",
    tagText: "text-teal-400",
    border: "border-teal-500/20",
    defaultImage: CATEGORY_ASSIGNED_IMAGES.CITY_EXPLORATION,
  },
  OTHER: {
    label: "Community Activity",
    tagBg: "bg-slate-700/90 text-white backdrop-blur-md",
    tagText: "text-slate-300",
    border: "border-slate-500/20",
    defaultImage: CATEGORY_ASSIGNED_IMAGES.OTHER,
  },
};

/**
 * Returns the exact assigned image for an activity category tag.
 * Every activity with the same tag displays the same assigned image.
 */
export function getActivityImage(activity: {
  category?: string;
  imageUrl?: string | null;
}): string {
  if (activity.imageUrl) return activity.imageUrl;
  const categoryKey = activity.category?.toUpperCase() || "OTHER";
  return CATEGORY_ASSIGNED_IMAGES[categoryKey] || CATEGORY_ASSIGNED_IMAGES.OTHER;
}

/**
 * Returns a high-res contextual cover image for a travel expedition.
 */
export function getTripImage(trip: {
  destination?: string;
  travelStyle?: string;
  imageUrl?: string | null;
}): string {
  if (trip.imageUrl) return trip.imageUrl;

  const destLower = (trip.destination || "").toLowerCase();

  if (destLower.includes("manali") || destLower.includes("kasol") || destLower.includes("himachal") || destLower.includes("parvati") || destLower.includes("tosh")) {
    return "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=900&auto=format&fit=crop&q=80";
  }
  if (destLower.includes("ladakh") || destLower.includes("leh") || destLower.includes("spiti") || destLower.includes("pangong")) {
    return "https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?w=900&auto=format&fit=crop&q=80";
  }
  if (destLower.includes("meghalaya") || destLower.includes("dawki") || destLower.includes("shillong") || destLower.includes("cherrapunji")) {
    return "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=900&auto=format&fit=crop&q=80";
  }
  if (destLower.includes("kerala") || destLower.includes("munnar") || destLower.includes("alleppey") || destLower.includes("wayanad")) {
    return "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=900&auto=format&fit=crop&q=80";
  }
  if (destLower.includes("goa") || destLower.includes("gokarna") || destLower.includes("beach")) {
    return "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=900&auto=format&fit=crop&q=80";
  }
  if (destLower.includes("rajasthan") || destLower.includes("jaipur") || destLower.includes("udaipur") || destLower.includes("jaisalmer")) {
    return "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=900&auto=format&fit=crop&q=80";
  }
  if (destLower.includes("rishikesh") || destLower.includes("uttarakhand") || destLower.includes("ganga")) {
    return "https://images.unsplash.com/photo-1506461883276-594a12b11cf3?w=900&auto=format&fit=crop&q=80";
  }
  if (destLower.includes("hampi") || destLower.includes("coorg") || destLower.includes("karnataka") || destLower.includes("gokarna")) {
    return "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=900&auto=format&fit=crop&q=80";
  }

  switch (trip.travelStyle) {
    case "BACKPACKING":
    case "ADVENTURE":
      return "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=900&auto=format&fit=crop&q=80";
    case "LUXURY":
      return "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900&auto=format&fit=crop&q=80";
    case "SLOW_TRAVEL":
      return "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=900&auto=format&fit=crop&q=80";
    default:
      return "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=900&auto=format&fit=crop&q=80";
  }
}
