'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Plus, Trash2, AlertCircle, Save, CheckCircle, Copy } from 'lucide-react';
import { useCreateInvoice, useConfirmInvoice, useInvoice } from '@/hooks/use-invoices';
import { useCustomers } from '@/hooks/use-customers';
import { useDefaultTemplate } from '@/hooks/use-invoice-templates';
import { useAuthStore } from '@/store/auth-store';
import { PaymentMethod, Customer, InvoiceTemplate } from '@easyfactura/shared-types';
import { getPaymentDetailFields } from '@/lib/payment-method-details';
import { buildPreviewInvoice, buildCreateInput } from '@/lib/invoice-helpers';
import { round2 } from '@/lib/math';
import { InvoiceTypeModal, InvoiceTypeOption } from '@/components/facturas/InvoiceTypeModal';
import { ConfirmInvoiceDialog } from '@/components/facturas/ConfirmInvoiceDialog';
import { LiveInvoicePreview } from '@/components/facturas/LiveInvoicePreview';
import type { PaymentDetails } from '@/components/facturas/LiveInvoicePreview';
import { Path } from 'react-hook-form';

// ==================== CONSTANTS ====================

const INVOICE_TYPE_LABELS: Record<Exclude<InvoiceTypeOption, 'template'>, string> = {
  standard: 'Factura ordinaria',
  proforma: 'Factura proforma',
  simplified: 'Factura simplificada',
};

const PAYMENT_METHOD_LABELS: Record<PaymentMethod | 'BIZUM', string> = {
  [PaymentMethod.BANK_TRANSFER]: 'Transferencia bancaria',
  [PaymentMethod.DIRECT_DEBIT]: 'Domiciliación bancaria',
  [PaymentMethod.CARD]: 'Tarjeta',
  [PaymentMethod.CASH]: 'Efectivo',
  [PaymentMethod.PAYPAL]: 'PayPal',
  [PaymentMethod.OTHER]: 'Otro',
  BIZUM: 'Bizum',
};

const PAYMENT_METHOD_SECTION_LABELS: Record<PaymentMethod | 'BIZUM', string> = {
  [PaymentMethod.BANK_TRANSFER]: 'Datos para la transferencia',
  [PaymentMethod.DIRECT_DEBIT]: 'Domiciliación bancaria',
  [PaymentMethod.CARD]: 'Pago con tarjeta',
  [PaymentMethod.CASH]: 'Pago en efectivo',
  [PaymentMethod.PAYPAL]: 'Datos PayPal',
  [PaymentMethod.OTHER]: 'Instrucciones de pago',
  BIZUM: 'Datos Bizum',
};

const EMPTY_DEFAULT_VALUES = {
  customerId: '',
  paymentMethod: undefined as PaymentMethod | undefined,
  paymentDetails: {} as Record<string, string | undefined>,
  issueDate: new Date().toISOString().split('T')[0],
  dueDate: undefined as string | undefined,
  discountPercent: undefined as number | undefined,
  irpfPercent: undefined as number | undefined,
  notes: undefined as string | undefined,
  lines: [{ description: '', quantity: 1, unitPrice: 0, taxRate: 21 }],
};

// ==================== SCHEMA ====================

const lineSchema = z.object({
  description: z.string().min(2, 'Mínimo 2 caracteres').max(500, 'Máximo 500 caracteres'),
  quantity: z.number({ invalid_type_error: 'Requerido' }).positive('Debe ser mayor a 0'),
  unitPrice: z.number({ invalid_type_error: 'Requerido' }).min(0, 'No puede ser negativo'),
  taxRate: z.number({ invalid_type_error: 'Requerido' }),
  productId: z.string().optional(),
});

const paymentDetailsSchema = z
  .object({
    iban: z.string().optional(),
    bic: z.string().optional(),
    accountHolder: z.string().optional(),
    bizumPhone: z.string().optional(),
    paypalEmail: z.string().optional(),
    paymentNote: z.string().max(300, 'Máximo 300 caracteres').optional(),
  })
  .optional();

const formSchema = z.object({
  customerId: z.string().min(1, 'Selecciona un cliente'),
  issueDate: z.string().min(1, 'La fecha es obligatoria'),
  dueDate: z.string().optional(),
  discountPercent: z.number().min(0).max(100).optional(),
  irpfPercent: z.number().min(0).max(100).optional(),
  paymentMethod: z.nativeEnum(PaymentMethod).optional(),
  paymentDetails: paymentDetailsSchema,
  notes: z.string().max(1000, 'Máximo 1000 caracteres').optional(),
  lines: z.array(lineSchema).min(1, 'Añade al menos una línea').max(50),
});

