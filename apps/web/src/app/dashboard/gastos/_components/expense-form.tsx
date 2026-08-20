'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Calendar, FileText, Euro, Percent, Loader2, Receipt, User } from 'lucide-react';
import { Expense, ExpenseCategory, Supplier, Customer } from '@easyfactura/shared-types';
import { TAX_RATE_SELECT_OPTIONS } from '@easyfactura/shared-constants';
import { useExpenseCategories } from '@/hooks/use-expense-categories';
import { useSuppliers } from '@/hooks/use-suppliers';
import { useCustomers } from '@/hooks/use-customers';
import { CreateSupplierDialog } from './create-supplier-dialog';
import { round2 } from '@/lib/math';

const expenseSchema = z.object({
  date: z.string().min(1, 'La fecha es obligatoria'),
  description: z.string().min(2, 'El concepto debe tener al menos 2 caracteres').max(255),
  categoryId: z.string().uuid('Selecciona una categoría'),
  supplierId: z.string().uuid().optional().or(z.literal('')),
  clientId: z.string().uuid().optional().or(z.literal('')),
  baseAmount: z.number({ invalid_type_error: 'Introduce un importe válido' }).min(0.01, 'La base imponible debe ser mayor que 0'),
  vatRate: z.number().min(0).max(100),
  notes: z.string().max(2000).optional(),
});

export type ExpenseFormData = z.infer<typeof expenseSchema>;

interface ExpenseFormProps {
  expense?: Expense | null;
  onSubmit: (data: ExpenseFormData) => Promise<void>;
  isPending: boolean;
  mode: 'create' | 'edit';
  readOnly?: boolean;
}

function formatCurrency(amount: number) {
  return amount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
}

