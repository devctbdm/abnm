import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

function SkeletonCard({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("rounded-lg border bg-card p-6", className)} {...props}>
      <div className="flex items-center justify-between pb-2">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>
      <Skeleton className="mt-2 h-8 w-1/3" />
    </div>
  )
}

function SkeletonStatCard({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("rounded-lg border bg-card p-6", className)} {...props}>
      <div className="flex items-center justify-between pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>
      <Skeleton className="mt-2 h-8 w-20" />
      <Skeleton className="mt-1 h-3 w-16" />
    </div>
  )
}

function SkeletonTable({
  rows = 5,
  cols = 4,
  className,
  ...props
}: React.ComponentProps<"div"> & { rows?: number; cols?: number }) {
  return (
    <div className={cn("rounded-lg border bg-card", className)} {...props}>
      <div className="border-b p-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-1 h-3 w-24" />
      </div>
      <div className="p-4">
        <div className="border-b pb-3">
          <div className="flex gap-4">
            {Array.from({ length: cols }).map((_, i) => (
              <Skeleton key={i} className="h-4 flex-1" />
            ))}
          </div>
        </div>
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-4 border-b py-3 last:border-0">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton key={c} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function SkeletonList({
  rows = 4,
  className,
  ...props
}: React.ComponentProps<"div"> & { rows?: number }) {
  return (
    <div className={cn("space-y-3", className)} {...props}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="h-3 w-2/5" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-16 rounded-md" />
            <Skeleton className="h-8 w-16 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  )
}

function SkeletonTabs({
  tabs = 3,
  className,
  ...props
}: React.ComponentProps<"div"> & { tabs?: number }) {
  return (
    <div className={cn("space-y-4", className)} {...props}>
      <div className="flex gap-2 border-b">
        {Array.from({ length: tabs }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-28 rounded-t-md" />
        ))}
      </div>
    </div>
  )
}

function SkeletonForm({
  fields = 3,
  className,
  ...props
}: React.ComponentProps<"div"> & { fields?: number }) {
  return (
    <div className={cn("rounded-lg border bg-card p-6", className)} {...props}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="mb-4 space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      ))}
      <div className="flex justify-end gap-2 pt-2">
        <Skeleton className="h-10 w-20 rounded-md" />
        <Skeleton className="h-10 w-20 rounded-md" />
      </div>
    </div>
  )
}

function SkeletonAvatar({
  size = "md",
  className,
  ...props
}: React.ComponentProps<"div"> & { size?: "sm" | "md" | "lg" }) {
  const sizeMap = { sm: "h-8 w-8", md: "h-10 w-10", lg: "h-16 w-16" }
  return (
    <Skeleton
      className={cn("rounded-full", sizeMap[size], className)}
      {...props}
    />
  )
}

function SkeletonChart({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("rounded-lg border bg-card p-6", className)} {...props}>
      <Skeleton className="h-5 w-44" />
      <div className="mt-4 flex h-40 items-end gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton
            key={i}
            className="flex-1 rounded-t"
            style={{ height: `${30 + Math.random() * 70}%` }}
          />
        ))}
      </div>
    </div>
  )
}

function SkeletonWelcomeBanner({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-lg bg-linear-to-r from-blue-600/20 to-indigo-600/20 p-6",
        className,
      )}
      {...props}
    >
      <Skeleton className="h-8 w-72" />
      <Skeleton className="mt-2 h-4 w-56" />
    </div>
  )
}

export {
  Skeleton,
  SkeletonCard,
  SkeletonStatCard,
  SkeletonTable,
  SkeletonList,
  SkeletonTabs,
  SkeletonForm,
  SkeletonAvatar,
  SkeletonChart,
  SkeletonWelcomeBanner,
}
