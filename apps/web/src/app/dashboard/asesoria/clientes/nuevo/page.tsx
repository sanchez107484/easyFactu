'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useCreateDirectClient } from '@/hooks/use-agency';
import { useAuthStore } from '@/store/auth-store';
import { AccountType } from '@easyfactura/shared-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Loader2, UserPlus } from 'lucide-react';

// ==================== SCHEMA ====================

const schema = z.object({
  businessName: z.string().min(2, 'El nombre es obligatorio'),
  nif: z
    .string()
    .min(9, 'El NIF/CIF debe tener al menos 9 caracteres')
    .max(20)
    .transform((v) => v.trim().toUpperCase()),
  email: z.string().email('Email no válido'),
  address: z.string().optional(),
  postalCode: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  phone: z.string().optional(),
  notes: z.string().max(500).optional(),
});

type FormData = z.infer<typeof schema>;

// ==================== PAGE ====================

export default function NuevoClienteAsesoriaPage() {
  const router = useRouter();
  const currentTenant = useAuthStore((state) => state.currentTenant);
  const { mutate: createClient, isPending } = useCreateDirectClient();

  const isAgency = currentTenant?.accountType === AccountType.AGENCY;

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  if (!isAgency) {
    router.replace('/dashboard');
    return null;
  }

  const onSubmit = (data: FormData) => {
    createClient(data, {
      onSuccess: () => {
        router.push('/dashboard/asesoria/clientes');
      },
    });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Link href="/dashboard/asesoria/clientes">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-semibold">Añadir cliente</h1>
          <p className="text-sm text-muted-foreground">
            Crea la cuenta del cliente y vincúlala a tu asesoría
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {/* Datos principales */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Datos del cliente</CardTitle>
            <CardDescription>
              Si el cliente ya tiene cuenta en NovaFactura con este NIF, se vinculará
              automáticamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="businessName">
                  Nombre / Razón social <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="businessName"
                  placeholder="Empresa S.L. o Nombre Apellidos"
                  {...register('businessName')}
                />
                {errors.businessName && (
                  <p className="text-xs text-destructive">{errors.businessName.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="nif">
                  NIF / CIF <span className="text-destructive">*</span>
                </Label>
                <Input id="nif" placeholder="B12345678" {...register('nif')} />
                {errors.nif && <p className="text-xs text-destructive">{errors.nif.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="contacto@empresa.com"
                  {...register('email')}
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone">Teléfono</Label>
                <Input id="phone" placeholder="+34 612 345 678" {...register('phone')} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dirección */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Dirección fiscal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="address">Dirección</Label>
                <Input id="address" placeholder="Calle Mayor, 1, 2ºA" {...register('address')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="postalCode">Código postal</Label>
                <Input id="postalCode" placeholder="28001" {...register('postalCode')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="city">Localidad</Label>
                <Input id="city" placeholder="Madrid" {...register('city')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="province">Provincia</Label>
                <Input id="province" placeholder="Madrid" {...register('province')} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notas */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Notas internas</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              id="notes"
              placeholder="Observaciones para tu asesoría..."
              rows={3}
              {...register('notes')}
            />
            {errors.notes && (
              <p className="mt-1 text-xs text-destructive">{errors.notes.message}</p>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Link href="/dashboard/asesoria/clientes">
            <Button variant="outline" disabled={isPending}>
              Cancelar
            </Button>
          </Link>
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Añadiendo...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Añadir cliente
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
