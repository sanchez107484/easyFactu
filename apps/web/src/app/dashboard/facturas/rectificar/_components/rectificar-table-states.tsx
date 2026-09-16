'use client';

import { FileText } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface RectificarTableSkeletonProps {
  rows?: number;
}

/**
 * Skeleton de filas para el estado de carga del listado de selección.
 */
export function RectificarTableSkeleton({ rows = 8 }: RectificarTableSkeletonProps) {
  return (
    <div className="divide-y">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-6 py-4">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-20 hidden md:block" />
          <Skeleton className="h-4 w-24 ml-auto" />
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-32 rounded-full" />
        </div>
      ))}
    </div>
  );
}

/**
 * Empty state inline para el listado de selección de rectificativas.
 */
export function RectificarTableEmpty() {
  return (
    <div className="py-16 px-6 text-center">
      <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-muted mb-3">
        <FileText className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium">Sin facturas para rectificar</p>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
        No hay facturas en estado Confirmada, Enviada o Cobrada que coincidan con los filtros.
      </p>
    </div>
  );
}
