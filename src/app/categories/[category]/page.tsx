import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import db from "@/lib/db";
import { ActivityCard } from "@/components/activities/ActivityCard";
import { ArrowLeft, Film, Coffee, Footprints, BookOpen, Music, ShoppingBag, MapPin, Compass } from "lucide-react";
import type { Metadata } from "next";

const CATEGORY_META: Record<string, { title: string; desc: string; icon: string; dbEnum?: string }> = {
  movies: {
    title: "Movies & Cinema Companions",
    desc: "Find someone to watch indie movies, film screenings, and discuss over coffee afterwards.",
    icon: "Film",
    dbEnum: "MOVIES",
  },
  "food-cafes": {
    title: "Food & Specialty Cafe Companions",
    desc: "Discover pastry lovers, specialty coffee enthusiasts, and food crawl partners in your city.",
    icon: "Coffee",
    dbEnum: "FOOD_CAFES",
  },
  walking: {
    title: "Walking, Trails & Scenic Strolls",
    desc: "Connect with walking buddies for coastal trails, sunset promenades, and casual park strolls.",
    icon: "Footprints",
    dbEnum: "WALKING",
  },
  studying: {
    title: "Study Sessions & Co-Working Companions",
    desc: "Find focused study partners for quiet library sessions, writing Pomodoros, and matcha breaks.",
    icon: "BookOpen",
    dbEnum: "STUDYING",
  },
  events: {
    title: "Live Shows, Gigs & Event Companions",
    desc: "Never go to a live concert, folk gig, or theater showcase alone. Connect with fellow attendees.",
    icon: "Music",
    dbEnum: "EVENTS",
  },
  "events-pubs": {
    title: "Live Shows, Gigs & Event Companions",
    desc: "Never go to a live concert, folk gig, or theater showcase alone. Connect with fellow attendees.",
    icon: "Music",
    dbEnum: "EVENTS",
  },
  shopping: {
    title: "Shopping & Flea Market Companions",
    desc: "Find partners for flea markets, vintage thrifting, and weekend shopping walks.",
    icon: "ShoppingBag",
    dbEnum: "SHOPPING",
  },
  "city-exploration": {
    title: "City Exploration & Architectural Walks",
    desc: "Explore historic alleyways, secret viewpoints, and architectural landmarks with fellow urban flâneurs.",
    icon: "MapPin",
    dbEnum: "CITY_EXPLORATION",
  },
  other: {
    title: "Local Activity Companions",
    desc: "Discover partners for unique everyday activities, hobbies, and local meetups.",
    icon: "Compass",
    dbEnum: "OTHER",
  },
};

function getCategoryInfo(slug: string) {
  const catKey = slug.toLowerCase();
  if (CATEGORY_META[catKey]) {
    return CATEGORY_META[catKey];
  }
  const formattedTitle = catKey
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  return {
    title: `${formattedTitle} Companions`,
    desc: `Discover local companions and partners for ${formattedTitle.toLowerCase()} in your city.`,
    icon: "Compass",
    dbEnum: catKey.toUpperCase().replace(/-/g, "_"),
  };
}

export async function generateMetadata({
  params,
}: {
  params: { category: string };
}): Promise<Metadata> {
  const cat = getCategoryInfo(params.category);

  return {
    title: `${cat.title} — Travally Social Companion Platform`,
    description: cat.desc,
    openGraph: {
      title: `${cat.title} — Travally`,
      description: cat.desc,
    },
  };
}

export default async function CategorySEOPage({
  params,
}: {
  params: { category: string };
}) {
  const catKey = params.category.toLowerCase();
  const catInfo = getCategoryInfo(catKey);
  const dbCategoryEnum = catInfo.dbEnum || catKey.toUpperCase().replace(/-/g, "_");

  const activities = await db.activity.findMany({
    where: {
      category: dbCategoryEnum,
      status: "OPEN",
    },
    include: {
      organizer: {
        select: {
          id: true,
          email: true,
          profile: true,
        },
      },
    },
    orderBy: { date: "asc" },
  });

  // JSON-LD Structured Data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: catInfo.title,
    description: catInfo.desc,
    url: `https://travally.in/categories/${catKey}`,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div>
        <Link
          href="/discover?mode=companion"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All Companion Categories</span>
        </Link>
      </div>

      {/* Header */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-brand-500/10 via-brand-500/5 to-transparent border border-brand-500/20 space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {catInfo.title}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
          {catInfo.desc}
        </p>
      </div>

      {/* Activities Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Upcoming {catInfo.title} ({activities.length})
          </h2>
          <Link
            href="/activities/create"
            className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
          >
            + Post an Activity in this Category
          </Link>
        </div>

        {activities.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-dark-card rounded-3xl border border-slate-200 dark:border-dark-border text-xs text-slate-400 space-y-3">
            <Compass className="w-8 h-8 text-brand-500 mx-auto" />
            <p>No open activities currently in this category. Be the first to start one!</p>
            <Link
              href="/activities/create"
              className="inline-flex px-4 py-2 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 transition shadow-sm"
            >
              Organize an Activity
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activities.map((act) => (
              <ActivityCard key={act.id} activity={act as any} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
