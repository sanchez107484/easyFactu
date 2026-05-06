'use client';

import { useState, useMemo } from 'react';
import { Check, ChevronsUpDown, AlertCircle, Loader2, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { Customer, SharedPoolCustomer } from '@easyfactura/shared-types';

interface CustomerComboboxProps {
  customers: Customer[];
  value: string;
  onChange: (id: string) => void;
  hasError?: boolean;
  disabled?: boolean;
  /** Agency mode: shared pool customers from sibling tenants */
  sharedCustomers?: SharedPoolCustomer[];
  isLoadingShared?: boolean;
  onSelectShared?: (customer: SharedPoolCustomer) => void;
  onSearchChange?: (search: string) => void;
}

export function CustomerCombobox({
  customers,
  value,
  onChange,
  hasError,
  disabled,
  sharedCustomers,
  isLoadingShared,
  onSelectShared,
  onSearchChange,
}: CustomerComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const agencyMode = sharedCustomers !== undefined;
  const selected = customers.find((c) => c.id === value);

  const filteredLocal = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return customers;
    return customers.filter(
      (c) => c.name.toLowerCase().includes(q) || c.nif.toLowerCase().includes(q),
    );
  }, [customers, search]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    onSearchChange?.(val);
  };

  const handleSelectLocal = (customerId: string) => {
    onChange(customerId);
    setOpen(false);
    setSearch('');
    onSearchChange?.('');
  };

  const handleSelectShared = (customer: SharedPoolCustomer) => {
    setOpen(false);
    setSearch('');
    onSearchChange?.('');
    onSelectShared?.(customer);
  };

  const trimmedSearch = search.trim();
  const showSharedGroup =
    agencyMode && trimmedSearch.length >= 2 && (sharedCustomers?.length ?? 0) > 0;
  const showSharedLoading = agencyMode && trimmedSearch.length >= 2 && isLoadingShared;
  const hasNoLocalResults = filteredLocal.length === 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'w-full justify-between font-normal h-10',
            !selected && 'text-muted-foreground',
            hasError && 'border-destructive',
          )}
        >
          <span className="truncate">
            {selected ? `${selected.name} — ${selected.nif}` : 'Selecciona un cliente'}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0 w-[--radix-popover-trigger-width] max-w-none"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar por nombre o NIF…"
            value={search}
            onValueChange={handleSearchChange}
          />
          <CommandList>
            {customers.length === 0 && !agencyMode ? (
              <div className="p-3 text-sm text-muted-foreground flex gap-2 items-start">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                No tienes clientes activos. Crea uno primero.
              </div>
            ) : (
              <>
                <CommandGroup heading={agencyMode ? 'Tus contactos' : undefined}>
                  {hasNoLocalResults && !showSharedGroup && !showSharedLoading ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      {trimmedSearch ? 'No se encontró ningún cliente.' : 'Sin clientes activos.'}
                    </div>
                  ) : (
                    filteredLocal.map((c) => (
                      <CommandItem key={c.id} value={c.id} onSelect={() => handleSelectLocal(c.id)}>
                        <Check
                          className={cn(
                            'h-4 w-4 shrink-0',
                            value === c.id ? 'opacity-100' : 'opacity-0',
                          )}
                        />
                        <span className="truncate">{c.name}</span>
                        <span className="text-muted-foreground shrink-0">— {c.nif}</span>
                      </CommandItem>
                    ))
                  )}
                </CommandGroup>

                {agencyMode && (
                  <>
                    {showSharedLoading && (
                      <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground border-t">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Buscando en el directorio de la asesoría…
                      </div>
                    )}
                    {showSharedGroup && (
                      <>
                        <CommandSeparator />
                        <CommandGroup heading="Del directorio de la asesoría">
                          {sharedCustomers!.map((c) => (
                            <CommandItem
                              key={`shared-${c.id}`}
                              value={`shared-${c.id}`}
                              onSelect={() => handleSelectShared(c)}
                              className="gap-2"
                            >
                              <Building2 className="h-3.5 w-3.5 shrink-0 text-customer-500/70" />
                              <span className="truncate">{c.name}</span>
                              <span className="text-muted-foreground shrink-0">— {c.nif}</span>
                              <span className="ml-auto text-[10px] text-muted-foreground/60 shrink-0 truncate max-w-[110px]">
                                {c.sourceTenantName}
                              </span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </>
                    )}
                  </>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
