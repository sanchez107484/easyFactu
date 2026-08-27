'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { ArrowLeft, Loader2, Save, RotateCcw } from 'lucide-react';
import {
  RecurringExpense,
  RecurringExpenseFrequency,
  ExpenseCategory,
  Supplier,
  Customer,
} from '@easyfactura/shared-types';
import { VALID_TAX_RATES } from '@easyfactura/shared-constants';

const formSchema = z.object({
  description: z.string().min(2, 'Mínimo 2 caracteres').max(255),
  categoryId: z.string().uuid('Selecciona una categoría'),
  supplierId: z.string().optional().nullable(),
  clientId: z.string().optional().nullable(),
  baseAmount: z.number({ invalid_type_error: 'Introduce un importe' }).min(0.01, 'Debe ser mayor que 0'),
  vatRate: z.number(),
  frequency: z.nativeEnum(RecurringExpenseFrequency),
  startDate: z.string().min(1, 'Introduce una fecha de inicio'),
  endDate: z.string().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  isActive: z.boolean().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const FREQUENCY_LABELS: Record<RecurringExpenseFrequency, string> = {
  [RecurringExpenseFrequency.WEEKLY]: 'Semanal',
  [RecurringExpenseFrequency.MONTHLY]: 'Mensual',
  [RecurringExpenseFrequency.BIMONTHLY]: 'Bimestral',
  [RecurringExpenseFrequency.QUARTERLY]: 'Trimestral',
  [RecurringExpenseFrequency.YEARLY]: 'Anual',
};

interface RecurringExpenseFormProps {
  recurringExpense?: RecurringExpense;
  categories: ExpenseCategory[];
  suppliers: Supplier[];
  customers: Customer[];
  onSubmit: (values: FormValues) => Promise<void>;
  isSubmitting: boolean;
  readOnly?: boolean;
}

export function RecurringExpenseForm({
  recurringExpense,
  categories,
  suppliers,
  customers,
  onSubmit,
  isSubmitting,
  readOnly = false,
}: RecurringExpenseFormProps) {
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: '',
      categoryId: '',
      supplierId: null,
      clientId: null,
      baseAmount: 0,
      vatRate: 21,
      frequency: RecurringExpenseFrequency.MONTHLY,
      startDate: new Date().toISOString().split('T')[0],
      endDate: null,
      notes: '',
      isActive: true,
    },
  });

  useEffect(() => {
    if (recurringExpense) {
      form.reset({
        description: recurringExpense.description,
        categoryId: recurringExpense.categoryId,
        supplierId: recurringExpense.supplierId,
        clientId: recurringExpense.clientId,
        baseAmount: Number(recurringExpense.baseAmount),
        vatRate: Number(recurringExpense.vatRate),
        frequency: recurringExpense.frequency,
        startDate: recurringExpense.startDate.split('T')[0],
        endDate: recurringExpense.endDate ? recurringExpense.endDate.split('T')[0] : null,
        notes: recurringExpense.notes,
        isActive: recurringExpense.isActive,
      });
    }
  }, [recurringExpense, form]);

  const title = recurringExpense ? 'Editar gasto recurrente' : 'Nuevo gasto recurrente';
  const vatRate = form.watch('vatRate');
  const baseAmount = form.watch('baseAmount') || 0;
  const vatAmount = Math.round(baseAmount * vatRate) / 100;
  const totalAmount = Math.round((baseAmount + vatAmount) * 100) / 100;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/gastos/recurrentes">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Volver
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">
          {recurringExpense
            ? 'Modifica los datos de la suscripción o gasto periódico.'
            : 'Crea una suscripción o gasto que se repite periódicamente.'}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardContent className="p-6 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Concepto</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Suscripción software" {...field} disabled={readOnly} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoría</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange} disabled={readOnly}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona categoría" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frecuencia</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange} disabled={readOnly}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona frecuencia" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(RecurringExpenseFrequency).map((freq) => (
                            <SelectItem key={freq} value={freq}>
                              {FREQUENCY_LABELS[freq]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="supplierId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Proveedor</FormLabel>
                      <Select
                        value={field.value ?? 'NONE'}
                        onValueChange={(value) => field.onChange(value === 'NONE' ? null : value)}
                        disabled={readOnly}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona proveedor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="NONE">Sin proveedor</SelectItem>
                          {suppliers.map((supplier) => (
                            <SelectItem key={supplier.id} value={supplier.id}>
                              {supplier.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cliente asociado</FormLabel>
                      <Select
                        value={field.value ?? 'NONE'}
                        onValueChange={(value) => field.onChange(value === 'NONE' ? null : value)}
                        disabled={readOnly}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona cliente" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="NONE">Sin cliente</SelectItem>
                          {customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de inicio</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} disabled={readOnly} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de fin (opcional)</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value || null)}
                          disabled={readOnly}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="baseAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Base imponible</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min={0.01}
                          placeholder="0,00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          disabled={readOnly}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="vatRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IVA (%)</FormLabel>
                      <Select
                        value={String(field.value)}
                        onValueChange={(value) => field.onChange(Number(value))}
                        disabled={readOnly}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona IVA" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {VALID_TAX_RATES.map((rate) => (
                            <SelectItem key={rate} value={String(rate)}>
                              {rate}%
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground">Importe estimado por periodo</p>
                <p className="text-2xl font-bold tabular-nums">
                  {totalAmount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Base: {baseAmount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })} + IVA:{' '}
                  {vatAmount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                </p>
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Notas adicionales..."
                        value={field.value ?? ''}
                        onChange={field.onChange}
                        disabled={readOnly}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {recurringExpense && (
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Activo</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Los gastos inactivos no generan nuevos apuntes.
                        </p>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} disabled={readOnly} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}
            </CardContent>

            {!readOnly && (
              <CardFooter className="flex justify-end gap-3 border-t bg-muted/30 px-6 py-4">
                <Button variant="outline" type="button" asChild>
                  <Link href="/dashboard/gastos/recurrentes">Cancelar</Link>
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Guardar
                </Button>
              </CardFooter>
            )}
          </Card>
        </form>
      </Form>
    </div>
  );
}