type FormData = z.infer<typeof formSchema>;

// ==================== INNER FORM COMPONENT ====================
// FIX: separamos el formulario en un componente hijo que recibe los defaultValues
// ya resueltos. Así useForm() se inicializa UNA SOLA VEZ con los datos correctos,
// evitando el problema de los Select de Radix que no reaccionan a form.reset().

interface InvoiceFormProps {
  defaultValues: FormData;
  isDuplicate: boolean;
  sourceNumber?: string;
}

function InvoiceForm({ defaultValues, isDuplicate, sourceNumber }: InvoiceFormProps) {
  const router = useRouter();
  const currentTenant = useAuthStore((s) => s.currentTenant);

  const [invoiceType, setInvoiceType] = useState<InvoiceTypeOption | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<InvoiceTemplate | null>(null);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [pendingDraftId, setPendingDraftId] = useState<string | null>(null);

  const { data: customersData, isLoading: loadingCustomers } = useCustomers();
  const { data: defaultTemplate } = useDefaultTemplate();
  const createMutation = useCreateInvoice();
  const confirmMutation = useConfirmInvoice();

  const customers: Customer[] = customersData?.data ?? [];
  const effectiveTemplate: InvoiceTemplate | null = selectedTemplate ?? defaultTemplate ?? null;

  // FIX: useForm se inicializa con los defaultValues ya resueltos (vacíos o del duplicado)
  // No se llama a form.reset() en ningún efecto posterior
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'lines',
  });

  const watchedValues = form.watch();
  const previewInvoice = buildPreviewInvoice(watchedValues, customers);
  const selectedCustomer = customers.find((c) => c.id === watchedValues.customerId);
  const activePaymentMethod = watchedValues.paymentMethod as PaymentMethod | 'BIZUM' | undefined;

  // ==================== HANDLERS ====================

  const handleTypeSelect = useCallback((type: InvoiceTypeOption, template?: InvoiceTemplate) => {
    setInvoiceType(type);
    setSelectedTemplate(type === 'template' && template ? template : null);
    setShowTypeModal(false);
  }, []);

  const handlePreviewSectionClick = useCallback((fieldId: string) => {
    setActiveSection(fieldId);
    const el = document.getElementById(`field-${fieldId}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  const triggerSubmit = () => {
    const submitBtn = document.getElementById('form-submit-trigger');
    if (submitBtn) {
      (submitBtn as HTMLButtonElement).click();
    } else {
      form.handleSubmit(handleSaveDraft, onInvalid)();
    }
  };

  const onInvalid = (errors: any) => {
    const missingFields: string[] = [];
    if (errors.customerId) missingFields.push('Cliente');
    if (errors.issueDate) missingFields.push('Fecha');
    if (errors.lines) missingFields.push('Líneas de factura');
    toast.error(
      missingFields.length > 0
        ? `Faltan campos: ${missingFields.join(', ')}`
        : 'Revisa los campos obligatorios marcados en rojo',
    );
  };

  const handleSaveDraft = async (data: FormData) => {
    try {
      const invoice = await createMutation.mutateAsync(buildCreateInput(data));
      router.push(`/dashboard/facturas/${invoice.id}`);
    } catch (error) {
      console.error(error);
    }
  };

  const handleConfirmClick = async () => {
    const isValid = await form.trigger();
    if (!isValid) {
      toast.error('Rellena todos los campos obligatorios antes de confirmar.');
      return;
    }
    setShowConfirmDialog(true);
  };

  const handleConfirmDialogConfirm = async () => {
    const data = form.getValues();
    let draftId = pendingDraftId;
    try {
      if (!draftId) {
        const draft = await createMutation.mutateAsync(buildCreateInput(data));
        draftId = draft.id;
        setPendingDraftId(draftId);
      }
      if (draftId) {
        await confirmMutation.mutateAsync(draftId);
        setShowConfirmDialog(false);
        router.push(`/dashboard/facturas/${draftId}`);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const isSubmitting = createMutation.isPending || confirmMutation.isPending;

  // ==================== RENDER ====================

  return (
    <>
      <InvoiceTypeModal open={invoiceType === null || showTypeModal} onSelect={handleTypeSelect} />

      <ConfirmInvoiceDialog
        open={showConfirmDialog}
        onCancel={() => setShowConfirmDialog(false)}
        onConfirm={handleConfirmDialogConfirm}
        isPending={isSubmitting}
        summary={{
          customerName: selectedCustomer?.name ?? '---',
          total: previewInvoice.total,
        }}
      />

      <div className="flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-3 border-b bg-background shrink-0">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/facturas">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-bold tracking-tight leading-tight">Nueva factura</h1>
              <p className="text-xs text-muted-foreground">
                Guardada como borrador hasta que la confirmes.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="mr-2"
              onClick={() => setShowTypeModal(true)}
            >
              Tipo:{' '}
              {invoiceType === 'template' && selectedTemplate
                ? `Plantilla: ${selectedTemplate.name}`
                : invoiceType
                  ? INVOICE_TYPE_LABELS[invoiceType as Exclude<InvoiceTypeOption, 'template'>]
                  : '---'}
            </Button>
            <Button variant="outline" size="sm" onClick={triggerSubmit} disabled={isSubmitting}>
              <Save className="mr-1.5 h-3.5 w-3.5" />
              {createMutation.isPending ? 'Guardando...' : 'Guardar borrador'}
            </Button>
            <Button size="sm" onClick={handleConfirmClick} disabled={isSubmitting}>
              <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
              Confirmar factura
            </Button>
          </div>
        </div>

        {/* ── Split panel ── */}
        <div className="flex flex-1 overflow-hidden">
          {/* LEFT -- Form (60%) */}
          <div className="w-[60%] overflow-y-auto px-6 py-5 space-y-5 border-r">
            {/* Banner de duplicado */}
            {isDuplicate && sourceNumber && (
              <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/40 px-4 py-3">
                <Copy className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    Duplicando factura {sourceNumber}
                  </p>
                  <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-0.5">
                    Los datos se han copiado de la factura original. La fecha de emisión se ha
                    actualizado a hoy. Revisa y confirma antes de guardar.
                  </p>
                </div>
              </div>
            )}

            <form
              onSubmit={form.handleSubmit(handleSaveDraft, onInvalid)}
              noValidate
              className="space-y-5"
            >
              <button type="submit" id="form-submit-trigger" className="hidden" />

              {/* ── Datos generales ── */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Datos generales</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Cliente */}
                  <section
                    id="field-customerId"
                    className="space-y-2"
                    onFocus={() => setActiveSection('customerId')}
                  >
                    <Label>
                      Cliente <span className="text-destructive">*</span>
                    </Label>
                    {loadingCustomers ? (
                      <Skeleton className="h-10 w-full" />
                    ) : (
                      <Select
                        value={watchedValues.customerId || ''}
                        onValueChange={(v) =>
                          form.setValue('customerId', v, { shouldValidate: true })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un cliente" />
                        </SelectTrigger>
                        <SelectContent>
                          {customers.length === 0 && (
                            <div className="p-3 text-sm text-muted-foreground flex gap-2 items-start">
                              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                              No tienes clientes activos. Crea uno primero.
                            </div>
                          )}
                          {customers.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name} — {c.nif}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
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
                  </section>

                  {/* Fechas */}
                  <section
                    id="field-issueDate"
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                    onFocus={() => setActiveSection('issueDate')}
                  >
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
                      <Label htmlFor="dueDate">Fecha vencimiento</Label>
                      <Input id="dueDate" type="date" {...form.register('dueDate')} />
                    </div>
                  </section>

                  {/* Método de pago */}
                  <section
                    id="field-paymentMethod"
                    className="space-y-3"
                    onFocus={() => setActiveSection('paymentMethod')}
                  >
                    <Label>Método de pago</Label>
                    <Select
                      value={activePaymentMethod || ''}
                      onValueChange={(v) => {
                        form.setValue('paymentMethod', v as PaymentMethod);
                        // Solo limpiar detalles si cambia el método (no en la carga inicial)
                        if (v !== defaultValues.paymentMethod) {
                          form.setValue('paymentDetails', {});
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sin especificar" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {activePaymentMethod && (
                      <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {PAYMENT_METHOD_SECTION_LABELS[activePaymentMethod]}
                        </p>

                        {activePaymentMethod === PaymentMethod.CASH && (
                          <p className="text-sm text-muted-foreground">
                            💡 Recuerda: la normativa española limita los pagos en efectivo a{' '}
                            <strong>1.000 €</strong> entre empresarios y autónomos (2.500 € con
                            particulares).
                          </p>
                        )}

                        {activePaymentMethod === PaymentMethod.BANK_TRANSFER && (
                          <>
                            <div className="space-y-1.5">
                              <Label htmlFor="iban" className="text-sm">
                                IBAN
                              </Label>
                              <Input
                                id="iban"
                                placeholder="ES91 2100 0418 4502 0005 1332"
                                className="font-mono text-sm tracking-wider"
                                value={watchedValues.paymentDetails?.iban ?? ''}
                                onChange={(e) => {
                                  const raw = e.target.value.replace(/\s/g, '').toUpperCase();
                                  const formatted = raw.match(/.{1,4}/g)?.join(' ') ?? raw;
                                  form.setValue('paymentDetails.iban', formatted, {
                                    shouldDirty: true,
                                  });
                                }}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1.5">
                                <Label className="text-sm">Titular de la cuenta</Label>
                                <Input
                                  placeholder="Nombre Apellidos / Empresa S.L."
                                  {...form.register('paymentDetails.accountHolder')}
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-sm">
                                  BIC/SWIFT{' '}
                                  <span className="text-muted-foreground font-normal">
                                    (pagos internacionales)
                                  </span>
                                </Label>
                                <Input
                                  placeholder="CAIXESBBXXX"
                                  className="font-mono text-sm"
                                  {...form.register('paymentDetails.bic')}
                                />
                              </div>
                            </div>
                          </>
                        )}

                        {activePaymentMethod !== PaymentMethod.BANK_TRANSFER &&
                          activePaymentMethod !== PaymentMethod.CASH &&
                          getPaymentDetailFields(activePaymentMethod).map((field) => {
                            const fieldPath = `paymentDetails.${field.key}` as Path<FormData>;
                            return (
                              <div key={field.key} className="space-y-1.5">
                                <Label className="text-sm">
                                  {field.label}
                                  {field.helperText && (
                                    <span className="text-muted-foreground font-normal ml-1">
                                      {field.helperText}
                                    </span>
                                  )}
                                </Label>
                                {field.type === 'textarea' ? (
                                  <Textarea
                                    placeholder={field.placeholder}
                                    rows={2}
                                    {...form.register(fieldPath)}
                                  />
                                ) : (
                                  <Input
                                    type={
                                      field.type === 'email'
                                        ? 'email'
                                        : field.type === 'tel'
                                          ? 'tel'
                                          : 'text'
                                    }
                                    placeholder={field.placeholder}
                                    className={field.inputProps?.className}
                                    {...form.register(fieldPath)}
                                  />
                                )}
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </section>
                </CardContent>
              </Card>

              {/* ── Líneas de factura ── */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Líneas de factura</CardTitle>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        append({ description: '', quantity: 1, unitPrice: 0, taxRate: 21 })
                      }
                    >
                      <Plus className="mr-1.5 h-4 w-4" />
                      Añadir línea
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div id="field-lines-section">
                    {form.formState.errors.lines?.root && (
                      <p className="text-sm text-destructive mb-2">
                        {form.formState.errors.lines.root.message}
                      </p>
                    )}
                    {fields.map((field, index) => {
                      const line = watchedValues.lines?.[index];
                      const lineSubtotal = round2((line?.quantity ?? 0) * (line?.unitPrice ?? 0));
                      return (
                        <div
                          key={field.id}
                          className="p-4 border rounded-lg space-y-3 bg-muted/20"
                          onFocus={() => setActiveSection('lines-section')}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">
                              Línea {index + 1}
                            </span>
                            {fields.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => remove(index)}
                                className="h-7 w-7 p-0"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                          <div className="space-y-1">
                            <Label>
                              Descripción <span className="text-destructive">*</span>
                            </Label>
                            <Textarea
                              {...form.register(`lines.${index}.description`)}
                              placeholder="Producto o servicio..."
                              rows={2}
                            />
                            {form.formState.errors.lines?.[index]?.description && (
                              <p className="text-xs text-destructive">
                                {form.formState.errors.lines[index]?.description?.message}
                              </p>
                            )}
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1">
                              <Label>Cantidad</Label>
                              <Input
                                type="number"
                                step="0.0001"
                                min="0.0001"
                                {...form.register(`lines.${index}.quantity`, {
                                  valueAsNumber: true,
                                })}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label>Precio EUR</Label>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                {...form.register(`lines.${index}.unitPrice`, {
                                  valueAsNumber: true,
                                })}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label>IVA %</Label>
                              <Select
                                value={form.watch(`lines.${index}.taxRate`)?.toString() ?? '21'}
                                onValueChange={(v) =>
                                  form.setValue(`lines.${index}.taxRate`, parseFloat(v), {
                                    shouldValidate: true,
                                  })
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
                          <div className="text-right text-sm text-muted-foreground">
                            Subtotal:{' '}
                            <span className="font-semibold text-foreground">
                              {lineSubtotal.toLocaleString('es-ES', {
                                style: 'currency',
                                currency: 'EUR',
                              })}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* ── Descuentos y retenciones ── */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Descuentos y retenciones</CardTitle>
                </CardHeader>
                <CardContent>
                  <section
                    id="field-discountPercent"
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                    onFocus={() => setActiveSection('discountPercent')}
                  >
                    <div className="space-y-2">
                      <Label htmlFor="discountPercent">Descuento global (%)</Label>
                      <Input
                        id="discountPercent"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        placeholder="0"
                        {...form.register('discountPercent', {
                          setValueAs: (v) => (v === '' ? undefined : Number(v)),
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="irpfPercent">Retención IRPF (%)</Label>
                      <Input
                        id="irpfPercent"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        placeholder="0 (15% general)"
                        {...form.register('irpfPercent', {
                          setValueAs: (v) => (v === '' ? undefined : Number(v)),
                        })}
                      />
                    </div>
                  </section>
                </CardContent>
              </Card>

              {/* ── Notas ── */}
              <Card className="mb-5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Notas</CardTitle>
                </CardHeader>
                <CardContent>
                  <section id="field-notes" onFocus={() => setActiveSection('notes')}>
                    <Textarea
                      {...form.register('notes')}
                      placeholder="Información adicional para el cliente..."
                      rows={3}
                    />
                  </section>
                </CardContent>
              </Card>
            </form>
          </div>

          {/* RIGHT -- Live preview (40%) */}
          <div className="w-[40%] flex flex-col overflow-hidden">
            <LiveInvoicePreview
              invoice={previewInvoice}
              template={effectiveTemplate}
              tenant={currentTenant}
              activeFieldSection={activeSection}
              onSectionClick={handlePreviewSectionClick}
              paymentDetails={watchedValues.paymentDetails as PaymentDetails | undefined}
            />
          </div>
        </div>
      </div>
    </>
  );
}

// ==================== PAGE (shell) ====================
// FIX: la página solo espera a que los datos del duplicado estén listos
// y luego renderiza el formulario con los defaultValues correctos.
// Esto garantiza que useForm() se inicialice una sola vez con los datos completos.

export default function NuevaFacturaPage() {
  const searchParams = useSearchParams();
  const duplicateId = searchParams.get('duplicate');

  const { data: sourceInvoice, isLoading: loadingSource } = useInvoice(duplicateId ?? '', {
    enabled: !!duplicateId,
  });

  // Mientras cargamos la factura a duplicar, mostramos loading
  if (duplicateId && loadingSource) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center flex-col gap-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <p className="text-muted-foreground animate-pulse">Cargando datos de la factura...</p>
      </div>
    );
  }

  // FIX: calculamos los defaultValues UNA VEZ aquí, antes de montar InvoiceForm.
  // De este modo useForm() los recibe en la inicialización, no en un reset posterior.
  const defaultValues: FormData = sourceInvoice
    ? {
        customerId: sourceInvoice.customerId ?? '',
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: undefined,
        discountPercent: sourceInvoice.discountPercent
          ? Number(sourceInvoice.discountPercent)
          : undefined,
        irpfPercent: sourceInvoice.irpfPercent ? Number(sourceInvoice.irpfPercent) : undefined,
        paymentMethod: (sourceInvoice.paymentMethod as PaymentMethod) ?? undefined,
        // paymentDetails viene como objeto del backend pero no está en el tipo Invoice
        paymentDetails: (sourceInvoice as any).paymentDetails ?? {},
        notes: sourceInvoice.notes || undefined,
        lines: (sourceInvoice.lines ?? []).map((l) => ({
          description: l.description ?? '',
          quantity: Number(l.quantity) || 1,
          unitPrice: Number(l.unitPrice) || 0,
          taxRate: Number(l.taxRate) || 0,
          productId: l.productId ?? undefined,
        })),
      }
    : { ...EMPTY_DEFAULT_VALUES };

  return (
    <InvoiceForm
      defaultValues={defaultValues}
      isDuplicate={!!duplicateId}
      sourceNumber={sourceInvoice?.number}
    />
  );
}
