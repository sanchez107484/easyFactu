'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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

const productSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(200),
  description: z.string().optional(),
  reference: z.string().optional(),
  type: z.enum(['PRODUCT', 'SERVICE']),
  price: z.number().min(0, 'El precio debe ser mayor o igual a 0'),
  taxRate: z.number().min(0).max(100),
});

type ProductFormData = z.infer<typeof productSchema>;

// Mock data (TODO: fetch from backend)
const existingProduct = {
  name: 'Consultoría técnica',
  description: 'Servicio de consultoría técnica especializada por hora',
  reference: 'CONS-001',
  type: 'SERVICE' as const,
  price: 50,
  taxRate: 21,
};

export default function EditarProductoPage() {
  const router = useRouter();
  const params = useParams();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: existingProduct,
  });

  const price = form.watch('price') || 0;
  const taxRate = form.watch('taxRate') || 0;
  const priceWithTax = price * (1 + taxRate / 100);
  const taxAmount = price * (taxRate / 100);

  const onSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true);
    try {
      // TODO: Call API
      console.log('Update product:', params.id, data);
      // await apiClient.put(`/products/${params.id}`, data);
      // toast.success('Producto actualizado correctamente');
      router.push('/dashboard/productos');
    } catch (error) {
      console.error(error);
      // toast.error('Error al actualizar el producto');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/productos">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Editar producto</h1>
          <p className="text-muted-foreground">Modifica los datos del producto o servicio</p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Datos del producto</CardTitle>
            <CardDescription>Actualiza la información del producto o servicio</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Tipo */}
            <div className="space-y-2">
              <Label htmlFor="type">
                Tipo <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.watch('type')}
                onValueChange={(value) => form.setValue('type', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SERVICE">Servicio</SelectItem>
                  <SelectItem value="PRODUCT">Producto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Nombre <span className="text-destructive">*</span>
              </Label>
              <Input id="name" {...form.register('name')} />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea id="description" {...form.register('description')} rows={3} />
            </div>

            {/* Referencia */}
            <div className="space-y-2">
              <Label htmlFor="reference">Referencia/Código</Label>
              <Input id="reference" {...form.register('reference')} />
            </div>

            {/* Precio e IVA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">
                  Precio (sin IVA) <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    {...form.register('price', { valueAsNumber: true })}
                    className="pr-10"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    €
                  </span>
                </div>
                {form.formState.errors.price && (
                  <p className="text-sm text-destructive">{form.formState.errors.price.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxRate">
                  IVA (%) <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.watch('taxRate')?.toString()}
                  onValueChange={(value) => form.setValue('taxRate', parseFloat(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0% (Exento)</SelectItem>
                    <SelectItem value="4">4% (Superreducido)</SelectItem>
                    <SelectItem value="10">10% (Reducido)</SelectItem>
                    <SelectItem value="21">21% (General)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Preview */}
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Precio base:</span>
                    <span className="font-medium">
                      {price.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">IVA ({taxRate}%):</span>
                    <span className="font-medium">
                      {taxAmount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                    </span>
                  </div>
                  <div className="border-t pt-2 flex justify-between">
                    <span className="font-semibold">PVP final:</span>
                    <span className="font-semibold text-lg">
                      {priceWithTax.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4 mt-6">
          <Link href="/dashboard/productos">
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
