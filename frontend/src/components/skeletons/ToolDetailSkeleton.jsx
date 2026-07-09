export default function ToolDetailSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 animate-pulse">
      {/* Hero Section Skeleton */}
      <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-8 space-y-8">

        <div className="flex gap-4">
          <div className="h-16 w-16 rounded-3xl bg-slate-700" />
          <div className="space-y-2">
            <div className="h-4 w-40 bg-slate-700 rounded" />
            <div className="h-3 w-24 bg-slate-700 rounded" />
          </div>
        </div>

        <div className="flex gap-3">
          <div className="h-10 w-28 bg-slate-700 rounded-full" />
          <div className="h-10 w-28 bg-slate-700 rounded-full" />
          <div className="h-10 w-32 bg-slate-700 rounded-full" />
        </div>

      </div>

      {/* Content Grid Skeleton */}
      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">

        <div className="space-y-6">
          <div className="h-40 rounded-3xl bg-slate-800" />
          <div className="h-24 rounded-3xl bg-slate-800" />
        </div>

        <div className="space-y-6">
          <div className="h-28 rounded-3xl bg-slate-800" />
          <div className="h-48 rounded-3xl bg-slate-800" />
        </div>

      </div>
    </div>
  );
}