import { Skeleton } from "@/components/ui/skeleton"

export default function BlockchainLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Skeleton className="h-8 w-52" />
          <Skeleton className="h-4 w-72 mt-2" />
        </div>
        <Skeleton className="h-9 w-64" />
      </div>
      <div className="rounded-xl border border-border bg-card p-5">
        <Skeleton className="h-9 w-full mb-3" />
        <div className="flex gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-28" />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5">
          <Skeleton className="h-5 w-28 mb-4" />
          <Skeleton className="h-[140px] w-[140px] rounded-full mx-auto" />
        </div>
        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
          <Skeleton className="h-5 w-44 mb-4" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
