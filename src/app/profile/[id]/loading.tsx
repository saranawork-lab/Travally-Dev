export default function ProfileLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-pulse">
      {/* Back button skeleton */}
      <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-800" />
      {/* Profile card skeleton */}
      <div className="bg-white dark:bg-[#111815] rounded-3xl border border-slate-200 dark:border-emerald-950/80 p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-800" />
          <div className="space-y-2 flex-1">
            <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-40" />
            <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-28" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-16" />
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full" />
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
        </div>
      </div>
      {/* Tabs skeleton */}
      <div className="bg-white/80 dark:bg-[#111815]/80 rounded-3xl border border-slate-200/90 dark:border-emerald-950/70 p-4 sm:p-6">
        <div className="flex gap-3 mb-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 w-24 rounded-lg bg-slate-200 dark:bg-slate-800" />
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          ))}
        </div>
      </div>
    </div>
  );
}
