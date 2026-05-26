import { Skeleton, SkeletonCard, SkeletonStatCard, SkeletonWelcomeBanner } from "@/components/ui/skeleton"

export default function EmployeeDashboardLoading() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <SkeletonWelcomeBanner />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
      </div>
      <SkeletonCard />
      <SkeletonCard />
    </div>
  )
}
