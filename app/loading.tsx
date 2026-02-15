import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header skeleton */}
      <div className="flex flex-col gap-1">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-80" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5">
            <Skeleton className="h-4 w-24 mb-3" />
            <Skeleton className="h-8 w-20 mb-2" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <Skeleton className="h-5 w-40 mb-4" />
          <Skeleton className="h-[200px] w-full rounded-lg" />
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <Skeleton className="h-5 w-40 mb-4" />
          <Skeleton className="h-[200px] w-full rounded-lg" />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card p-5">
        <Skeleton className="h-5 w-48 mb-4" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-3 border-b border-border last:border-0">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24 hidden sm:block" />
            <Skeleton className="h-4 w-16 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  )
}
