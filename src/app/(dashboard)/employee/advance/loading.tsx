import { Skeleton } from "@/components/ui/skeleton"

export default function EmployeeAdvanceLoading() {
  return (
    <div className="mx-auto max-w-4xl min-h-[calc(100vh-10rem)] space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-48 bg-muted animate-pulse rounded-md" />
          <div className="mt-1 h-4 w-56 bg-muted animate-pulse rounded-md" />
        </div>
        <Skeleton className="h-10 w-40 rounded-md" />
      </div>
      <div className="rounded-lg border bg-muted/50 p-6">
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-1 h-6 w-20" />
            </div>
          ))}
        </div>
        <Skeleton className="mt-4 h-3 w-full" />
      </div>
      <div className="rounded-lg border bg-card p-6">
        <Skeleton className="h-5 w-32" />
        <div className="mt-4 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
