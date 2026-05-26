import { Skeleton, SkeletonStatCard, SkeletonTable } from "@/components/ui/skeleton"

export default function PayrollLoading() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <div className="h-8 w-56 bg-muted animate-pulse rounded-md" />
        <div className="mt-1 h-4 w-40 bg-muted animate-pulse rounded-md" />
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
        <Skeleton className="mt-4 h-10 w-24 rounded-md" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
      </div>
      <SkeletonTable rows={6} cols={8} />
      <div className="flex justify-end">
        <Skeleton className="h-12 w-56 rounded-md" />
      </div>
    </div>
  )
}
