import { Skeleton, SkeletonCard } from "@/components/ui/skeleton"

export default function AdminAttendanceCalendarLoading() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-56 bg-muted animate-pulse rounded-md" />
          <div className="mt-1 h-4 w-40 bg-muted animate-pulse rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-32 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </div>
      <div className="flex gap-4">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="rounded-lg border bg-card p-6">
        <Skeleton className="h-5 w-36" />
        <div className="mt-4 overflow-x-auto">
          <div className="flex gap-2 min-w-[600px]">
            <div className="w-48 shrink-0 space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
            <div className="flex-1 space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex gap-1">
                  {Array.from({ length: 15 }).map((_, j) => (
                    <Skeleton key={j} className="h-10 w-12" />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <SkeletonCard />
    </div>
  )
}
