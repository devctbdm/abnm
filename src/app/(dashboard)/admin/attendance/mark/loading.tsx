import { Skeleton, SkeletonForm } from "@/components/ui/skeleton"

export default function AdminMarkAttendanceLoading() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center">
          <Skeleton className="mx-auto h-6 w-64 rounded-md" />
          <Skeleton className="mx-auto mt-2 h-4 w-48 rounded-md" />
        </div>
        <SkeletonForm fields={3} />
      </div>
    </div>
  )
}
