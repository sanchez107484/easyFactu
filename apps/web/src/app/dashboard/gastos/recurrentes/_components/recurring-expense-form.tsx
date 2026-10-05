'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
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
import { Loader2, Save, Calendar, FileText, ArrowLeft } from 'lucide-react';
import {
  RecurringExpense,
  RecurringExpenseFrequency,
  ExpenseCategory,
  Supplier,
  Customer,
} from '@easyfactura/shared-types';
import { VALID_TAX_RATES } from '@easyfactura/shared-constants';
import { useExpenseCalculations } from '@/hooks/use-expense-calculations';

const formSchema = z.object({
  description: z.string().min(2, 'Mínimo 2 caracteres').max(255),
  categoryId: z.string().uuid('Selecciona una categoría'),
  supplierId: z.string().optional().nullable(),
  clientId: z.string().optional().nullable(),
  baseAmount: z.number({ invalid_type_error: 'Introduce un importe' }).min(0.01, 'Debe ser mayor que 0'),
  vatRate: z.number(),
  totalAmount: z.number().optional(),
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
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: '',
      categoryId: '',
      supplierId: null,
      clientId: null,
      baseAmount: 0,
      totalAmount: 0,
      vatRate: 21,
      frequency: RecurringExpenseFrequency.MONTHLY,
      startDate: new Date().toISOString().split('T')[0],
      endDate: null,
      notes: '',
      isActive: true,
    },
  });

  const calculations = useExpenseCalculations();

  useEffect(() => {
    if (recurringExpense) {
      const base = Number(recurringExpense.baseAmount) || 0;
      const total = Number(recurringExpense.totalAmount) || 0;
      form.reset({
        description: recurringExpense.description,
        categoryId: recurringExpense.categoryId,
        supplierId: recurringExpense.supplierId,
        clientId: recurringExpense.clientId,
        baseAmount: base,
        vatRate: Number(recurringExpense.vatRate),
        totalAmount: total,
        frequency: recurringExpense.frequency,
        startDate: recurringExpense.startDate.split('T')[0],
        endDate: recurringExpense.endDate ? recurringExpense.endDate.split('T')[0] : null,
        notes: recurringExpense.notes,
        isActive: recurringExpense.isActive,
      });
      calculations.initializeFromExpense(base, total);
    }
  }, [recurringExpense, form, calculations]);

  const title = recurringExpense ? 'Editar gasto recurrente' : 'Nuevo gasto recurrente';
  const vatRate = form.watch('vatRate');
  const baseAmount = form.watch('baseAmount') || 0;

  return (
    <div className="pb-10">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/gastos/recurrentes">
            <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {recurringExpense
                ? `Modificando: ${recurringExpense.description}`
                : 'Crea una suscripción o gasto que se repite periódicamente.'}
            </p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit((values) => {
          const base = values.baseAmount || 0;
          const vat = values.vatRate || 0;
          const { total } = calculations.computed;
          const totalToSend = calculations.userEnteredTotal ?? values.totalAmount ?? total;
          onSubmit({ ...values, totalAmount: totalToSend });
        })} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-2 border-primary/20 shadow-md overflow-hidden ring-1 ring-primary/10">
                <div className="px-6 py-4 border-b bg-primary/5 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold">Datos del gasto</h2>
                    <p className="text-xs text-muted-foreground">Concepto, categoría e importes</p>
                  </div>
                </div>
                <CardContent className="p-6 space-y-5">
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Concepto</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: Suscripción software" {...field} disabled={readOnly} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-5 sm:grid-cols-2">
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
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-primary/20 shadow-md overflow-hidden ring-1 ring-primary/10">
                <div className="px-6 py-4 border-b bg-primary/5 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17.5v-11"/></svg>
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold">Importes</h2>
                    <p className="text-xs text-muted-foreground">Base imponible e IVA</p>
                  </div>
                </div>
                <CardContent className="p-6 space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="baseAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Base imponible</FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              inputMode="decimal"
                              placeholder="0,00"
                              value={calculations.baseAmountRaw}
                              onChange={(e) => {
                                calculations.handleBaseAmountChange(e.target.value, vatRate, (v) => {
                                  form.setValue('baseAmount', v, { shouldValidate: false });
                                });
                              }}
                              onBlur={() => {
                                const result = calculations.handleBaseAmountBlur(vatRate, (v, validate) => {
                                  form.setValue('baseAmount', v, { shouldValidate: validate });
                                });
                              }}
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
                            onValueChange={(value) => {
                              const newVat = Number(value);
                              field.onChange(newVat);
                              const { total } = calculations.computed;
                              calculations.handleTotalChange(calculations.formatNumber(total), newVat, (v) => {
                                form.setValue('baseAmount', v, { shouldValidate: false });
                              });
                            }}
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

                  <div className="rounded-lg border-2 border-dashed bg-muted/30 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground mb-2">Total por periodo</p>
                        <Input
                          type="text"
                          inputMode="decimal"
                          placeholder="0,00"
                          className="text-2xl font-bold h-12 bg-background"
                          value={calculations.totalRaw || calculations.formatNumber(calculations.computed.displayTotal)}
                          onChange={(e) => {
                            calculations.handleTotalChange(e.target.value, vatRate, (v) => {
                              form.setValue('baseAmount', v, { shouldValidate: false });
                            });
                          }}
                          onBlur={() => {
                            const result = calculations.handleTotalBlur(vatRate, (v, validate) => {
                              form.setValue('baseAmount', v, { shouldValidate: validate });
                              if (result.totalAmount !== undefined) {
                                form.setValue('totalAmount', result.totalAmount, { shouldValidate: true });
                              }
                            });
                          }}
                          disabled={readOnly}
                        />
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-xs text-muted-foreground">
                          Base: {baseAmount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          IVA ({vatRate}%): {calculations.computed.vatAmount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-primary/20 shadow-md overflow-hidden ring-1 ring-primary/10">
                <div className="px-6 py-4 border-b bg-primary/5 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold">Fechas</h2>
                    <p className="text-xs text-muted-foreground">Cuándo empieza y termina</p>
                  </div>
                </div>
                <CardContent className="p-6 space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
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
                  </div>
                </CardContent>
              </Card>

              {recurringExpense && (
                <Card className="border-2 border-amber-200 shadow-md overflow-hidden">
                  <CardContent className="p-6">
                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Activo</FormLabel>
                            <p className="text-sm text-muted-foreground">
                              Los gastos inactivos no generan nuevos apuntes automáticamente.
                            </p>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={readOnly}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              <Card className="border-2 border-primary/20 shadow-md overflow-hidden ring-1 ring-primary/10">
                <CardContent className="p-6 space-y-5">
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
                            rows={4}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {!readOnly && (
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" asChild>
                    <Link href="/dashboard/gastos/recurrentes">Cancelar</Link>
                  </Button>
                  <Button type="submit" className="flex-1" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Guardar
                  </Button>
                </div>
              )}
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
