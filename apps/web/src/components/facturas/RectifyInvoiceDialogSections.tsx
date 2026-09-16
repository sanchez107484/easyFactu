'use client';

import { cn, formatCurrency, formatDateShort } from '@/lib/utils';
import {
  RectificationType,
  type Invoice,
} from '@easyfactura/shared-types';

// ==================== INVOICE SUMMARY ====================

interface InvoiceSummaryProps {
  invoice: Invoice;
}

/**
 * Bloque resumen de la factura a rectificar: fecha, cliente (con NIF) y total.
 */
export function InvoiceSummary({ invoice }: InvoiceSummaryProps) {
  const total = Number(invoice.total);
  const customerName = invoice.customer?.name ?? invoice.customerSnapshotName ?? '—';
  const customerNif = invoice.customer?.nif ?? invoice.customerSnapshotNif ?? null;
  const customerDisplay = customerNif ? `${customerName} · ${customerNif}` : customerName;

  return (
    <div className="rounded-md border bg-muted/30 px-3 py-2.5 text-sm">
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        <Field label="Fecha" value={formatDateShort(invoice.issueDate)} />
        <Field label="Cliente" value={customerDisplay} />
        <Field label="Total original" value={formatCurrency(total)} highlight />
      </div>
    </div>
  );
}

function Field({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p
        className={cn(
          'truncate',
          highlight ? 'font-semibold text-base tabular-nums' : 'font-medium',
        )}
      >
        {value}
      </p>
    </div>
  );
}

// ==================== TYPE SELECTOR ====================

interface RectifyTypeSelectorProps {
  value: RectificationType;
  onChange: (v: RectificationType) => void;
}

/**
 * Selector visual de 2 columnas para elegir entre Sustitución y Abonos.
 * Solo se muestra cuando `typeSelectable` está activo en el modal.
 */
export function RectifyTypeSelector({ value, onChange }: RectifyTypeSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Tipo de rectificación</label>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onChange(RectificationType.SUBSTITUTION)}
          className={cn(
            'rounded-md border p-3 text-left text-sm transition-colors',
            value === RectificationType.SUBSTITUTION
              ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
              : 'border-border hover:border-primary/50',
          )}
        >
          <p className="font-medium">Sustitución</p>
          <p className="text-xs text-muted-foreground mt-1">
            Reemplaza la factura original con los importes corregidos
          </p>
        </button>
        <button
          type="button"
          onClick={() => onChange(RectificationType.DIFFERENCES)}
          className={cn(
            'rounded-md border p-3 text-left text-sm transition-colors',
            value === RectificationType.DIFFERENCES
              ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
              : 'border-border hover:border-primary/50',
          )}
        >
          <p className="font-medium">Abonos</p>
          <p className="text-xs text-muted-foreground mt-1">
            Solo refleja el ajuste (positivo o negativo) respecto a la original
          </p>
        </button>
      </div>
    </div>
  );
}

// ==================== SUBSTITUTION BODY ====================

interface SubstitutionBodyProps {
  invoice: Invoice;
}

/**
 * SUSTITUCIÓN: nº de líneas y total de unidades para que el usuario sepa
 * qué va a poder editar al continuar.
 */
export function SubstitutionBody({ invoice }: SubstitutionBodyProps) {
  const lines = invoice.lines ?? [];
  const lineCount = lines.length;
  const totalQty = lines.reduce((acc, l) => acc + Number(l.quantity), 0);

  return (
    <div className="rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-3 space-y-2">
      <p className="text-xs text-blue-700 dark:text-blue-300">
        <span className="font-medium">Así funciona:</span> Se copiarán las líneas de la factura
        original y podrás modificarlas para reflejar los importes finales corregidos.
      </p>
      <div className="flex items-center gap-4 text-xs text-blue-700 dark:text-blue-300">
        <span>
          <span className="font-semibold">{lineCount}</span> línea{lineCount !== 1 ? 's' : ''}
        </span>
        <span>
          <span className="font-semibold tabular-nums">{totalQty}</span> unidades en total
        </span>
      </div>
      <p className="text-[11px] text-blue-600 dark:text-blue-400">
        Consejo: usa esta opción si los importes correctos son totalmente distintos a los de la
        factura original.
      </p>
    </div>
  );
}

