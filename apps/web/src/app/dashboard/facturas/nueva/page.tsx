'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
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
import { ArrowLeft, Plus, Trash2, AlertCircle, Save, CheckCircle } from 'lucide-react';
import { useCreateInvoice, useConfirmInvoice } from '@/hooks/use-invoices';
import { useCustomers } from '@/hooks/use-customers';
import { useDefaultTemplate } from '@/hooks/use-invoice-templates';
import { useAuthStore } from '@/store/auth-store';
import {
  PaymentMethod,
  Invoice,
  InvoiceStatus,
  Customer,
  InvoiceTemplate,
} from '@easyfactura/shared-types';
import { InvoiceTypeModal, InvoiceTypeOption } from '@/components/facturas/InvoiceTypeModal';
import { ConfirmInvoiceDialog } from '@/components/facturas/ConfirmInvoiceDialog';
import { LiveInvoicePreview } from '@/components/facturas/LiveInvoicePreview';

// ==================== SCHEMA ====================

const lineSchema = z.object({
  description: z.string().min(2, 'Minimo 2 caracteres').max(500, 'Maximo 500 caracteres'),
  quantity: z.number({ invalid_type_error: 'Requerido' }).positive('Debe ser mayor a 0'),
  unitPrice: z.number({ invalid_type_error: 'Requerido' }).min(0, 'No puede ser negativo'),
  taxRate: z.number({ invalid_type_error: 'Requerido' }),
  productId: z.string().optional(),
});

const formSchema = z.object({
  customerId: z.string().min(1, 'Selecciona un cliente'),
  issueDate: z.string().min(1, 'La fecha es obligatoria'),
  dueDate: z.string().optional(),
  discountPercent: z.number().min(0).max(100).optional(),
  irpfPercent: z.number().min(0).max(100).optional(),
  paymentMethod: z.nativeEnum(PaymentMethod).optional(),
  notes: z.string().max(1000, 'Maximo 1000 caracteres').optional(),
  lines: z.array(lineSchema).min(1, 'Añade al menos una línea').max(50),
});

type FormData = z.infer<typeof formSchema>;

// ==================== CONSTANTS ====================

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  [PaymentMethod.BANK_TRANSFER]: 'Transferencia bancaria',
  [PaymentMethod.DIRECT_DEBIT]: 'Domiciliacion bancaria',
  [PaymentMethod.CARD]: 'Tarjeta',
  [PaymentMethod.CASH]: 'Efectivo',
  [PaymentMethod.PAYPAL]: 'PayPal',
  [PaymentMethod.OTHER]: 'Otro',
};

