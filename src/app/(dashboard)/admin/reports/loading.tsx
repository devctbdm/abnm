import { Skeleton } from "@/components/ui/skeleton"

export default function AdminReportsLoading() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <div className="h-8 w-56 bg-muted animate-pulse rounded-md" />
        <div className="mt-1 h-4 w-40 bg-muted animate-pulse rounded-md" />
      </div>
      <div className="flex gap-2 border-b">
        <Skeleton className="h-8 w-28 rounded-t-md" />
        <Skeleton className="h-8 w-20 rounded-t-md" />
        <Skeleton className="h-8 w-20 rounded-t-md" />
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
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-10 w-40 rounded-md" />
        <Skeleton className="h-10 w-40 rounded-md" />
      </div>
    </div>
  )
}
