export default function DiscoverLoading() {
  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-6 space-y-5 animate-pulse">
      {/* Mode toggle skeleton */}
      <div className="flex gap-2 justify-center">
        <div className="h-10 w-36 rounded-xl bg-slate-200 dark:bg-slate-800" />
        <div className="h-10 w-36 rounded-xl bg-slate-200 dark:bg-slate-800" />
      </div>
      {/* Filter bar skeleton */}
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-8 w-20 rounded-full bg-slate-200 dark:bg-slate-800" />
        ))}
      </div>
      {/* Cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-52 rounded-2xl bg-slate-200 dark:bg-slate-800" />
        ))}
      </div>
    </div>
  );
}