// ==================== ABONO BODY ====================

interface AbonoBodyProps {
  amount: string;
  onAmountChange: (v: string) => void;
  taxRate: number;
  onTaxRateChange: (v: number) => void;
}

/**
 * ABONO: input de importe + selector de IVA.
 */
export function AbonoBody({ amount, onAmountChange, taxRate, onTaxRateChange }: AbonoBodyProps) {
  return (
    <div className="rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 space-y-3">
      <p className="text-xs text-amber-700 dark:text-amber-300">
        <span className="font-medium">Así funciona:</span> indica el importe del ajuste (positivo o
        negativo). Se creará una línea con este importe que podrás editar después.
      </p>
      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2">
          <label htmlFor="rectify-amount" className="text-xs font-medium">
            Importe del ajuste (€)
          </label>
          <input
            id="rectify-amount"
            type="number"
            step="0.01"
            placeholder="-150.00"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <p className="text-[11px] text-muted-foreground mt-1">Negativo = devolución</p>
        </div>
        <div>
          <label htmlFor="rectify-tax" className="text-xs font-medium">
            IVA %
          </label>
          <select
            id="rectify-tax"
            value={taxRate}
            onChange={(e) => onTaxRateChange(Number(e.target.value))}
            className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value={0}>0%</option>
            <option value={4}>4%</option>
            <option value={10}>10%</option>
            <option value={21}>21%</option>
          </select>
        </div>
      </div>
      <p className="text-[11px] text-amber-700 dark:text-amber-400">
        Consejo: usa esta opción si solo necesitas devolver parte del importe o aplicar un descuento
        parcial.
      </p>
    </div>
  );
}

// ==================== REASON FIELD ====================

interface ReasonFieldProps {
  value: string;
  onChange: (v: string) => void;
  isAbono: boolean;
}

/**
 * Campo motivo obligatorio (≥5 chars) compartido por ambos tipos de rectificativa.
 */
export function ReasonField({ value, onChange, isAbono }: ReasonFieldProps) {
  const tooShort = value.length > 0 && value.trim().length < 5;
  return (
    <div>
      <label htmlFor="rectify-reason" className="text-sm font-medium">
        Motivo <span className="text-destructive">*</span>
      </label>
      <textarea
        id="rectify-reason"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={500}
        placeholder={
          isAbono
            ? 'Ej: Devolución parcial de material defectuoso...'
            : 'Ej: Error en base imponible...'
        }
        className={cn(
          'w-full mt-1 min-h-[90px] rounded-md border bg-background px-3 py-2 text-sm',
          tooShort ? 'border-destructive' : 'border-input',
        )}
      />
      <div className="flex items-center justify-between mt-1">
        <p className={cn('text-xs', tooShort ? 'text-destructive' : 'text-muted-foreground')}>
          {tooShort ? 'El motivo debe tener al menos 5 caracteres' : ' '}
        </p>
        <p className="text-xs text-muted-foreground tabular-nums">{value.length}/500</p>
      </div>
    </div>
  );
}

// ==================== FOOTER NOTE ====================

/** Nota informativa fija sobre el comportamiento del borrador. */
export function RectifyFooterNote() {
  return (
    <div className="rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-3">
      <p className="text-xs text-blue-700 dark:text-blue-300">
        <span className="font-medium">Nota:</span> se creará un borrador de factura rectificativa.
        La factura original permanecerá intacta hasta que confirmes la rectificativa. Si eliminas
        el borrador, la original no se verá afectada.
      </p>
    </div>
  );
}