export function ExpenseForm({ expense, onSubmit, isPending, mode, readOnly = false }: ExpenseFormProps) {
  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      description: '',
      categoryId: '',
      supplierId: '',
      clientId: '',
      baseAmount: 0,
      vatRate: 21,
      notes: '',
    },
  });

  const [baseAmountRaw, setBaseAmountRaw] = useState<string>('');
  const [totalRaw, setTotalRaw] = useState<string>('');

  const { data: categories, isLoading: isCategoriesLoading } = useExpenseCategories();
  const { data: suppliersData } = useSuppliers({ limit: 500 });
  const { data: customersData } = useCustomers({ limit: 500 });

  const suppliers = suppliersData?.data ?? [];
  const customers = customersData?.data ?? [];

  const baseAmount = form.watch('baseAmount') || 0;
  const vatRate = form.watch('vatRate') || 0;
  const vatAmount = round2(baseAmount * (vatRate / 100));
  const totalAmount = round2(baseAmount + vatAmount);

  useEffect(() => {
    if (expense) {
      const base = Number(expense.baseAmount) || 0;
      const vat = Number(expense.vatRate) || 21;
      form.reset({
        date: expense.date.slice(0, 10),
        description: expense.description,
        categoryId: expense.categoryId,
        supplierId: expense.supplierId ?? '',
        clientId: expense.clientId ?? '',
        baseAmount: base,
        vatRate: vat,
        notes: expense.notes ?? '',
      });
      setBaseAmountRaw(base > 0 ? formatBaseAmount(base) : '');
      setTotalRaw(base > 0 ? formatTotal(round2(base * (1 + vat / 100))) : '');
    }
  }, [expense, form]);

  useEffect(() => {
    const base = form.getValues('baseAmount') || 0;
    if (base > 0) {
      setTotalRaw(formatTotal(round2(base * (1 + vatRate / 100))));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vatRate]);

  function formatBaseAmount(value: number): string {
    return new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  function formatTotal(value: number): string {
    return new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  const handleFormSubmit = async (data: ExpenseFormData) => {
    await onSubmit(data);
  };

  const isLoading = isCategoriesLoading;

  if (isLoading) {
    return (
      <div className="pb-10">
        <div className="flex items-center gap-3 mb-8">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="space-y-1.5">
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-4 w-80" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
          <Skeleton className="h-80 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="pb-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/gastos">
            <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {mode === 'create' ? 'Nuevo gasto' : 'Editar gasto'}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {mode === 'create'
                ? 'Registra un nuevo gasto de tu actividad'
                : `Modificando: ${expense?.description}`}
            </p>
          </div>
        </div>
      </div>

      <form id="expense-form" onSubmit={form.handleSubmit(handleFormSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic info */}
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b bg-muted/30">
                <h2 className="text-sm font-semibold">Información básica</h2>
              </div>
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date" className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      Fecha <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="date"
                      type="date"
                      {...form.register('date')}
                      disabled={isPending || readOnly}
                      className="h-11"
                    />
                    {form.formState.errors.date && (
                      <p className="text-xs text-destructive">{form.formState.errors.date.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="categoryId" className="text-sm font-medium flex items-center gap-2">
                      <Receipt className="h-3.5 w-3.5 text-muted-foreground" />
                      Categoría <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={form.watch('categoryId')}
                      onValueChange={(v) => form.setValue('categoryId', v)}
                      disabled={isPending || readOnly}
                    >
                      <SelectTrigger id="categoryId" className="h-11">
                        <SelectValue placeholder="Selecciona una categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories?.map((category: ExpenseCategory) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.categoryId && (
                      <p className="text-xs text-destructive">
                        {form.formState.errors.categoryId.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    Concepto <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="description"
                    {...form.register('description')}
                    placeholder="Ej: Suscripción software mensual"
                    disabled={isPending || readOnly}
                    className="h-11"
                  />
                  {form.formState.errors.description && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.description.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="supplierId" className="text-sm font-medium flex items-center gap-2">
                        Proveedor <span className="text-xs text-muted-foreground font-normal">(opcional)</span>
                      </Label>
                      {!readOnly && (
                        <CreateSupplierDialog
                          onCreated={(id) => form.setValue('supplierId', id, { shouldValidate: true })}
                        />
                      )}
                    </div>
                    <Select
                      value={form.watch('supplierId') || 'none'}
                      onValueChange={(v) => form.setValue('supplierId', v === 'none' ? '' : v)}
                      disabled={isPending || readOnly}
                    >
                      <SelectTrigger id="supplierId" className="h-11">
                        <SelectValue placeholder="Selecciona un proveedor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin proveedor</SelectItem>
                        {suppliers.map((supplier: Supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clientId" className="text-sm font-medium flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      Cliente <span className="text-xs text-muted-foreground font-normal">(opcional)</span>
                    </Label>
                    <Select
                      value={form.watch('clientId') || 'none'}
                      onValueChange={(v) => form.setValue('clientId', v === 'none' ? '' : v)}
                      disabled={isPending || readOnly}
                    >
                      <SelectTrigger id="clientId" className="h-11">
                        <SelectValue placeholder="Selecciona un cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin cliente</SelectItem>
                        {customers.map((customer: Customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-sm font-medium flex items-center gap-2">
                    Notas <span className="text-xs text-muted-foreground font-normal">(opcional)</span>
                  </Label>
                  <Textarea
                    id="notes"
                    {...form.register('notes')}
                    placeholder="Añade cualquier información adicional sobre este gasto"
                    rows={3}
                    disabled={isPending || readOnly}
                    className="resize-none text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Amounts */}
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b bg-muted/30">
                <h2 className="text-sm font-semibold">Importes</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  El IVA y el total se calculan automáticamente a partir de la base imponible.
                </p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="baseAmount" className="text-sm font-medium flex items-center gap-2">
                      <Euro className="h-3.5 w-3.5 text-muted-foreground" />
                      Base imponible <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="baseAmount"
                        type="text"
                        inputMode="decimal"
                        placeholder="0,00"
                        value={baseAmountRaw}
                        className="h-11 pr-12 text-base"
                        disabled={isPending || readOnly}
                        onChange={(e) => {
                          const raw = e.target.value;
                          setBaseAmountRaw(raw);
                          const num = parseFloat(raw.replace(',', '.'));
                          if (!isNaN(num) && num >= 0) {
                            form.setValue('baseAmount', num, { shouldValidate: false });
                            setTotalRaw(formatTotal(round2(num * (1 + vatRate / 100))));
                          }
                        }}
                        onBlur={() => {
                          const num = parseFloat(baseAmountRaw.replace(',', '.'));
                          if (isNaN(num) || num < 0) {
                            setBaseAmountRaw('');
                            setTotalRaw('');
                            form.setValue('baseAmount', 0, { shouldValidate: true });
                          } else {
                            setBaseAmountRaw(formatBaseAmount(num));
                            form.setValue('baseAmount', num, { shouldValidate: true });
                            setTotalRaw(formatTotal(round2(num * (1 + vatRate / 100))));
                          }
                        }}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium select-none">
                        EUR
                      </span>
                    </div>
                    {form.formState.errors.baseAmount && (
                      <p className="text-xs text-destructive">
                        {form.formState.errors.baseAmount.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vatRate" className="text-sm font-medium flex items-center gap-2">
                      <Percent className="h-3.5 w-3.5 text-muted-foreground" />
                      Tipo de IVA <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={String(form.watch('vatRate') ?? 21)}
                      onValueChange={(v) => form.setValue('vatRate', parseFloat(v))}
                      disabled={isPending || readOnly}
                    >
                      <SelectTrigger id="vatRate" className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TAX_RATE_SELECT_OPTIONS.map((t) => (
                          <SelectItem key={String(t.value)} value={String(t.value)}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="totalAmount" className="text-sm font-medium flex items-center gap-2">
                      <Euro className="h-3.5 w-3.5 text-muted-foreground" />
                      Total
                    </Label>
                    <div className="relative">
                      <Input
                        id="totalAmount"
                        type="text"
                        inputMode="decimal"
                        placeholder="0,00"
                        value={totalRaw}
                        className="h-11 pr-12 text-base"
                        disabled={isPending || readOnly}
                        onChange={(e) => {
                          const raw = e.target.value;
                          setTotalRaw(raw);
                          const total = parseFloat(raw.replace(',', '.'));
                          if (!isNaN(total) && total >= 0) {
                            const divisor = 1 + vatRate / 100;
                            const base = divisor > 0 ? round2(total / divisor) : 0;
                            form.setValue('baseAmount', base, { shouldValidate: false });
                            setBaseAmountRaw(formatBaseAmount(base));
                          }
                        }}
                        onBlur={() => {
                          const total = parseFloat(totalRaw.replace(',', '.'));
                          if (isNaN(total) || total < 0) {
                            setTotalRaw('');
                            setBaseAmountRaw('');
                            form.setValue('baseAmount', 0, { shouldValidate: true });
                          } else {
                            setTotalRaw(formatTotal(total));
                            const divisor = 1 + vatRate / 100;
                            const base = divisor > 0 ? round2(total / divisor) : 0;
                            form.setValue('baseAmount', base, { shouldValidate: true });
                            setBaseAmountRaw(formatBaseAmount(base));
                          }
                        }}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium select-none">
                        EUR
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Se autocalcula, pero puedes editarlo.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-5">
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden lg:sticky lg:top-4">
              <div className="px-5 py-4 border-b bg-muted/30">
                <p className="text-sm font-semibold">Resumen</p>
                <p className="text-xs text-muted-foreground mt-0.5">Cálculo en tiempo real</p>
              </div>
              <div className="p-5 space-y-2.5">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Base imponible</span>
                  <span className="font-medium tabular-nums">{formatCurrency(baseAmount)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">IVA ({vatRate}%)</span>
                  <span className="font-medium tabular-nums text-muted-foreground">
                    +{formatCurrency(vatAmount)}
                  </span>
                </div>
                <div className="rounded-lg bg-primary/5 border border-primary/15 px-4 py-3 mt-1">
                  <p className="text-xs text-muted-foreground mb-0.5">Total del gasto</p>
                  <p className="text-3xl font-extrabold tabular-nums text-primary leading-none">
                    {formatCurrency(totalAmount)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">IVA incluido</p>
                </div>
              </div>
              <div className="px-5 pb-5 space-y-2 border-t pt-4">
                {readOnly ? (
                  <>
                    <div className="rounded-lg border border-amber-200 bg-amber-50/60 px-4 py-3 text-sm dark:border-amber-900 dark:bg-amber-950/20">
                      <p className="font-medium text-amber-800 dark:text-amber-300">
                        Solo lectura
                      </p>
                      <p className="text-amber-700/80 dark:text-amber-400/80 text-xs mt-0.5">
                        Tu plan actual no permite editar gastos.
                      </p>
                    </div>
                    <Link href="/dashboard/ajustes/plan" className="block">
                      <Button type="button" className="w-full h-11 font-semibold">
                        Actualizar a PRO
                      </Button>
                    </Link>
                    <Link href="/dashboard/gastos" className="block">
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
                        'Guardar gasto'
                      ) : (
                        'Guardar cambios'
                      )}
                    </Button>
                    <Link href="/dashboard/gastos" className="block">
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
              <p className="font-semibold text-foreground mb-1.5">¿Necesitas adjuntar un documento?</p>
              <p className="text-muted-foreground">
                En la siguiente fase podrás subir tickets, facturas o justificantes a cada gasto.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
