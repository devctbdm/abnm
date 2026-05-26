import { SkeletonTable } from "@/components/ui/skeleton"

export default function AdminHolidayLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-32 bg-muted animate-pulse rounded-md" />
          <div className="mt-1 h-4 w-48 bg-muted animate-pulse rounded-md" />
        </div>
        <div className="h-10 w-32 bg-muted animate-pulse rounded-md" />
      </div>
      <SkeletonTable rows={4} cols={3} />
    </div>
  )
}
