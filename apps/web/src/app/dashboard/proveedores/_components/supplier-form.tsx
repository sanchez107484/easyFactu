'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Loader2, User, Mail, Phone, MapPin, FileText } from 'lucide-react';
import { Supplier } from '@easyfactura/shared-types';

const supplierSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  legalName: z.string().max(100).optional(),
  taxId: z.string().max(20).optional(),
  email: z.string().email('El email no es válido').optional().or(z.literal('')),
  phone: z.string().max(20).optional(),
  address: z.string().max(200).optional(),
  postalCode: z.string().max(10).optional(),
  city: z.string().max(100).optional(),
  province: z.string().max(100).optional(),
  country: z.string().length(2, 'El código de país debe tener 2 caracteres').default('ES'),
  notes: z.string().max(500).optional(),
});

export type SupplierFormData = z.infer<typeof supplierSchema>;

interface SupplierFormProps {
  supplier?: Supplier | null;
  onSubmit: (data: SupplierFormData) => Promise<void>;
  isPending: boolean;
  mode: 'create' | 'edit';
  readOnly?: boolean;
}

export function SupplierForm({ supplier, onSubmit, isPending, mode, readOnly = false }: SupplierFormProps) {
  const form = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: '',
      legalName: '',
      taxId: '',
      email: '',
      phone: '',
      address: '',
      postalCode: '',
      city: '',
      province: '',
      country: 'ES',
      notes: '',
    },
  });

  useEffect(() => {
    if (supplier) {
      form.reset({
        name: supplier.name,
        legalName: supplier.legalName ?? '',
        taxId: supplier.taxId ?? '',
        email: supplier.email ?? '',
        phone: supplier.phone ?? '',
        address: supplier.address ?? '',
        postalCode: supplier.postalCode ?? '',
        city: supplier.city ?? '',
        province: supplier.province ?? '',
        country: supplier.country ?? 'ES',
        notes: supplier.notes ?? '',
      });
    }
  }, [supplier, form]);

  const handleSubmit = async (data: SupplierFormData) => {
    await onSubmit(data);
  };

  return (
    <div className="pb-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/dashboard/proveedores">
          <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {mode === 'create' ? 'Nuevo proveedor' : 'Editar proveedor'}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {mode === 'create'
              ? 'Añade un proveedor para asociarlo a tus gastos'
              : `Modificando: ${supplier?.name}`}
          </p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b bg-muted/30">
                <h2 className="text-sm font-semibold">Información del proveedor</h2>
              </div>
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      Nombre <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      {...form.register('name')}
                      placeholder="Ej: Proveedores S.L."
                      disabled={isPending || readOnly}
                      className="h-11"
                      autoFocus
                    />
                    {form.formState.errors.name && (
                      <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="taxId" className="text-sm font-medium flex items-center gap-2">
                      NIF/CIF{' '}
                      <span className="text-xs text-muted-foreground font-normal">(opcional)</span>
                    </Label>
                    <Input
                      id="taxId"
                      {...form.register('taxId')}
                      placeholder="Ej: B12345678"
                      disabled={isPending || readOnly}
                      className="h-11"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="legalName" className="text-sm font-medium flex items-center gap-2">
                    Razón social{' '}
                    <span className="text-xs text-muted-foreground font-normal">(opcional)</span>
                  </Label>
                  <Input
                    id="legalName"
                    {...form.register('legalName')}
                    placeholder="Ej: Proveedores Sociedad Limitada"
                    disabled={isPending || readOnly}
                    className="h-11"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      Email{' '}
                      <span className="text-xs text-muted-foreground font-normal">(opcional)</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      {...form.register('email')}
                      placeholder="contacto@proveedor.com"
                      disabled={isPending || readOnly}
                      className="h-11"
                    />
                    {form.formState.errors.email && (
                      <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      Teléfono{' '}
                      <span className="text-xs text-muted-foreground font-normal">(opcional)</span>
                    </Label>
                    <Input
                      id="phone"
                      {...form.register('phone')}
                      placeholder="+34 600 000 000"
                      disabled={isPending || readOnly}
                      className="h-11"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    Dirección{' '}
                    <span className="text-xs text-muted-foreground font-normal">(opcional)</span>
                  </Label>
                  <Input
                    id="address"
                    {...form.register('address')}
                    placeholder="Calle, número, piso..."
                    disabled={isPending || readOnly}
                    className="h-11"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="postalCode" className="text-sm font-medium">
                      Código postal
                    </Label>
                    <Input
                      id="postalCode"
                      {...form.register('postalCode')}
                      placeholder="28001"
                      disabled={isPending || readOnly}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-sm font-medium">
                      Ciudad
                    </Label>
                    <Input
                      id="city"
                      {...form.register('city')}
                      placeholder="Madrid"
                      disabled={isPending || readOnly}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="province" className="text-sm font-medium">
                      Provincia
                    </Label>
                    <Input
                      id="province"
                      {...form.register('province')}
                      placeholder="Madrid"
                      disabled={isPending || readOnly}
                      className="h-11"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-sm font-medium flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    Notas{' '}
                    <span className="text-xs text-muted-foreground font-normal">(opcional)</span>
                  </Label>
                  <Textarea
                    id="notes"
                    {...form.register('notes')}
                    placeholder="Información adicional sobre el proveedor"
                    rows={3}
                    disabled={isPending || readOnly}
                    className="resize-none text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden lg:sticky lg:top-4">
              <div className="px-5 py-4 border-b bg-muted/30">
                <p className="text-sm font-semibold">Acciones</p>
              </div>
              <div className="p-5 space-y-2">
                {readOnly ? (
                  <>
                    <div className="rounded-lg border border-amber-200 bg-amber-50/60 px-4 py-3 text-sm dark:border-amber-900 dark:bg-amber-950/20">
                      <p className="font-medium text-amber-800 dark:text-amber-300">Solo lectura</p>
                      <p className="text-amber-700/80 dark:text-amber-400/80 text-xs mt-0.5">
                        Tu plan actual no permite editar proveedores.
                      </p>
                    </div>
                    <Link href="/dashboard/ajustes/plan" className="block">
                      <Button type="button" className="w-full h-11 font-semibold">
                        Actualizar a PRO
                      </Button>
                    </Link>
                    <Link href="/dashboard/proveedores" className="block">
                      <Button type="button" variant="ghost" className="w-full">
                        Volver
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Button
                      type="submit"
                      disabled={isPending || readOnly}
                      className="w-full h-11 font-semibold"
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Guardando...
                        </>
                      ) : mode === 'create' ? (
                        'Guardar proveedor'
                      ) : (
                        'Guardar cambios'
                      )}
                    </Button>
                    <Link href="/dashboard/proveedores" className="block">
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={isPending || readOnly}
                        className="w-full"
                      >
                        Cancelar
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-dashed bg-muted/30 px-4 py-4 text-xs leading-relaxed">
              <p className="font-semibold text-foreground mb-1.5">¿Para qué sirven los proveedores?</p>
              <p className="text-muted-foreground">
                Puedes asociar un proveedor a cada gasto para tener más contexto y facilitar futuros
                filtros e informes.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
