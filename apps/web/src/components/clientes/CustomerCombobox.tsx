'use client';

import { useState } from 'react';
import { Check, ChevronsUpDown, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Customer } from '@easyfactura/shared-types';

interface CustomerComboboxProps {
  customers: Customer[];
  value: string;
  onChange: (id: string) => void;
  hasError?: boolean;
  disabled?: boolean;
}

export function CustomerCombobox({
  customers,
  value,
  onChange,
  hasError,
  disabled,
}: CustomerComboboxProps) {
  const [open, setOpen] = useState(false);
  const selected = customers.find((c) => c.id === value);

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
        <Command
          filter={(itemValue, search) => {
            const customer = customers.find((c) => c.id === itemValue);
            if (!customer) return 0;
            const q = search.toLowerCase().trim();
            if (!q) return 1;
            if (customer.name.toLowerCase().includes(q) || customer.nif.toLowerCase().includes(q)) {
              return 1;
            }
            return 0;
          }}
        >
          <CommandInput placeholder="Buscar por nombre o NIF…" />
          <CommandList>
            {customers.length === 0 ? (
              <div className="p-3 text-sm text-muted-foreground flex gap-2 items-start">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                No tienes clientes activos. Crea uno primero.
              </div>
            ) : (
              <>
                <CommandEmpty>No se encontró ningún cliente.</CommandEmpty>
                <CommandGroup>
                  {customers.map((c) => (
                    <CommandItem
                      key={c.id}
                      value={c.id}
                      onSelect={(selectedValue) => {
                        onChange(selectedValue);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          'h-4 w-4 shrink-0',
                          value === c.id ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                      <span className="truncate">{c.name}</span>
                      <span className="text-muted-foreground shrink-0">— {c.nif}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
