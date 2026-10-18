'use client';

import { useState } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';

export interface ReportSelectOption {
  value: string;
  label: string;
  hint?: string | null;
}

interface ReportMultiSelectProps {
  id: string;
  label: string;
  allLabel: string;
  options: ReportSelectOption[];
  values: string[];
  onChange: (values: string[]) => void;
  searchPlaceholder?: string;
  isLoading?: boolean;
}

const normalize = (text: string) => text.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');

function summarize(selected: ReportSelectOption[], allLabel: string): string {
  if (selected.length === 0) return allLabel;
  if (selected.length === 1) return selected[0]?.label ?? allLabel;
  return `${selected.length} seleccionados`;
}

/** Searchable multi-select; an empty selection means "all". */
export function ReportMultiSelect({
  id,
  label,
  allLabel,
  options,
  values,
  onChange,
  searchPlaceholder = 'Buscar...',
  isLoading,
}: ReportMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selected = options.filter((option) => values.includes(option.value));

  function toggle(value: string) {
    onChange(values.includes(value) ? values.filter((v) => v !== value) : [...values, value]);
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={isOpen}
            disabled={isLoading}
            className={cn(
              'w-full justify-between font-normal',
              !selected.length && 'text-muted-foreground',
            )}
          >
            <span className="truncate">{summarize(selected, allLabel)}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[--radix-popover-trigger-width] min-w-[260px] p-0"
          align="start"
        >
          <Command filter={(item, search) => (normalize(item).includes(normalize(search)) ? 1 : 0)}>
            {options.length > 8 && <CommandInput placeholder={searchPlaceholder} className="h-9" />}
            <CommandList>
              <CommandEmpty>Sin resultados.</CommandEmpty>
              {values.length > 0 && (
                <CommandGroup>
                  <CommandItem value="__clear__" onSelect={() => onChange([])}>
                    <X className="mr-2 h-4 w-4" />
                    Quitar selección ({allLabel.toLowerCase()})
                  </CommandItem>
                </CommandGroup>
              )}
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={`${option.label} ${option.hint ?? ''} ${option.value}`}
                    onSelect={() => toggle(option.value)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4 shrink-0',
                        values.includes(option.value) ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    <span className="truncate">{option.label}</span>
                    {option.hint && (
                      <span className="ml-1 shrink-0 text-xs text-muted-foreground">
                        {option.hint}
                      </span>
                    )}
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
