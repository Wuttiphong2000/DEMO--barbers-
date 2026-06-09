export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-slate-800 ${className}`} />
  )
}

export function DashboardSkeleton() {
  return (
    <div className="min-h-full bg-slate-950 p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-3 w-36" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 rounded-xl" />
          <Skeleton className="h-8 w-24 rounded-xl" />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-slate-800 p-4 space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>

      {/* Queue sections */}
      {[...Array(2)].map((_, i) => (
        <div key={i} className="rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3">
            <Skeleton className="h-2 w-2 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="px-4 pb-3 space-y-2">
            {[...Array(2)].map((_, j) => (
              <div key={j} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                <div className="flex items-start gap-3">
                  <div className="space-y-1">
                    <Skeleton className="h-7 w-14" />
                    <Skeleton className="h-3 w-10" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-8 w-20 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function CalendarSkeleton() {
  return (
    <div className="min-h-full bg-slate-950 p-4 md:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-3 w-32" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-16 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      </div>
      <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-slate-800 p-2 gap-1">
          {[...Array(7)].map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}
        </div>
        <div className="grid grid-cols-7 gap-0">
          {[...Array(35)].map((_, i) => (
            <div key={i} className="aspect-square border-b border-r border-slate-800/50 p-1.5">
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function CustomersSkeleton() {
  return (
    <div className="min-h-full bg-slate-950 p-4 md:p-6 space-y-5">
      <div className="space-y-2">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-10 w-full rounded-xl" />
      <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden divide-y divide-slate-800">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-4 w-4" />
          </div>
        ))}
      </div>
    </div>
  )
}
