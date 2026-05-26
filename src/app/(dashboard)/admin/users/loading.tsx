import { SkeletonTable } from "@/components/ui/skeleton"

export default function AdminUsersLoading() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="h-8 w-48 bg-muted animate-pulse rounded-md" />
          <div className="mt-1 h-4 w-64 bg-muted animate-pulse rounded-md" />
        </div>
        <div className="h-10 w-28 bg-muted animate-pulse rounded-md" />
      </div>
      <SkeletonTable rows={8} cols={7} />
    </div>
  )
}
