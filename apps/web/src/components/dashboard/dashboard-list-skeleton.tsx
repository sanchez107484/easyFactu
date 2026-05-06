import { Skeleton } from '@/components/ui/skeleton';

interface DashboardListSkeletonProps {
  /** Number of skeleton rows to render. Defaults to 8. */
  rows?: number;
  /** Whether to show the KPI strip on top. Defaults to true. */
  showKpis?: boolean;
}

/**
 * Generic skeleton for dashboard list pages: header + optional KPI strip + filters + table rows.
 * Used as the default `loading.tsx` for most dashboard subroutes.
 */
export function DashboardListSkeleton({ rows = 8, showKpis = true }: DashboardListSkeletonProps) {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* KPI strip */}
      {showKpis && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-card p-4">
              <Skeleton className="mb-2 h-3 w-20" />
              <Skeleton className="h-7 w-24" />
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="rounded-xl border bg-card p-4">
        <div className="grid gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>

      {/* Table rows */}
      <div className="space-y-2 rounded-xl border bg-card p-4">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}
