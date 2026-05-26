import { Skeleton } from "@/components/ui/skeleton"

export default function EmployeeStatsLoading() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <div className="h-8 w-64 bg-muted animate-pulse rounded-md" />
        <div className="mt-1 h-4 w-40 bg-muted animate-pulse rounded-md" />
      </div>
      <div className="flex gap-2 border-b">
        <Skeleton className="h-8 w-32 rounded-t-md" />
        <Skeleton className="h-8 w-28 rounded-t-md" />
        <Skeleton className="h-8 w-40 rounded-t-md" />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-6 space-y-4">
            <Skeleton className="h-5 w-40" />
            {Array.from({ length: 5 }).map((_, j) => (
              <div key={j} className="flex justify-between border-b pb-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
