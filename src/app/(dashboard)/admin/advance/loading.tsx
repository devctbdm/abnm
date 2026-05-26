import { Skeleton, SkeletonTable } from "@/components/ui/skeleton"

export default function AdminAdvanceLoading() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="h-8 w-64 bg-muted animate-pulse rounded-md" />
          <div className="mt-1 h-4 w-48 bg-muted animate-pulse rounded-md" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-36 rounded-md" />
          <Skeleton className="h-10 w-48 rounded-md" />
        </div>
      </div>
      <div className="flex gap-2 border-b">
        <Skeleton className="h-8 w-24 rounded-t-md" />
        <Skeleton className="h-8 w-28 rounded-t-md" />
        <Skeleton className="h-8 w-28 rounded-t-md" />
        <Skeleton className="h-8 w-20 rounded-t-md" />
      </div>
      <SkeletonTable rows={6} cols={6} />
    </div>
  )
}
