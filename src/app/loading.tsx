export default function HomeLoading() {
  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-6 space-y-5 animate-pulse">
      {/* Tab bar skeleton */}
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-9 w-20 rounded-xl bg-slate-200 dark:bg-slate-800" />
        ))}
      </div>
      {/* Hero card skeleton */}
      <div className="h-56 rounded-3xl bg-slate-200 dark:bg-slate-800" />
      {/* Content cards */}
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 rounded-2xl bg-slate-200 dark:bg-slate-800" />
        ))}
      </div>
    </div>
  );
}
