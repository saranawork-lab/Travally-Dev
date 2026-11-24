"use client";

import dynamic from "next/dynamic";

const UnifiedCreateFlow = dynamic(
  () => import("@/components/common/UnifiedCreateFlow").then((mod) => mod.UnifiedCreateFlow),
  {
    loading: () => (
      <div className="max-w-2xl mx-auto px-3 sm:px-6 lg:px-8 py-6 space-y-5 animate-pulse">
        <div className="flex gap-2 justify-center">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 w-28 rounded-xl bg-slate-200 dark:bg-slate-800" />
          ))}
        </div>
        <div className="bg-white dark:bg-[#111815] rounded-3xl border border-slate-200 dark:border-emerald-950/80 p-6 space-y-4">
          <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-40" />
          <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        </div>
      </div>
    ),
  }
);

export default function CreateHubPage() {
  return <UnifiedCreateFlow initialMode="instant" />;
}
