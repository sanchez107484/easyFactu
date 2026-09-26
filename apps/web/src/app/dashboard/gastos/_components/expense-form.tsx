'use client';

import { useEffect, useRef, useState } from 'react';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Calendar,
  FileText,
  Euro,
  Percent,
  Loader2,
  Receipt,
  User,
  Paperclip,
  Download,
  Trash2,
  Upload,
  Calculator,
  Repeat,
} from 'lucide-react';
import {
  Expense,
  ExpenseCategory,
  Supplier,
  Customer,
  RecurringExpenseFrequency,
} from '@easyfactura/shared-types';
import { TAX_RATE_SELECT_OPTIONS } from '@easyfactura/shared-constants';
import { useExpenseCategories } from '@/hooks/use-expense-categories';
import { useSuppliers } from '@/hooks/use-suppliers';
import { useCustomers } from '@/hooks/use-customers';
import { useRecentCategories } from '@/hooks/use-recent-categories';
import {
  useUploadExpenseAttachment,
  useDeleteExpenseAttachment,
} from '@/hooks/use-expense-attachments';
import { Image } from 'lucide-react';
import { QuickCreateSupplierModal } from '@/components/proveedores/QuickCreateSupplierModal';
import { QuickCreateCustomerModal } from '@/components/clientes/QuickCreateCustomerModal';
import { CustomerCombobox } from '@/components/clientes/CustomerCombobox';
import { SupplierCombobox } from '@/components/ui/supplier-combobox';
import { ExpenseLineItem } from './expense-line-item';
import { round2 } from '@/lib/math';
import { cn } from '@/lib/utils';

const FREQUENCY_LABELS: Record<RecurringExpenseFrequency, string> = {
  [RecurringExpenseFrequency.WEEKLY]: 'Semanal',
  [RecurringExpenseFrequency.MONTHLY]: 'Mensual',
  [RecurringExpenseFrequency.BIMONTHLY]: 'Bimestral',
  [RecurringExpenseFrequency.QUARTERLY]: 'Trimestral',
  [RecurringExpenseFrequency.YEARLY]: 'Anual',
};

const expenseSchema = z.object({
  date: z.string().min(1, 'La fecha es obligatoria'),
  description: z.string().min(2, 'El concepto debe tener al menos 2 caracteres').max(255),
  categoryId: z.string().uuid('Selecciona una categoría'),
  supplierId: z.string().uuid().optional().or(z.literal('')),
  clientId: z.string().uuid().optional().or(z.literal('')),
  baseAmount: z
    .number({ invalid_type_error: 'Introduce un importe válido' })
    .min(0.01, 'La base imponible debe ser mayor que 0'),
  vatRate: z.number().min(0).max(100),
  notes: z.string().max(2000).optional(),
  attachmentId: z.string().uuid().optional().or(z.literal('')),
  isRecurring: z.boolean().optional(),
  recurringFrequency: z.nativeEnum(RecurringExpenseFrequency).optional(),
  recurringDayOfMonth: z.coerce.number().min(1).max(28).optional(),
  recurringStartDate: z.string().optional(),
  recurringEndDate: z.string().optional().nullable(),
});

export type ExpenseFormData = z.infer<typeof expenseSchema>;

interface ExpenseFormProps {
  expense?: Expense | null;
  onSubmit: (data: ExpenseFormData, pendingFile: File | null) => Promise<void>;
  isPending: boolean;
  mode: 'create' | 'edit';
  readOnly?: boolean;
}

