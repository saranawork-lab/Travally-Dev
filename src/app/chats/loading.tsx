export default function ChatsLoading() {
  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-6 space-y-4 animate-pulse">
      {/* Tab switcher skeleton */}
      <div className="flex gap-2">
        <div className="h-10 w-24 rounded-xl bg-slate-200 dark:bg-slate-800" />
        <div className="h-10 w-24 rounded-xl bg-slate-200 dark:bg-slate-800" />
      </div>
      {/* Search skeleton */}
      <div className="h-9 rounded-xl bg-slate-200 dark:bg-slate-800 w-full md:w-72" />
      {/* Chat rows skeleton */}
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3.5 rounded-2xl bg-white dark:bg-[#111815] border border-slate-200/80 dark:border-emerald-950/60">
            <div className="w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5 min-w-0">
              <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
              <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
