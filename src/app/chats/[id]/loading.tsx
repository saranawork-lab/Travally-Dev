export default function ChatRoomLoading() {
  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-[#f8fafc] dark:bg-[#090d0b] animate-pulse">
      {/* Chat header skeleton */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-800">
        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800" />
        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800" />
        <div className="flex-1 space-y-1.5">
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-32" />
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-20" />
        </div>
      </div>
      {/* Messages skeleton */}
      <div className="flex-1 p-4 space-y-3 overflow-hidden">
        <div className="flex justify-start"><div className="h-10 w-48 rounded-2xl bg-slate-200 dark:bg-slate-800" /></div>
        <div className="flex justify-end"><div className="h-10 w-40 rounded-2xl bg-emerald-100 dark:bg-emerald-950/40" /></div>
        <div className="flex justify-start"><div className="h-10 w-56 rounded-2xl bg-slate-200 dark:bg-slate-800" /></div>
        <div className="flex justify-end"><div className="h-10 w-36 rounded-2xl bg-emerald-100 dark:bg-emerald-950/40" /></div>
        <div className="flex justify-start"><div className="h-10 w-44 rounded-2xl bg-slate-200 dark:bg-slate-800" /></div>
      </div>
      {/* Input bar skeleton */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-slate-200 dark:border-slate-800">
        <div className="flex-1 h-10 rounded-full bg-slate-200 dark:bg-slate-800" />
        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800" />
      </div>
    </div>
  );
}
