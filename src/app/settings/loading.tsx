export default function SettingsLoading() {
  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 animate-pulse">
      {/* Page header skeleton */}
      <div className="h-6 w-28 rounded bg-slate-200 dark:bg-slate-800" />
      {/* Account card skeleton */}
      <div className="flex items-center gap-4 bg-white dark:bg-[#111815] rounded-3xl border border-slate-200 dark:border-emerald-950/80 p-5">
        <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-32" />
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-48" />
        </div>
      </div>
      {/* Settings sections skeleton */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white dark:bg-[#111815] rounded-3xl border border-slate-200 dark:border-emerald-950/80 p-4 space-y-3">
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-24" />
          {[1, 2, 3].map((j) => (
            <div key={j} className="flex items-center gap-3 py-2">
              <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800" />
              <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-36" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
