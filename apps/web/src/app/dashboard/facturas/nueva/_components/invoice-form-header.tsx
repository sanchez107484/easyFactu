'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  ChevronDown,
  Save,
  CheckCircle,
  RefreshCw,
  FileCheck,
  FileClock,
  FileText,
  LayoutTemplate,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Frequency, InvoiceTemplate } from '@easyfactura/shared-types';
import { FREQUENCY_OPTIONS } from '@easyfactura/shared-constants';
import type { InvoiceTypeOption } from '@/components/facturas/InvoiceTypeModal';

// ==================== CONSTANTS ====================

const INVOICE_TYPE_CONFIG: Record<
  Exclude<InvoiceTypeOption, 'template'>,
  {
    label: string;
    description: string;
    color: string;
    bg: string;
    border: string;
    hoverBorder: string;
    icon: React.ReactNode;
  }
> = {
  standard: {
    label: 'Factura ordinaria',
    description: 'Oficial con número fiscal',
    color: 'text-invoice-700 dark:text-invoice-400',
    bg: 'bg-invoice-50 dark:bg-invoice-950/40',
    border: 'border-invoice-200 dark:border-invoice-700',
    hoverBorder: 'hover:border-invoice-400 dark:hover:border-invoice-500',
    icon: <FileCheck className="h-4 w-4" />,
  },
  proforma: {
    label: 'Factura proforma',
    description: 'Sin número hasta su conversión',
    color: 'text-proforma-700 dark:text-proforma-400',
    bg: 'bg-proforma-50 dark:bg-proforma-950/40',
    border: 'border-proforma-200 dark:border-proforma-700',
    hoverBorder: 'hover:border-proforma-400 dark:hover:border-proforma-500',
    icon: <FileClock className="h-4 w-4" />,
  },
  simplified: {
    label: 'Factura simplificada',
    description: 'Para operaciones de menor importe',
    color: 'text-invoice-700 dark:text-invoice-400',
    bg: 'bg-invoice-50 dark:bg-invoice-950/40',
    border: 'border-invoice-200 dark:border-invoice-700',
    hoverBorder: 'hover:border-invoice-400 dark:hover:border-invoice-500',
    icon: <FileText className="h-4 w-4" />,
  },
};

// ==================== INVOICE TYPE BADGE ====================

interface InvoiceTypeBadgeProps {
  invoiceType: InvoiceTypeOption;
  selectedTemplate: InvoiceTemplate | null;
  onClick: () => void;
}

function InvoiceTypeBadge({ invoiceType, selectedTemplate, onClick }: InvoiceTypeBadgeProps) {
  const isTemplate = invoiceType === 'template';
  const config = isTemplate
    ? null
    : INVOICE_TYPE_CONFIG[invoiceType as Exclude<InvoiceTypeOption, 'template'>];

  const colorClass = isTemplate ? 'text-agency-700 dark:text-agency-400' : config!.color;
  const bgClass = isTemplate ? 'bg-agency-50 dark:bg-agency-950/40' : config!.bg;
  const borderClass = isTemplate
    ? 'border-agency-200 dark:border-agency-700 hover:border-agency-400'
    : `${config!.border} ${config!.hoverBorder}`;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        group flex items-center gap-2.5 rounded-lg border px-3 py-1.5
        transition-all duration-150 hover:shadow-sm active:scale-[0.98] cursor-pointer
        ${colorClass} ${bgClass} ${borderClass}
      `}
    >
      <span className="shrink-0">
        {isTemplate ? <LayoutTemplate className="h-4 w-4" /> : config!.icon}
      </span>
      <div className="text-left min-w-0">
        <div className="text-xs font-semibold leading-tight whitespace-nowrap">
          {isTemplate && selectedTemplate ? `Plantilla: ${selectedTemplate.name}` : config?.label}
        </div>
        <div className="text-[10px] opacity-60 leading-tight hidden sm:block whitespace-nowrap">
          {isTemplate ? 'Plantilla personalizada' : config?.description}
        </div>
      </div>
      <ChevronDown className="h-3 w-3 opacity-40 group-hover:opacity-70 transition-opacity shrink-0 ml-0.5" />
    </button>
  );
}

// ==================== FORM HEADER ====================

interface InvoiceFormHeaderProps {
  editDraftId?: string;
  isProforma: boolean;
  invoiceType: InvoiceTypeOption;
  selectedTemplate: InvoiceTemplate | null;
  isRecurring: boolean;
  recurringFrequency: Frequency;
  isSubmitting: boolean;
  createMutationPending: boolean;
  updateMutationPending: boolean;
  onTypeClick: () => void;
  onToggleRecurring: () => void;
  onSaveDraft: () => void;
  onConfirmClick: () => void;
}

export function InvoiceFormHeader({
  editDraftId,
  isProforma,
  invoiceType,
  selectedTemplate,
  isRecurring,
  recurringFrequency,
  isSubmitting,
  createMutationPending,
  updateMutationPending,
  onTypeClick,
  onToggleRecurring,
  onSaveDraft,
  onConfirmClick,
}: InvoiceFormHeaderProps) {
  return (
    <div className="flex items-center justify-between px-6 py-3 border-b bg-background shrink-0">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/facturas">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-lg font-bold tracking-tight leading-tight">
            {editDraftId ? (isProforma ? 'Editar proforma' : 'Editar borrador') : 'Nueva factura'}
          </h1>
          <p className="text-xs text-muted-foreground">
            {editDraftId
              ? 'Modifica y guarda o confirma como definitiva.'
              : 'Guardada como borrador hasta que la confirmes.'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Badge de tipo — llamativo y clicable */}
        <InvoiceTypeBadge
          invoiceType={invoiceType}
          selectedTemplate={selectedTemplate}
          onClick={onTypeClick}
        />

        {/* Repetir toggle — sólo en facturas no proforma */}
        {!isProforma && (
          <button
            type="button"
            onClick={onToggleRecurring}
            className={cn(
              'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-150',
              isRecurring
                ? 'border-primary/40 bg-primary/5 text-primary hover:bg-primary/10'
                : 'border-dashed border-muted-foreground/30 text-muted-foreground hover:border-muted-foreground/60 hover:text-foreground',
            )}
          >
            <RefreshCw className="h-3 w-3" />
            {isRecurring
              ? (FREQUENCY_OPTIONS.find((o) => o.value === recurringFrequency)?.label ??
                'Recurrente')
              : 'Hacer recurrente'}
          </button>
        )}

        <div className="w-px h-6 bg-border mx-1 shrink-0" />

        <Button variant="outline" size="sm" onClick={onSaveDraft} disabled={isSubmitting}>
          <Save className="mr-1.5 h-3.5 w-3.5" />
          {createMutationPending || updateMutationPending ? 'Guardando...' : 'Guardar borrador'}
        </Button>
        <Button size="sm" onClick={onConfirmClick} disabled={isSubmitting}>
          <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
          {isProforma ? 'Guardar proforma' : 'Confirmar factura'}
        </Button>
      </div>
    </div>
  );
}
