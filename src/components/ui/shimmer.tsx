import { cn } from "@/lib/utils"

interface ShimmerProps {
  className?: string
}

export function Shimmer({ className }: ShimmerProps) {
  return (
    <div
      className={cn(
        "bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-[shimmer_2s_infinite]",
        className
      )}
    />
  )
}

// Pre-built shimmer components for common use cases
export function ShimmerCard({ className }: ShimmerProps) {
  return (
    <div className={cn("rounded-lg border p-6", className)}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Shimmer className="h-4 w-24" />
          <Shimmer className="h-4 w-4 rounded-full" />
        </div>
        <Shimmer className="h-8 w-20" />
        <div className="space-y-2">
          <Shimmer className="h-3 w-32" />
          <Shimmer className="h-3 w-24" />
        </div>
      </div>
    </div>
  )
}

export function ShimmerMetricCard({ className }: ShimmerProps) {
  return (
    <div className={cn("rounded-lg border p-6", className)}>
      <div className="flex items-center justify-between space-y-0 pb-2">
        <Shimmer className="h-4 w-24" />
        <Shimmer className="h-4 w-4" />
      </div>
      <div className="space-y-2">
        <Shimmer className="h-8 w-20" />
        <div className="flex items-center space-x-2">
          <Shimmer className="h-3 w-3 rounded-full" />
          <Shimmer className="h-3 w-20" />
        </div>
        <Shimmer className="h-3 w-16" />
      </div>
    </div>
  )
}

export function ShimmerTable({ rows = 5, className }: ShimmerProps & { rows?: number }) {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex justify-between items-center p-3 border rounded-lg">
          <div className="space-y-2">
            <Shimmer className="h-4 w-20" />
            <Shimmer className="h-3 w-32" />
            <Shimmer className="h-3 w-16" />
          </div>
          <div className="text-right space-y-2">
            <Shimmer className="h-4 w-16" />
            <Shimmer className="h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ShimmerButton({ className }: ShimmerProps) {
  return (
    <Shimmer className={cn("h-10 w-full rounded-md", className)} />
  )
}

export function ShimmerHeader({ className }: ShimmerProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Shimmer className="h-8 w-48" />
      <Shimmer className="h-4 w-64" />
    </div>
  )
}

export function ShimmerGrid({ 
  columns = 4, 
  rows = 2, 
  className 
}: ShimmerProps & { columns?: number; rows?: number }) {
  return (
    <div className={cn("grid gap-6", className)} style={{
      gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`
    }}>
      {Array.from({ length: columns * rows }).map((_, i) => (
        <ShimmerMetricCard key={i} />
      ))}
    </div>
  )
}

export function ShimmerTabs({ className }: ShimmerProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex space-x-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Shimmer key={i} className="h-10 w-24 rounded-md" />
        ))}
      </div>
      <div className="space-y-6">
        <ShimmerGrid columns={2} rows={1} />
        <ShimmerCard />
      </div>
    </div>
  )
}

export function ShimmerAlert({ className }: ShimmerProps) {
  return (
    <div className={cn("rounded-lg border p-4", className)}>
      <div className="flex items-center space-x-2">
        <Shimmer className="h-4 w-4 rounded-full" />
        <Shimmer className="h-4 w-64" />
      </div>
    </div>
  )
}

export function ShimmerQuickActions({ className }: ShimmerProps) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", className)}>
      {Array.from({ length: 4 }).map((_, i) => (
        <Shimmer key={i} className="h-20 rounded-md" />
      ))}
    </div>
  )
}
