interface SkeletonProps {
  className?: string
}

/**
 * Simple pulsing placeholder block. Height/width are controlled entirely by
 * the `className` passed by the caller.
 */
export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`animate-pulse bg-base-300 rounded-lg ${className}`} />
}

interface PageSkeletonProps {
  rows?: number
}

/**
 * Reproduces the list-page loading pattern: title/button row, filter bar,
 * and N row placeholders.
 */
export function PageSkeleton({ rows = 5 }: PageSkeletonProps) {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-10" />
      {[...Array(rows)].map((_, i) => (
        <Skeleton key={i} className="h-14" />
      ))}
    </div>
  )
}

interface DashboardSkeletonProps {
  cards?: number
}

/**
 * Loading pattern for dashboard pages: title, N status cards, and a large
 * panel placeholder (calendar/table area).
 */
export function DashboardSkeleton({ cards = 2 }: DashboardSkeletonProps) {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-10 w-48" />
      {[...Array(cards)].map((_, i) => (
        <Skeleton key={i} className="h-36 rounded-xl" />
      ))}
      <Skeleton className="h-64 rounded-xl" />
    </div>
  )
}
