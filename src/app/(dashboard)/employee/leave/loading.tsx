import { Skeleton } from "@/components/ui/skeleton"

export default function EmployeeLeaveLoading() {
  return (
    <div className="min-h-[calc(100vh-9rem)] space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-56 bg-muted animate-pulse rounded-md" />
          <div className="mt-1 h-4 w-40 bg-muted animate-pulse rounded-md" />
        </div>
        <Skeleton className="h-10 w-32 rounded-md" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-6">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-2 h-8 w-16" />
          </div>
        ))}
      </div>
      <div className="rounded-lg border bg-card p-6">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="mt-1 h-3 w-48" />
        <div className="mt-4 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between border-b pb-3">
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
