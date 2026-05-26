import { Skeleton, SkeletonCard } from "@/components/ui/skeleton"

export default function AdminAttendanceLoading() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <div className="h-8 w-64 bg-muted animate-pulse rounded-md" />
        <div className="mt-1 h-4 w-48 bg-muted animate-pulse rounded-md" />
      </div>
      <div className="rounded-lg border bg-card p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-32 w-full rounded-md" />
        </div>
        <div className="mt-4 flex gap-3">
          <Skeleton className="h-10 w-32 rounded-md" />
          <Skeleton className="h-10 w-32 rounded-md" />
        </div>
      </div>
      <div className="flex gap-4">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="rounded-lg border bg-card p-6">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="mt-1 h-3 w-32" />
        <div className="mt-4 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-6 w-40" />
              {Array.from({ length: 10 }).map((_, j) => (
                <Skeleton key={j} className="h-6 w-8" />
              ))}
            </div>
          ))}
        </div>
      </div>
      <SkeletonCard />
    </div>
  )
}
