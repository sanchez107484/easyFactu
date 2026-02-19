'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { validateNif } from '@easyfactura/shared-validators';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const customerSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(200),
  nif: z
    .string()
    .min(1, 'El NIF/CIF es obligatorio')
    .refine((val) => validateNif(val).isValid, {
      message: 'NIF/CIF no válido',
    }),
  email: z.string().email('Email no válido').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  postalCode: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  country: z.string().default('ES'),
  type: z.enum(['INDIVIDUAL', 'COMPANY', 'SELF_EMPLOYED']),
  notes: z.string().optional(),
  active: z.boolean().default(true),
});

type CustomerFormData = z.infer<typeof customerSchema>;

// Mock data (TODO: fetch from backend)
const existingCustomer = {
  name: 'Juan Pérez García',
  nif: '12345678Z',
  email: 'juan@ejemplo.com',
  phone: '666 123 456',
  address: 'Calle Principal, 123',
  postalCode: '28001',
  city: 'Madrid',
  province: 'Madrid',
  country: 'ES',
  type: 'INDIVIDUAL' as const,
  active: true,
  notes: 'Cliente preferente',
};

export default function EditarClientePage() {
  const router = useRouter();
  const params = useParams();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: existingCustomer,
  });

  const onSubmit = async (data: CustomerFormData) => {
    setIsSubmitting(true);
    try {
      // TODO: Call API
      console.log('Update customer:', params.id, data);
      // await apiClient.put(`/customers/${params.id}`, data);
      // toast.success('Cliente actualizado correctamente');
      router.push(`/dashboard/clientes/${params.id}`);
    } catch (error) {
      console.error(error);
      // toast.error('Error al actualizar el cliente');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/clientes/${params.id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Editar cliente</h1>
          <p className="text-muted-foreground">Modifica la información del cliente</p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Datos del cliente</CardTitle>
            <CardDescription>Actualiza la información del cliente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Nombre y NIF */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nombre <span className="text-destructive">*</span>
                </Label>
                <Input id="name" {...form.register('name')} />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="nif">
                  NIF/CIF <span className="text-destructive">*</span>
                </Label>
                <Input id="nif" {...form.register('nif')} className="uppercase" maxLength={9} />
                {form.formState.errors.nif && (
                  <p className="text-sm text-destructive">{form.formState.errors.nif.message}</p>
                )}
              </div>
            </div>

            {/* Email y Teléfono */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...form.register('email')} />
                {form.formState.errors.email && (
                  <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input id="phone" {...form.register('phone')} />
              </div>
            </div>

            {/* Tipo */}
            <div className="space-y-2">
              <Label htmlFor="type">
                Tipo de cliente <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.watch('type')}
                onValueChange={(value) => form.setValue('type', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INDIVIDUAL">Particular</SelectItem>
                  <SelectItem value="SELF_EMPLOYED">Autónomo</SelectItem>
                  <SelectItem value="COMPANY">Empresa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Dirección */}
            <div className="space-y-2">
              <Label htmlFor="address">Dirección</Label>
              <Input id="address" {...form.register('address')} />
            </div>

            {/* CP, Ciudad, Provincia */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="postalCode">Código Postal</Label>
                <Input id="postalCode" {...form.register('postalCode')} maxLength={5} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Ciudad</Label>
                <Input id="city" {...form.register('city')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="province">Provincia</Label>
                <Input id="province" {...form.register('province')} />
              </div>
            </div>

            {/* Notas */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notas internas</Label>
              <Textarea id="notes" {...form.register('notes')} rows={3} />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4 mt-6">
          <Link href={`/dashboard/clientes/${params.id}`}>
            <Button type="button" variant="outline" disabled={isSubmitting}>
              Cancelar
            </Button>
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </form>
    </div>
  );
}