// ==================== HELPERS ====================

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function buildPreviewInvoice(data: Partial<FormData>, customers: Customer[]): Invoice {
  const today = new Date().toISOString();
  const lines = data.lines ?? [];
  const customer = customers.find((c) => c.id === data.customerId);

  const subtotal = round2(
    lines.reduce((acc, l) => acc + round2((l.quantity ?? 0) * (l.unitPrice ?? 0)), 0),
  );
  const discountAmount = data.discountPercent ? round2(subtotal * (data.discountPercent / 100)) : 0;
  const subtotalAfterDiscount = round2(subtotal - discountAmount);
  const discFactor = subtotal > 0 ? subtotalAfterDiscount / subtotal : 1;

  const taxTotal = round2(
    lines.reduce((acc, l) => {
      const base = round2((l.quantity ?? 0) * (l.unitPrice ?? 0));
      return acc + round2(base * discFactor * ((l.taxRate ?? 0) / 100));
    }, 0),
  );
  const irpfTotal = data.irpfPercent
    ? round2(subtotalAfterDiscount * (data.irpfPercent / 100))
    : null;
  const total = round2(subtotalAfterDiscount + taxTotal - (irpfTotal ?? 0));

  const previewLines = lines.map((l, i) => {
    const lineSubtotal = round2((l.quantity ?? 0) * (l.unitPrice ?? 0));
    return {
      id: `preview-${i}`,
      tenantId: '',
      invoiceId: 'preview',
      productId: l.productId ?? null,
      description: l.description || '',
      quantity: l.quantity ?? 0,
      unitPrice: l.unitPrice ?? 0,
      subtotal: lineSubtotal,
      taxRate: l.taxRate ?? 0,
      taxAmount: round2(lineSubtotal * ((l.taxRate ?? 0) / 100)),
      lineTotal: round2(lineSubtotal * (1 + (l.taxRate ?? 0) / 100)),
      sortOrder: i,
      createdAt: today,
      updatedAt: today,
    };
  });

  return {
    id: 'preview',
    tenantId: '',
    seriesId: '',
    customerId: data.customerId ?? '',
    number: '---',
    issueDate: data.issueDate || today.split('T')[0],
    dueDate: data.dueDate ?? null,
    status: InvoiceStatus.DRAFT,
    subtotal,
    discountPercent: data.discountPercent ?? null,
    discountAmount,
    taxTotal,
    irpfPercent: data.irpfPercent ?? null,
    irpfTotal,
    total,
    paymentMethod: data.paymentMethod ?? null,
    notes: data.notes ?? null,
    pdfUrl: null,
    verifactuHash: null,
    verifactuPrevHash: null,
    verifactuStatus: null,
    verifactuQr: null,
    verifactuSentAt: null,
    verifactuResponse: null,
    isRectificative: false,
    rectifiedInvoiceId: null,
    rectificationReason: null,
    createdAt: today,
    updatedAt: today,
    customer: customer,
    lines: previewLines,
  };
}

function scrollToField(fieldId: string): void {
  const el = document.getElementById(`field-${fieldId}`);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  const focusable = el.querySelector<HTMLElement>('input, select, textarea');
  if (focusable) {
    setTimeout(() => focusable.focus(), 300);
  }
}

function buildCreateInput(data: FormData) {
  return {
    customerId: data.customerId,
    issueDate: data.issueDate,
    dueDate: data.dueDate || undefined,
    discountPercent: data.discountPercent || undefined,
    irpfPercent: data.irpfPercent || undefined,
    paymentMethod: data.paymentMethod,
    notes: data.notes,
    lines: data.lines.map((l) => ({
      description: l.description,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      taxRate: l.taxRate,
      productId: l.productId,
    })),
  };
}

// ==================== PAGE ====================

