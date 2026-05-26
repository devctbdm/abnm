import { Skeleton } from "@/components/ui/skeleton"

export default function MarkAttendanceLoading() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="rounded-lg border bg-card p-6 text-center">
          <Skeleton className="mx-auto h-14 w-14 rounded-full" />
          <Skeleton className="mx-auto mt-4 h-6 w-48 rounded-md" />
          <Skeleton className="mx-auto mt-2 h-4 w-36 rounded-md" />
          <div className="mt-6 flex gap-3">
            <Skeleton className="h-12 flex-1 rounded-md" />
            <Skeleton className="h-12 flex-1 rounded-md" />
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="mt-6 h-12 w-full rounded-md" />
        </div>
      </div>
    </div>
  )
}
