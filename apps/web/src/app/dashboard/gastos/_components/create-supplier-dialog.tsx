'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Plus } from 'lucide-react';
import { useCreateSupplier } from '@/hooks/use-suppliers';

const quickSupplierSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  taxId: z.string().max(20).optional(),
  email: z.string().email('El email no es válido').optional().or(z.literal('')),
  phone: z.string().max(20).optional(),
});

type QuickSupplierFormData = z.infer<typeof quickSupplierSchema>;

interface CreateSupplierDialogProps {
  onCreated: (supplierId: string) => void;
}

export function CreateSupplierDialog({ onCreated }: CreateSupplierDialogProps) {
  const [open, setOpen] = useState(false);
  const createMutation = useCreateSupplier();
  const form = useForm<QuickSupplierFormData>({
    resolver: zodResolver(quickSupplierSchema),
    defaultValues: { name: '', taxId: '', email: '', phone: '' },
  });

  const onSubmit = async (data: QuickSupplierFormData) => {
    const supplier = await createMutation.mutateAsync({
      name: data.name,
      taxId: data.taxId || undefined,
      email: data.email || undefined,
      phone: data.phone || undefined,
    });
    setOpen(false);
    form.reset();
    onCreated(supplier.id);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-xs">
          <Plus className="h-3.5 w-3.5 mr-1" />
          Nuevo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crear proveedor rápido</DialogTitle>
          <DialogDescription>
            Añade un proveedor nuevo y se seleccionará automáticamente en el gasto.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="qs-name">
              Nombre <span className="text-destructive">*</span>
            </Label>
            <Input
              id="qs-name"
              {...form.register('name')}
              placeholder="Ej: Proveedores S.L."
              disabled={createMutation.isPending}
            />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="qs-taxId">NIF/CIF</Label>
            <Input
              id="qs-taxId"
              {...form.register('taxId')}
              placeholder="Ej: B12345678"
              disabled={createMutation.isPending}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="qs-email">Email</Label>
              <Input
                id="qs-email"
                type="email"
                {...form.register('email')}
                placeholder="contacto@proveedor.com"
                disabled={createMutation.isPending}
              />
              {form.formState.errors.email && (
                <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="qs-phone">Teléfono</Label>
              <Input
                id="qs-phone"
                {...form.register('phone')}
                placeholder="+34 600 000 000"
                disabled={createMutation.isPending}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={createMutation.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Guardando...
                </>
              ) : (
                'Crear proveedor'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