export default function NuevaFacturaPage() {
  const router = useRouter();
  const currentTenant = useAuthStore((s) => s.currentTenant);

  const [invoiceType, setInvoiceType] = useState<InvoiceTypeOption | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<InvoiceTemplate | null>(null);

  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingDraftId, setPendingDraftId] = useState<string | null>(null);

  const [activeSection, setActiveSection] = useState<string | null>(null);

  const { data: customersData, isLoading: loadingCustomers } = useCustomers();
  const { data: defaultTemplate } = useDefaultTemplate();
  const createMutation = useCreateInvoice();
  const confirmMutation = useConfirmInvoice();

  const customers = customersData?.data ?? [];
  const effectiveTemplate: InvoiceTemplate | null = selectedTemplate ?? defaultTemplate ?? null;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      issueDate: new Date().toISOString().split('T')[0],
      lines: [{ description: '', quantity: 1, unitPrice: 0, taxRate: 21 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'lines',
  });

  const watchedValues = form.watch();
  const previewInvoice = buildPreviewInvoice(watchedValues, customers);
  const selectedCustomer = customers.find((c) => c.id === watchedValues.customerId);

  // ==================== HANDLERS ====================

  const handleTypeSelect = useCallback((type: InvoiceTypeOption, template?: InvoiceTemplate) => {
    setInvoiceType(type);
    if (template) setSelectedTemplate(template);
    setShowTypeModal(false);
  }, []);

  const handlePreviewSectionClick = useCallback((fieldId: string) => {
    setActiveSection(fieldId);
    scrollToField(fieldId);
  }, []);

  const handleSaveDraft = async (data: FormData) => {
    const invoice = await createMutation.mutateAsync(buildCreateInput(data));
    router.push(`/dashboard/facturas/${invoice.id}`);
  };

  const handleConfirmClick = async () => {
    const isValid = await form.trigger();
    if (!isValid) return;
    setShowConfirmDialog(true);
  };

  const handleConfirmDialogConfirm = async () => {
    const data = form.getValues();

    let draftId = pendingDraftId;
    if (!draftId) {
      const draft = await createMutation.mutateAsync(buildCreateInput(data));
      draftId = draft.id;
      setPendingDraftId(draftId);
    }

    const confirmed = await confirmMutation.mutateAsync(draftId);
    setShowConfirmDialog(false);
    router.push(`/dashboard/facturas/${confirmed.id}`);
  };

  const isSubmitting = createMutation.isPending || confirmMutation.isPending;

  // ==================== RENDER ====================

  return (
    <>
      {/* Modal para elegir tipo de factura al entrar o al cambiar */}
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
        {/* Page header */}
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
            {/* Selector de tipo de factura visible */}
            <Button
              variant="outline"
              size="sm"
              className="mr-2"
              onClick={() => setShowTypeModal(true)}
            >
              Tipo: {invoiceType?.label ?? '---'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={form.handleSubmit(handleSaveDraft)}
              disabled={isSubmitting}
            >
              <Save className="mr-1.5 h-3.5 w-3.5" />
              {createMutation.isPending ? 'Guardando...' : 'Guardar borrador'}
            </Button>
            <Button size="sm" onClick={handleConfirmClick} disabled={isSubmitting}>
              <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
              Confirmar factura
            </Button>
          </div>
        </div>

        {/* Split panel */}
        <div className="flex flex-1 overflow-hidden">
          {/* LEFT -- Form (60%) */}
          <div className="w-[60%] overflow-y-auto px-6 py-5 space-y-5 border-r">
            <form onSubmit={form.handleSubmit(handleSaveDraft)} noValidate>
              {/* Section: customer + dates + payment */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Datos generales</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Customer */}
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
                        value={watchedValues.customerId ?? ''}
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
                              {c.name} -- {c.nif}
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

                  {/* Dates */}
                  <section
                    id="field-issueDate"
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                    onFocus={() => setActiveSection('issueDate')}
                  >
                    <div className="space-y-2">
                      <Label htmlFor="issueDate">
                        Fecha emision <span className="text-destructive">*</span>
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

                  {/* Payment method */}
                  <section
                    id="field-paymentMethod"
                    className="space-y-2"
                    onFocus={() => setActiveSection('paymentMethod')}
                  >
                    <Label>Metodo de pago</Label>
                    <Select
                      value={watchedValues.paymentMethod ?? ''}
                      onValueChange={(v) => form.setValue('paymentMethod', v as PaymentMethod)}
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
                  </section>
                </CardContent>
              </Card>

              {/* Section: invoice lines */}
              <Card className="mt-5">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Lineas de factura</CardTitle>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        append({ description: '', quantity: 1, unitPrice: 0, taxRate: 21 })
                      }
                    >
                      <Plus className="mr-1.5 h-4 w-4" />
                      Añadir linea
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
                              Linea {index + 1}
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
                              Descripcion <span className="text-destructive">*</span>
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

              {/* Section: Discounts & IRPF */}
              <Card className="mt-5">
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
                      <Label htmlFor="irpfPercent">Retencion IRPF (%)</Label>
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

              {/* Section: Notes */}
              <Card className="mt-5 mb-5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Notas</CardTitle>
                </CardHeader>
                <CardContent>
                  <section id="field-notes" onFocus={() => setActiveSection('notes')}>
                    <Textarea
                      {...form.register('notes')}
                      placeholder="Informacion adicional para el cliente..."
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
            />
          </div>
        </div>
      </div>
    </>
  );
}
