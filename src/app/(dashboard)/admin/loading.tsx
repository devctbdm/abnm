import {
  SkeletonWelcomeBanner,
  SkeletonStatCard,
  SkeletonCard,
  SkeletonTable,
  SkeletonChart,
} from "@/components/ui/skeleton"

export default function AdminDashboardLoading() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <SkeletonWelcomeBanner />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <SkeletonTable rows={5} cols={4} />
      <SkeletonChart />
    </div>
  )
}
