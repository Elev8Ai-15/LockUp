import { Skeleton } from "@/components/ui/skeleton"

export default function ReportsLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-80 mt-2" />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="rounded-xl border border-border bg-card">
        <div className="p-4 border-b border-border">
          <div className="flex gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-20" />
            ))}
          </div>
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-border last:border-0">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-4 w-12 hidden md:block" />
            <Skeleton className="h-4 w-10 hidden md:block" />
            <Skeleton className="h-4 w-24 hidden sm:block" />
            <Skeleton className="h-5 w-14 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  )
}
