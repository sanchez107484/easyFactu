'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RectificarPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onChange: (page: number) => void;
}

/**
 * Paginación inferior del listado de selección de rectificativas.
 */
export function RectificarPagination({
  page,
  totalPages,
  total,
  onChange,
}: RectificarPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t">
      <span className="text-xs text-muted-foreground">
        Página {page} de {totalPages} · {total} factura{total !== 1 ? 's' : ''}
      </span>
      <div className="flex gap-1.5">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
        >
          Siguiente
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
