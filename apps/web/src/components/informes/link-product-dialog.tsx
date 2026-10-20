'use client';

import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { FreeTextSalesLine } from '@easyfactura/shared-types';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useProducts } from '@/hooks/use-products';
import { useLinkProductAlias } from '@/hooks/use-reports';
import { cn } from '@/lib/utils';

const CATALOG_LIMIT = 500;

const normalize = (text: string) => text.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');

interface LinkProductDialogProps {
  line: FreeTextSalesLine;
  onClose: () => void;
}

/** "Conectar con artículo": pick the catalog product this free-text concept really is. */
export function LinkProductDialog({ line, onClose }: LinkProductDialogProps) {
  const [productId, setProductId] = useState(line.suggestedProduct?.id ?? '');
  const { data, isLoading } = useProducts({ limit: CATALOG_LIMIT });
  const link = useLinkProductAlias();
  const products = data?.data ?? [];

  function handleConfirm() {
    link.mutate({ description: line.description, productId }, { onSuccess: onClose });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Conectar con un artículo</DialogTitle>
          <DialogDescription>
            Todas las líneas con el concepto «{line.description}» contarán en los informes para el
            artículo que elijas. Las facturas no se modifican.
          </DialogDescription>
        </DialogHeader>

        <Command
          className="rounded-md border"
          filter={(item, search) => (normalize(item).includes(normalize(search)) ? 1 : 0)}
        >
          <CommandInput placeholder="Buscar artículo..." />
          <CommandList className="max-h-64">
            <CommandEmpty>{isLoading ? 'Cargando artículos...' : 'Sin resultados.'}</CommandEmpty>
            <CommandGroup>
              {products.map((product) => (
                <CommandItem
                  key={product.id}
                  value={`${product.name} ${product.reference ?? ''} ${product.id}`}
                  onSelect={() => setProductId(product.id)}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4 shrink-0',
                      productId === product.id ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  <span className="truncate">{product.name}</span>
                  {product.id === line.suggestedProduct?.id && (
                    <span className="ml-2 shrink-0 text-xs text-muted-foreground">sugerido</span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!productId || link.isPending} className="gap-2">
            {link.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Conectar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
