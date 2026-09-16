'use client';

import {
  ChevronsUpDown,
  Check,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import type { Customer } from '@easyfactura/shared-types';

interface CustomerComboboxProps {
  customers: Customer[];
  value: string;
  onChange: (id: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Combobox de cliente con búsqueda normalizada (sin acentos).
 * Usado en los filtros avanzados de la pantalla de selección de rectificativas.
 */
export function CustomerCombobox({
  customers,
  value,
  onChange,
  open,
  onOpenChange,
}: CustomerComboboxProps) {
  const selected = customers.find((c) => c.id === value);

  return (
    <div>
      <Label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
        <Users className="h-3 w-3" />
        Cliente
      </Label>
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              'w-full justify-between font-normal h-8 text-sm',
              !selected && 'text-muted-foreground',
            )}
          >
            <span className="truncate">{selected ? selected.name : 'Todos los clientes'}</span>
            <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0" align="start">
          <Command
            filter={(v, search) => {
              const normalize = (s: string) =>
                s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
              return normalize(v).includes(normalize(search)) ? 1 : 0;
            }}
          >
            <CommandInput placeholder="Buscar cliente..." className="h-9" />
            <CommandList>
              <CommandEmpty>No se encontró ningún cliente.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value="todos-los-clientes"
                  onSelect={() => {
                    onChange('');
                    onOpenChange(false);
                  }}
                >
                  <Check
                    className={cn('mr-2 h-4 w-4 shrink-0', !value ? 'opacity-100' : 'opacity-0')}
                  />
                  Todos los clientes
                </CommandItem>
                {customers.map((c) => (
                  <CommandItem
                    key={c.id}
                    value={`${c.name} ${c.nif}`}
                    onSelect={() => {
                      onChange(c.id);
                      onOpenChange(false);
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4 shrink-0',
                        value === c.id ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    <span className="truncate">{c.name}</span>
                    <span className="ml-1 text-muted-foreground text-xs shrink-0">{c.nif}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
