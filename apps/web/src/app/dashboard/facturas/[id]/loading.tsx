import { Skeleton } from '@/components/ui/skeleton';

export default function InvoiceDetailLoading() {
  return (
    <div className="space-y-6 p-6">
      {/* Breadcrumb + actions */}
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-5 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      {/* Header */}
      <div className="space-y-3">
        <Skeleton className="h-8 w-72" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-24" />
        </div>
      </div>

      {/* Two-column body */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-xl border bg-card p-6 space-y-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="rounded-xl border bg-card p-6 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-6 space-y-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="rounded-xl border bg-card p-6 space-y-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
