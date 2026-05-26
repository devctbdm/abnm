import { Skeleton } from "@/components/ui/skeleton"

export default function EmployeeAttendanceLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
      <div>
        <div className="h-8 w-48 bg-muted animate-pulse rounded-md" />
        <div className="mt-1 h-4 w-64 bg-muted animate-pulse rounded-md" />
      </div>
      <div className="rounded-lg border bg-card p-6">
        <Skeleton className="h-5 w-36" />
        <div className="mt-4 grid grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-6 w-12" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
        <div className="mt-4">
          <Skeleton className="h-4 w-full rounded-full" />
        </div>
      </div>
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-md" />
          ))}
        </div>
      </div>
    </div>
  )
}
