import { Skeleton } from "@/components/ui/skeleton"

export default function SettingsLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-4 w-56 mt-2" />
      </div>
      <Skeleton className="h-10 w-96" />
      <div className="rounded-xl border border-border bg-card p-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between py-4 border-b border-border last:border-0">
            <div>
              <Skeleton className="h-5 w-36 mb-1" />
              <Skeleton className="h-3 w-64" />
            </div>
            <Skeleton className="h-6 w-10" />
          </div>
        ))}
      </div>
    </div>
  )
}
