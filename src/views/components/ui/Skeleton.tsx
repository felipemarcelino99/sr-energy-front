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

/**
 * Reproduces the list-page loading pattern: a filter-bar-shaped card and a
 * listing-shaped card below it, matching the real layout's two containers.
 * Rendered instead of the real filter bar and table while loading.
 */
export function PageSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div className="filter-bar bg-base-200 border border-base-300 rounded-lg p-4 flex gap-3 items-center">
        <Skeleton className="h-8 flex-1" />
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-8 w-32" />
      </div>
      <Skeleton className="h-80" />
    </div>
  )
}

/**
 * Loading pattern for the Financeiro page: summary cards, filter bar, two
 * chart placeholders, and the transaction list.
 */
export function FinancialSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <div className="filter-bar bg-base-200 border border-base-300 rounded-lg p-4 flex gap-3 items-center">
        <Skeleton className="h-8 flex-1" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-40" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
      <Skeleton className="h-80" />
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
