export default function SafetyLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-pulse">
      {/* Hero skeleton */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-slate-200 dark:bg-slate-800 mx-auto" />
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-64 mx-auto" />
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-96 mx-auto" />
      </div>
      {/* Sections skeleton */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-3xl bg-white dark:bg-[#111815] border border-slate-200 dark:border-emerald-950/80 p-6 space-y-3">
          <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-48" />
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-full" />
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-5/6" />
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-4/6" />
        </div>
      ))}
    </div>
  );
}
