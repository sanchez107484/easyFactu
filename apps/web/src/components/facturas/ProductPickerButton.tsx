'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Package, Wrench, BookOpen, Check } from 'lucide-react';
import { useProducts } from '@/hooks/use-products';
import { Product, ProductType } from '@easyfactura/shared-types';

export interface ProductSelection {
  description: string;
  unitPrice: number;
  taxRate: number;
  productId: string;
}

interface ProductPickerButtonProps {
  onSelect: (selection: ProductSelection) => void;
  selectedProductId?: string;
}

export function ProductPickerButton({ onSelect, selectedProductId }: ProductPickerButtonProps) {
  const [open, setOpen] = useState(false);
  const { data } = useProducts({ limit: 500 });
  const products = data?.data ?? [];

  if (products.length === 0) return null;

  const handleSelect = (product: Product) => {
    const description = product.description
      ? `${product.name}\n${product.description}`
      : product.name;
    onSelect({
      description,
      unitPrice: Number(product.unitPrice),
      taxRate: Number(product.taxRate),
      productId: product.id,
    });
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="h-7 gap-1.5 text-xs shrink-0">
          <BookOpen className="h-3.5 w-3.5" />
          {selectedProductId ? 'Cambiar' : 'Del catálogo'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start" side="bottom">
        <Command>
          <CommandInput placeholder="Buscar producto o servicio..." className="h-9" />
          <CommandList>
            <CommandEmpty>No se encontraron resultados.</CommandEmpty>
            <CommandGroup heading="Tu catálogo">
              {products.map((product) => {
                const Icon = product.type === ProductType.PRODUCT ? Package : Wrench;
                const pvp = Number(product.unitPrice) * (1 + Number(product.taxRate) / 100);
                const isSelected = selectedProductId === product.id;
                return (
                  <CommandItem
                    key={product.id}
                    value={`${product.name} ${product.reference ?? ''}`}
                    onSelect={() => handleSelect(product)}
                    className="flex items-start gap-2 py-2.5 cursor-pointer"
                  >
                    <Icon className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-sm truncate">{product.name}</span>
                        <span className="text-xs font-semibold tabular-nums text-primary shrink-0">
                          {pvp.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                        </span>
                      </div>
                      {product.reference && (
                        <span className="text-[11px] text-muted-foreground font-mono">
                          {product.reference}
                        </span>
                      )}
                    </div>
                    {isSelected && <Check className="h-4 w-4 shrink-0 text-primary mt-0.5" />}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
