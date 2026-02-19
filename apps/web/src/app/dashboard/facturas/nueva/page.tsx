'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';

const invoiceLineSchema = z.object({
  description: z.string().min(1, 'La descripción es obligatoria'),
  quantity: z.number().min(0.01, 'La cantidad debe ser mayor a 0'),
  price: z.number().min(0, 'El precio debe ser mayor o igual a 0'),
  discount: z.number().min(0).max(100).default(0),
  taxRate: z.number().min(0).max(100),
});

const invoiceSchema = z.object({
  customerId: z.string().min(1, 'Debes seleccionar un cliente'),
  issueDate: z.string().min(1, 'La fecha es obligatoria'),
  dueDate: z.string().optional(),
  lines: z.array(invoiceLineSchema).min(1, 'Añade al menos una línea'),
  notes: z.string().optional(),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

// Mock customers (TODO: fetch from backend)
const customers = [
  { id: '1', name: 'Juan Pérez García' },
  { id: '2', name: 'María López SL' },
];

export default function NuevaFacturaPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      issueDate: new Date().toISOString().split('T')[0],
      lines: [
        {
          description: '',
          quantity: 1,
          price: 0,
          discount: 0,
          taxRate: 21,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'lines',
  });

  const lines = form.watch('lines') || [];

  // Calculate totals
  const subtotal = lines.reduce((acc, line) => {
    const lineTotal = line.quantity * line.price * (1 - line.discount / 100);
    return acc + lineTotal;
  }, 0);

  const taxBreakdown = lines.reduce(
    (acc, line) => {
      const lineSubtotal = line.quantity * line.price * (1 - line.discount / 100);
      const taxAmount = lineSubtotal * (line.taxRate / 100);
      const existing = acc.find((t) => t.rate === line.taxRate);
      if (existing) {
        existing.base += lineSubtotal;
        existing.amount += taxAmount;
      } else {
        acc.push({ rate: line.taxRate, base: lineSubtotal, amount: taxAmount });
      }
      return acc;
    },
    [] as Array<{ rate: number; base: number; amount: number }>,
  );

  const totalTax = taxBreakdown.reduce((acc, t) => acc + t.amount, 0);
  const total = subtotal + totalTax;

  const onSubmit = async (data: InvoiceFormData) => {
    setIsSubmitting(true);
    try {
      // TODO: Call API
      console.log('Create invoice:', data);
      // await apiClient.post('/invoices', data);
      // toast.success('Factura creada correctamente');
      router.push('/dashboard/facturas');
    } catch (error) {
      console.error(error);
      // toast.error('Error al crear la factura');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/facturas">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nueva factura</h1>
          <p className="text-muted-foreground">Crea una nueva factura para tu cliente</p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form (Left - 2 columns) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer & Dates */}
            <Card>
              <CardHeader>
                <CardTitle>Datos generales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Customer */}
                <div className="space-y-2">
                  <Label htmlFor="customerId">
                    Cliente <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={form.watch('customerId')}
                    onValueChange={(value) => form.setValue('customerId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.customerId && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.customerId.message}
                    </p>
                  )}
                  <Link
                    href="/dashboard/clientes/nuevo"
                    className="text-sm text-primary hover:underline"
                  >
                    + Crear nuevo cliente
                  </Link>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="issueDate">
                      Fecha emisión <span className="text-destructive">*</span>
                    </Label>
                    <Input id="issueDate" type="date" {...form.register('issueDate')} />
                    {form.formState.errors.issueDate && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.issueDate.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Fecha vencimiento (opcional)</Label>
                    <Input id="dueDate" type="date" {...form.register('dueDate')} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lines */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Líneas de factura</CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      append({
                        description: '',
                        quantity: 1,
                        price: 0,
                        discount: 0,
                        taxRate: 21,
                      })
                    }
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Añadir línea
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="p-4 border rounded-lg space-y-4 bg-muted/20">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-medium text-sm">Línea {index + 1}</h4>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <Label>
                        Descripción <span className="text-destructive">*</span>
                      </Label>
                      <Textarea
                        {...form.register(`lines.${index}.description`)}
                        placeholder="Describe el producto o servicio..."
                        rows={2}
                      />
                      {form.formState.errors.lines?.[index]?.description && (
                        <p className="text-sm text-destructive">
                          {form.formState.errors.lines[index]?.description?.message}
                        </p>
                      )}
                    </div>

                    {/* Quantity, Price, Discount */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="space-y-2">
                        <Label>Cantidad</Label>
                        <Input
                          type="number"
                          step="0.01"
                          {...form.register(`lines.${index}.quantity`, {
                            valueAsNumber: true,
                          })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Precio €</Label>
                        <Input
                          type="number"
                          step="0.01"
                          {...form.register(`lines.${index}.price`, {
                            valueAsNumber: true,
                          })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Dto. %</Label>
                        <Input
                          type="number"
                          step="0.01"
                          {...form.register(`lines.${index}.discount`, {
                            valueAsNumber: true,
                          })}
                          placeholder="0"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>IVA %</Label>
                        <Select
                          value={form.watch(`lines.${index}.taxRate`)?.toString()}
                          onValueChange={(value) =>
                            form.setValue(`lines.${index}.taxRate`, parseFloat(value))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">0%</SelectItem>
                            <SelectItem value="4">4%</SelectItem>
                            <SelectItem value="10">10%</SelectItem>
                            <SelectItem value="21">21%</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Line Total */}
                    <div className="text-right text-sm">
                      <span className="text-muted-foreground">Subtotal línea: </span>
                      <span className="font-semibold">
                        {(
                          lines[index].quantity *
                          lines[index].price *
                          (1 - lines[index].discount / 100)
                        ).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Notas</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  {...form.register('notes')}
                  placeholder="Información adicional para el cliente..."
                  rows={3}
                />
              </CardContent>
            </Card>
          </div>

          {/* Preview (Right - 1 column) */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <Card>
                <CardHeader>
                  <CardTitle>Resumen</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Base imponible:</span>
                      <span className="font-medium">
                        {subtotal.toLocaleString('es-ES', {
                          style: 'currency',
                          currency: 'EUR',
                        })}
                      </span>
                    </div>

                    {taxBreakdown.map((tax) => (
                      <div key={tax.rate} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">IVA {tax.rate}%:</span>
                        <span className="font-medium">
                          {tax.amount.toLocaleString('es-ES', {
                            style: 'currency',
                            currency: 'EUR',
                          })}
                        </span>
                      </div>
                    ))}

                    <div className="border-t pt-2 flex justify-between">
                      <span className="font-semibold">Total:</span>
                      <span className="font-bold text-xl">
                        {total.toLocaleString('es-ES', {
                          style: 'currency',
                          currency: 'EUR',
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 space-y-2">
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? 'Guardando...' : 'Guardar factura'}
                    </Button>
                    <Link href="/dashboard/facturas" className="block">
                      <Button type="button" variant="outline" className="w-full">
                        Cancelar
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
