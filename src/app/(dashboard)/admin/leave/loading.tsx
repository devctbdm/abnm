import { Skeleton, SkeletonStatCard, SkeletonTable } from "@/components/ui/skeleton"

export default function AdminLeaveLoading() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="h-8 w-52 bg-muted animate-pulse rounded-md" />
          <div className="mt-1 h-4 w-40 bg-muted animate-pulse rounded-md" />
        </div>
        <Skeleton className="h-10 w-48 rounded-md" />
      </div>
      <div className="flex gap-2 border-b">
        <Skeleton className="h-8 w-24 rounded-t-md" />
        <Skeleton className="h-8 w-28 rounded-t-md" />
        <Skeleton className="h-8 w-28 rounded-t-md" />
      </div>
      <SkeletonTable rows={5} cols={7} />
      <div className="grid gap-4 md:grid-cols-3">
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
      </div>
    </div>
  )
}
