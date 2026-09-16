'use client';

import { useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Customer } from '@easyfactura/shared-types';
import { CustomerCombobox } from './customer-combobox';

export interface RectificarFiltersState {
  search: string;
  fromDate: string;
  toDate: string;
  customerId: string;
}

interface RectificarFiltersProps {
  state: RectificarFiltersState;
  onChange: (next: RectificarFiltersState) => void;
  customers: Customer[];
}

/**
 * Barra de filtros de la pantalla de selección de rectificativas.
 * Búsqueda libre + filtros avanzados (cliente, fechas).
 */
export function RectificarFilters({ state, onChange, customers }: RectificarFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(
    Boolean(state.fromDate || state.toDate || state.customerId),
  );
  const [comboOpen, setComboOpen] = useState(false);

  const advancedCount =
    (state.fromDate ? 1 : 0) + (state.toDate ? 1 : 0) + (state.customerId ? 1 : 0);

  const update = (patch: Partial<RectificarFiltersState>) =>
    onChange({ ...state, ...patch });

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nº, cliente o NIF..."
            value={state.search}
            onChange={(e) => update({ search: e.target.value })}
            className="pl-9 pr-9"
          />
          {state.search && (
            <button
              type="button"
              onClick={() => update({ search: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button
          type="button"
          variant={showAdvanced || advancedCount > 0 ? 'secondary' : 'outline'}
          onClick={() => setShowAdvanced((v) => !v)}
          className={cn('shrink-0 gap-1.5', advancedCount > 0 && 'ring-2 ring-primary ring-offset-1')}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden sm:inline text-sm">Filtros</span>
          {advancedCount > 0 && (
            <Badge variant="default" className="h-5 min-w-5 px-1 text-xs">
              {advancedCount}
            </Badge>
          )}
        </Button>
      </div>

      {showAdvanced && (
        <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
          {advancedCount > 0 && (
            <div className="flex items-center justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => update({ fromDate: '', toDate: '', customerId: '' })}
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Limpiar filtros
              </Button>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <CustomerCombobox
              customers={customers}
              value={state.customerId}
              onChange={(id) => update({ customerId: id })}
              open={comboOpen}
              onOpenChange={setComboOpen}
            />
            <div>
              <Label htmlFor="from-date" className="text-xs text-muted-foreground mb-1.5 block">
                Desde
              </Label>
              <Input
                id="from-date"
                type="date"
                value={state.fromDate}
                onChange={(e) => update({ fromDate: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label htmlFor="to-date" className="text-xs text-muted-foreground mb-1.5 block">
                Hasta
              </Label>
              <Input
                id="to-date"
                type="date"
                value={state.toDate}
                onChange={(e) => update({ toDate: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
