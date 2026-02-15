import { Skeleton } from "@/components/ui/skeleton"

export default function ScansLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-56 mt-2" />
        </div>
        <Skeleton className="h-6 w-36" />
      </div>
      <div className="rounded-xl border border-border bg-card p-4">
        <Skeleton className="h-9 w-full" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-3 mb-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-2 w-full rounded-full mb-4" />
            <Skeleton className="h-[120px] w-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )
}
