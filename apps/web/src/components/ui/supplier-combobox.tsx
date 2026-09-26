'use client';

import { useState, useMemo } from 'react';
import { Check, ChevronsUpDown, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { Supplier } from '@easyfactura/shared-types';

interface SupplierComboboxProps {
  suppliers: Supplier[];
  value: string;
  onChange: (id: string) => void;
  hasError?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export function SupplierCombobox({
  suppliers,
  value,
  onChange,
  hasError,
  disabled,
  placeholder = 'Selecciona un proveedor',
}: SupplierComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selected = suppliers.find((s) => s.id === value);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return suppliers;
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.taxId && s.taxId.toLowerCase().includes(q)),
    );
  }, [suppliers, search]);

  const handleSelect = (supplierId: string) => {
    onChange(supplierId);
    setOpen(false);
    setSearch('');
  };

  const trimmedSearch = search.trim();

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
            {selected ? `${selected.name}${selected.taxId ? ` — ${selected.taxId}` : ''}` : placeholder}
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
            onValueChange={setSearch}
          />
          <CommandList>
            {suppliers.length === 0 ? (
              <div className="p-3 text-sm text-muted-foreground flex gap-2 items-start">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                No tienes proveedores activos.
              </div>
            ) : (
              <>
                <CommandGroup>
                  {filtered.length === 0 && trimmedSearch ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      No se encontró ningún proveedor.
                    </div>
                  ) : (
                    filtered.map((s) => (
                      <CommandItem key={s.id} value={s.id} onSelect={() => handleSelect(s.id)}>
                        <Check
                          className={cn(
                            'h-4 w-4 shrink-0',
                            value === s.id ? 'opacity-100' : 'opacity-0',
                          )}
                        />
                        <span className="truncate">{s.name}</span>
                        {s.taxId && (
                          <span className="text-muted-foreground shrink-0">— {s.taxId}</span>
                        )}
                      </CommandItem>
                    ))
                  )}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
