import { Skeleton, SkeletonStatCard, SkeletonTable } from "@/components/ui/skeleton"

export default function AdminSalaryLoading() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-56 bg-muted animate-pulse rounded-md" />
          <div className="mt-1 h-4 w-40 bg-muted animate-pulse rounded-md" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-28 rounded-md" />
          <Skeleton className="h-10 w-36 rounded-md" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
      </div>
      <div className="flex gap-2 border-b">
        <Skeleton className="h-8 w-36 rounded-t-md" />
        <Skeleton className="h-8 w-32 rounded-t-md" />
        <Skeleton className="h-8 w-32 rounded-t-md" />
      </div>
      <SkeletonTable rows={6} cols={8} />
    </div>
  )
}