function formatCurrency(amount: number) {
  return amount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface AttachmentsSectionProps {
  expenseId?: string;
  attachment?: Expense['attachment'];
  readOnly?: boolean;
  onAttachmentChange: (id: string | null) => void;
  pendingFile: File | null;
  onPendingFileChange: (file: File | null) => void;
}

function AttachmentsSection({
  expenseId,
  attachment,
  readOnly,
  onAttachmentChange,
  pendingFile,
  onPendingFileChange,
}: AttachmentsSectionProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const deleteMutation = useDeleteExpenseAttachment();

  const handleFile = (file: File) => {
    if (file.type.startsWith('image/') && file.type !== 'image/gif') {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
    onPendingFileChange(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    if (e.target.value) e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleRemove = async () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (attachment) {
      await deleteMutation.mutateAsync(attachment.id);
    }
    onPendingFileChange(null);
    onAttachmentChange(null);
  };

  const handleDownload = () => {
    if (!attachment) return;
    window.open(`/api/expense-attachments/${attachment.id}/download`, '_blank');
  };

  const showPreview = previewUrl || (pendingFile && pendingFile.type.startsWith('image/') && pendingFile.type !== 'image/gif');

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
          Adjunto <span className="text-xs text-muted-foreground font-normal">(opcional)</span>
        </Label>
        {!readOnly && !attachment && !pendingFile && (
          <span className="text-xs text-muted-foreground">Imágenes comprimidas al guardar</span>
        )}
      </div>

      {(attachment || pendingFile) ? (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-3">
          {showPreview && previewUrl ? (
            <div className="relative h-12 w-12 shrink-0 rounded-md overflow-hidden border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Preview"
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-primary/10">
              <Paperclip className="h-5 w-5 text-primary" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">
              {pendingFile?.name || attachment?.fileName}
            </p>
            <p className="text-xs text-muted-foreground">
              {pendingFile ? formatFileSize(pendingFile.size) : attachment ? formatFileSize(attachment.size) : ''}
            </p>
            {pendingFile && (
              <p className="text-xs text-primary mt-0.5">Se subirá al guardar</p>
            )}
          </div>
          <div className="flex items-center gap-1">
            {attachment && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={handleDownload}
                title="Descargar"
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
            {!readOnly && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                onClick={handleRemove}
                disabled={deleteMutation.isPending}
                title="Eliminar"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      ) : readOnly ? (
        <p className="text-sm text-muted-foreground italic">Sin adjunto</p>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          className={
            'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-6 transition-colors ' +
            (isDragging
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 bg-muted/30 hover:bg-muted/50')
          }
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <Upload className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">Arrastra un archivo o haz clic para subir</p>
          <p className="text-xs text-muted-foreground">JPG, PNG, WEBP, GIF o PDF (máx. 5MB)</p>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
            onChange={handleInputChange}
          />
        </div>
      )}
    </div>
  );
}

export function ExpenseForm({
  expense,
  onSubmit,
  isPending,
  mode,
  readOnly = false,
}: ExpenseFormProps) {
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
      attachmentId: '',
      isRecurring: false,
      recurringFrequency: RecurringExpenseFrequency.MONTHLY,
      recurringDayOfMonth: 1,
      recurringStartDate: new Date().toISOString().split('T')[0],
      recurringEndDate: null,
    },
  });

  const [baseAmountRaw, setBaseAmountRaw] = useState<string>('');
  const [totalRaw, setTotalRaw] = useState<string>('');
  const [isTotalMode, setIsTotalMode] = useState<boolean>(false);
  const [showQuickCustomer, setShowQuickCustomer] = useState(false);
  const [showQuickSupplier, setShowQuickSupplier] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [draftRestored, setDraftRestored] = useState(false);

  const DRAFT_STORAGE_KEY = `easyfactura_expense_draft_${mode}`;

  const { data: categories, isLoading: isCategoriesLoading } = useExpenseCategories();
  const { data: suppliersData } = useSuppliers({ limit: 500 });
  const { data: customersData } = useCustomers({ limit: 500 });
  const { sortedCategories: sortedCategories, trackUsage: trackCategoryUsage } = useRecentCategories(categories ?? []);

  const suppliers = suppliersData?.data ?? [];
  const customers = customersData?.data ?? [];

  const baseAmount = form.watch('baseAmount') || 0;
  const vatRate = form.watch('vatRate') || 0;
  const isRecurring = form.watch('isRecurring') ?? false;
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
        attachmentId: expense.attachmentId ?? '',
        isRecurring: false,
        recurringFrequency: RecurringExpenseFrequency.MONTHLY,
        recurringDayOfMonth: 1,
        recurringStartDate: new Date().toISOString().split('T')[0],
        recurringEndDate: null,
      });
      setBaseAmountRaw(base > 0 ? formatBaseAmount(base) : '');
      setTotalRaw(base > 0 ? formatTotal(round2(base * (1 + vat / 100))) : '');
    }
  }, [expense, form]);

  useEffect(() => {
    if (isTotalMode) {
      const total = form.getValues('baseAmount') || 0;
      if (total > 0) {
        setBaseAmountRaw(formatBaseAmount(round2(total / (1 + vatRate / 100))));
      }
    } else {
      const base = form.getValues('baseAmount') || 0;
      if (base > 0) {
        setTotalRaw(formatTotal(round2(base * (1 + vatRate / 100))));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vatRate, isTotalMode]);

  useEffect(() => {
    if (mode !== 'create' || draftRestored) return;
    const stored = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (stored) {
      try {
        const draft = JSON.parse(stored);
        const hasValues = draft.date || draft.description || draft.baseAmount;
        if (hasValues) {
          form.reset({
            date: draft.date || new Date().toISOString().split('T')[0],
            description: draft.description || '',
            categoryId: draft.categoryId || '',
            supplierId: draft.supplierId || '',
            clientId: draft.clientId || '',
            baseAmount: draft.baseAmount || 0,
            vatRate: draft.vatRate || 21,
            notes: draft.notes || '',
            attachmentId: draft.attachmentId || '',
            isRecurring: draft.isRecurring || false,
            recurringFrequency: draft.recurringFrequency || RecurringExpenseFrequency.MONTHLY,
            recurringDayOfMonth: draft.recurringDayOfMonth || 1,
            recurringStartDate: draft.recurringStartDate || new Date().toISOString().split('T')[0],
            recurringEndDate: draft.recurringEndDate || null,
          });
          if (draft.baseAmount) {
            setBaseAmountRaw(formatBaseAmount(draft.baseAmount));
            setTotalRaw(formatTotal(round2(draft.baseAmount * (1 + (draft.vatRate || 21) / 100))));
          }
          if (draft.isRecurring) {
            setIsTotalMode(draft.isRecurring);
          }
          setDraftRestored(true);
        }
      } catch {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      }
    }
  }, [form, mode, draftRestored, DRAFT_STORAGE_KEY]);

  useEffect(() => {
    if (mode !== 'create' || !draftRestored) return;
    const subscription = form.watch((values) => {
      const data = {
        date: values.date,
        description: values.description,
        categoryId: values.categoryId,
        supplierId: values.supplierId,
        clientId: values.clientId,
        baseAmount: values.baseAmount,
        vatRate: values.vatRate,
        notes: values.notes,
        attachmentId: values.attachmentId,
        isRecurring: values.isRecurring,
        recurringFrequency: values.recurringFrequency,
        recurringDayOfMonth: values.recurringDayOfMonth,
        recurringStartDate: values.recurringStartDate,
        recurringEndDate: values.recurringEndDate,
        savedAt: Date.now(),
      };
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(data));
    });
    return () => subscription.unsubscribe();
  }, [form, mode, draftRestored, DRAFT_STORAGE_KEY]);

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
    await onSubmit(data, pendingFile);
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  };

  const getNextRecurringDates = () => {
    const frequency = form.watch('recurringFrequency') ?? RecurringExpenseFrequency.MONTHLY;
    const dayOfMonth = form.watch('recurringDayOfMonth') ?? 1;
    const startDate = form.watch('recurringStartDate');
    const endDate = form.watch('recurringEndDate');

    const dates: Date[] = [];
    const today = new Date();
    let current = new Date(today.getFullYear(), today.getMonth(), dayOfMonth);
    if (current < today) {
      current = new Date(today.getFullYear(), today.getMonth() + 1, dayOfMonth);
    }

    const maxIterations = 12;
    let iterations = 0;

    while (dates.length < 3 && iterations < maxIterations) {
      const dateStr = current.toISOString().split('T')[0];
      if (endDate && dateStr > endDate) break;

      if (dateStr >= (startDate || dateStr)) {
        dates.push(new Date(current));
      }

      switch (frequency) {
        case RecurringExpenseFrequency.WEEKLY:
          current = new Date(current.getTime() + 7 * 24 * 60 * 60 * 1000);
          break;
        case RecurringExpenseFrequency.BIMONTHLY:
          current = new Date(current.getFullYear(), current.getMonth() + 2, dayOfMonth);
          break;
        case RecurringExpenseFrequency.QUARTERLY:
          current = new Date(current.getFullYear(), current.getMonth() + 3, dayOfMonth);
          break;
        case RecurringExpenseFrequency.YEARLY:
          current = new Date(current.getFullYear() + 1, current.getMonth(), dayOfMonth);
          break;
        default:
          current = new Date(current.getFullYear(), current.getMonth() + 1, dayOfMonth);
      }
      iterations++;
    }

    return dates;
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPending || readOnly) return;
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName);
      if (isInput) return;

      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        const formEl = document.getElementById('expense-form') as HTMLFormElement;
        if (formEl) formEl.requestSubmit();
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        window.location.href = '/dashboard/gastos';
      }

      if (e.key === 'r' && (e.ctrlKey || e.metaKey) && e.shiftKey) {
        e.preventDefault();
        if (mode === 'create') {
          form.setValue('isRecurring', !isRecurring);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [form, isPending, readOnly, isRecurring, mode]);

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

      <QuickCreateCustomerModal
        open={showQuickCustomer}
        onClose={() => setShowQuickCustomer(false)}
        onCustomerReady={(customer) => {
          form.setValue('clientId', customer.id, { shouldValidate: true });
          setShowQuickCustomer(false);
        }}
      />

      <QuickCreateSupplierModal
        open={showQuickSupplier}
        onClose={() => setShowQuickSupplier(false)}
        onSupplierReady={(supplier) => {
          form.setValue('supplierId', supplier.id, { shouldValidate: true });
          setShowQuickSupplier(false);
        }}
      />

      <form id="expense-form" onSubmit={form.handleSubmit(handleFormSubmit)}>
        {draftRestored && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50/60 dark:border-amber-900 dark:bg-amber-950/20 px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-amber-500" />
              <span className="text-sm text-amber-800 dark:text-amber-300">
                Borrador restaurado de tu última edición
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem(DRAFT_STORAGE_KEY);
                form.reset({
                  date: new Date().toISOString().split('T')[0],
                  description: '',
                  categoryId: '',
                  supplierId: '',
                  clientId: '',
                  baseAmount: 0,
                  vatRate: 21,
                  notes: '',
                  attachmentId: '',
                  isRecurring: false,
                  recurringFrequency: RecurringExpenseFrequency.MONTHLY,
                  recurringDayOfMonth: 1,
                  recurringStartDate: new Date().toISOString().split('T')[0],
                  recurringEndDate: null,
                });
                setBaseAmountRaw('');
                setTotalRaw('');
                setIsTotalMode(false);
                setDraftRestored(false);
              }}
              className="text-xs text-amber-700 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-300 underline bg-transparent border-0 cursor-pointer"
            >
              Descartar
            </button>
          </div>
        )}

        <div className="mb-6">
          <div className="flex items-center justify-between gap-2">
            {[
              { label: 'Concepto', icon: Receipt },
              { label: 'Proveedor', icon: User },
              { label: 'Notas', icon: FileText },
              { label: 'Listo', icon: Calculator },
            ].map((step, i) => {
              const isActive = i === 0;
              const Icon = step.icon;
              return (
                <div key={i} className="flex items-center">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-all",
                      isActive ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground"
                    )}>
                      {isActive ? <Icon className="h-3.5 w-3.5" /> : i + 1}
                    </div>
                    <span className={cn(
                      "text-xs font-medium hidden sm:block",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}>
                      {step.label}
                    </span>
                  </div>
                  {i < 3 && (
                    <div className={cn(
                      "h-px w-8 sm:w-12 mx-2 bg-muted",
                    )} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Date + Concept + Amounts */}
            <div className="rounded-xl border-2 border-primary/20 bg-card shadow-md overflow-hidden ring-1 ring-primary/10">
              <div className="px-6 py-4 border-b bg-primary/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm">
                    <Receipt className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-sm font-semibold">Concepto e importes</h2>
                    <p className="text-xs text-muted-foreground">Describe el gasto y sus importes</p>
                  </div>
                  {!pendingFile && !expense?.attachment && !readOnly && (
                    <button
                      type="button"
                      onClick={() => {
                        const el = document.getElementById('attachment-input');
                        if (el) el.click();
                      }}
                      className="flex items-center gap-1.5 rounded-md border border-dashed border-muted-foreground/30 bg-muted/30 px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted/50 hover:border-muted-foreground/50 transition-colors cursor-pointer"
                    >
                      <Paperclip className="h-3.5 w-3.5" />
                      <span>Adjuntar ticket</span>
                      <input
                        id="attachment-input"
                        ref={(el) => {
                          if (el) {
                            el.onchange = (e) => {
                              const file = (e.target as HTMLInputElement).files?.[0];
                              if (file) {
                                const isImage = file.type.startsWith('image/') && file.type !== 'image/gif';
                                if (isImage) {
                                  setPreviewUrl(URL.createObjectURL(file));
                                }
                                setPendingFile(file);
                              }
                            };
                          }
                        }}
                        type="file"
                        className="hidden"
                        accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                      />
                    </button>
                  )}
                  {pendingFile && (
                    <div className="flex items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1.5 text-xs text-primary">
                      <Image className="h-3.5 w-3.5" />
                      <span className="font-medium">{pendingFile.name}</span>
                    </div>
                  )}
                  {expense?.attachment && !pendingFile && (
                    <div className="flex items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1.5 text-xs text-primary">
                      <Paperclip className="h-3.5 w-3.5" />
                      <span className="font-medium">{expense?.attachment?.fileName}</span>
                    </div>
                  )}
                </div>
                <div className="w-[200px]">
                  <Input
                    id="date"
                    type="date"
                    {...form.register('date')}
                    disabled={isPending || readOnly}
                    className="h-9"
                  />
                  {form.formState.errors.date && (
                    <p className="text-xs text-destructive mt-1">
                      {form.formState.errors.date.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="p-4 space-y-4">
                <ExpenseLineItem
                  form={form}
                  categories={sortedCategories}
                  baseAmountRaw={baseAmountRaw}
                  totalRaw={totalRaw}
                  isTotalMode={isTotalMode}
                  onBaseAmountRawChange={setBaseAmountRaw}
                  onTotalRawChange={setTotalRaw}
                  onIsTotalModeChange={setIsTotalMode}
                  onCategoryChange={trackCategoryUsage}
                  onBaseAmountBlur={() => {
                    const num = parseFloat(baseAmountRaw.replace(',', '.'));
                    if (isNaN(num) || num < 0) {
                      setBaseAmountRaw('');
                      setTotalRaw('');
                      form.setValue('baseAmount', 0, { shouldValidate: true });
                    } else {
                      setBaseAmountRaw(new Intl.NumberFormat('es-ES', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }).format(num));
                      form.setValue('baseAmount', num, { shouldValidate: true });
                      setTotalRaw(new Intl.NumberFormat('es-ES', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }).format(round2(num * (1 + vatRate / 100))));
                    }
                  }}
                  onTotalBlur={() => {
                    const num = parseFloat(totalRaw.replace(',', '.'));
                    if (isNaN(num) || num < 0) {
                      setTotalRaw('');
                      setBaseAmountRaw('');
                      form.setValue('baseAmount', 0, { shouldValidate: true });
                    } else {
                      const calculatedBase = round2(num / (1 + vatRate / 100));
                      const calculatedVat = round2(num - calculatedBase);
                      setTotalRaw(new Intl.NumberFormat('es-ES', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }).format(num));
                      setBaseAmountRaw(new Intl.NumberFormat('es-ES', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }).format(calculatedBase));
                      form.setValue('baseAmount', calculatedBase, { shouldValidate: true });
                    }
                  }}
                  isPending={isPending}
                  readOnly={readOnly}
                />

                {/* Recurring option - inside the concept card */}
                {mode === 'create' && (
                  <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Repeat className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">Gasto recurrente</span>
                      </div>
                      <Switch
                        checked={isRecurring}
                        onCheckedChange={(checked) =>
                          form.setValue('isRecurring', checked)
                        }
                        disabled={isPending || readOnly}
                      />
                    </div>
                    <div className={cn(
                      "overflow-hidden transition-all duration-200 ease-out",
                      isRecurring ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                    )}>
                    {isRecurring && (
                      <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Frecuencia</Label>
                          <Select
                            value={form.watch('recurringFrequency') ?? RecurringExpenseFrequency.MONTHLY}
                            onValueChange={(v) =>
                              form.setValue(
                                'recurringFrequency',
                                v as RecurringExpenseFrequency
                              )
                            }
                            disabled={isPending || readOnly}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(FREQUENCY_LABELS).map(([value, label]) => (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Día del mes</Label>
                          <Select
                            value={String(form.watch('recurringDayOfMonth') ?? 1)}
                            onValueChange={(v) =>
                              form.setValue('recurringDayOfMonth', parseInt(v))
                            }
                            disabled={isPending || readOnly}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                                <SelectItem key={day} value={String(day)}>
                                  Día {day}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Fecha de inicio</Label>
                          <Input
                            id="recurringStartDate"
                            type="date"
                            {...form.register('recurringStartDate')}
                            disabled={isPending || readOnly}
                            className="h-9"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">
                            Fecha de fin{' '}
                            <span className="text-muted-foreground font-normal">(opcional)</span>
                          </Label>
                          <Input
                            id="recurringEndDate"
                            type="date"
                            {...form.register('recurringEndDate')}
                            disabled={isPending || readOnly}
                            className="h-9"
                          />
                        </div>
                      </div>

                      <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-3">
                        <p className="text-xs text-muted-foreground mb-2 font-medium">Próximas facturas:</p>
                        <div className="space-y-1">
                          {getNextRecurringDates().map((date, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                              <Calendar className="h-3.5 w-3.5 text-primary" />
                              <span className="font-medium">
                                {date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      </>
                    )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Supplier + Client */}
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b bg-muted/30">
                <h2 className="text-sm font-semibold">Proveedor y cliente</h2>
                <p className="text-xs text-muted-foreground">Vincula el gasto a un proveedor o cliente (opcional)</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        Proveedor
                      </Label>
                      {!readOnly && (
                        <button
                          type="button"
                          onClick={() => setShowQuickSupplier(true)}
                          className="text-sm text-primary hover:underline bg-transparent border-0 p-0 cursor-pointer"
                        >
                          + Nuevo
                        </button>
                      )}
                    </div>
                    <SupplierCombobox
                      suppliers={suppliers}
                      value={form.watch('supplierId') || ''}
                      onChange={(v) => form.setValue('supplierId', v, { shouldValidate: true })}
                      disabled={isPending || readOnly}
                      placeholder="Selecciona un proveedor"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        Cliente
                      </Label>
                      {!readOnly && (
                        <button
                          type="button"
                          onClick={() => setShowQuickCustomer(true)}
                          className="text-sm text-primary hover:underline bg-transparent border-0 p-0 cursor-pointer"
                        >
                          + Nuevo
                        </button>
                      )}
                    </div>
                    <CustomerCombobox
                      customers={customers}
                      value={form.watch('clientId') || ''}
                      onChange={(v) => form.setValue('clientId', v, { shouldValidate: true })}
                      disabled={isPending || readOnly}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Notes + Attachments */}
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b bg-muted/30">
                <h2 className="text-sm font-semibold">Notas y adjunto</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-sm font-medium flex items-center gap-2">
                    Notas <span className="text-xs text-muted-foreground font-normal">(opcional)</span>
                  </Label>
                  <Textarea
                    id="notes"
                    {...form.register('notes')}
                    placeholder="Añade cualquier información adicional sobre este gasto"
                    rows={2}
                    disabled={isPending || readOnly}
                    className="resize-none text-sm"
                  />
                </div>

                <AttachmentsSection
                  expenseId={expense?.id}
                  attachment={expense?.attachment}
                  readOnly={readOnly}
                  onAttachmentChange={(id) =>
                    form.setValue('attachmentId', id ?? '', { shouldValidate: true })
                  }
                  pendingFile={pendingFile}
                  onPendingFileChange={setPendingFile}
                />
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
                {isRecurring && (
                  <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 mt-1">
                    <p className="text-xs text-primary font-medium">
                      Gasto recurrente ·{' '}
                      {FREQUENCY_LABELS[form.watch('recurringFrequency') ?? RecurringExpenseFrequency.MONTHLY]}
                    </p>
                  </div>
                )}
              </div>
              <div className="px-5 pb-5 space-y-2 border-t pt-4">
                {readOnly ? (
                  <>
                    <div className="rounded-lg border border-amber-200 bg-amber-50/60 px-4 py-3 text-sm dark:border-amber-900 dark:bg-amber-950/20">
                      <p className="font-medium text-amber-800 dark:text-amber-300">
                        Plan PRO requerido
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
                          {pendingFile ? 'Subiendo adjunto...' : 'Guardando...'}
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
          </div>
        </div>
      </form>
    </div>
  );
}
