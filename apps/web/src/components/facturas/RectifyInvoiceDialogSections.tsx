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
          <p className="font-medium">Sustitución completa</p>
          <p className="text-xs text-muted-foreground mt-1">
            Anulas la original y creas una nueva con los datos correctos
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
          <p className="font-medium">Abono / Ajuste de importe</p>
          <p className="text-xs text-muted-foreground mt-1">
            Devuelves dinero al cliente o le cobras un adicional sin cambiar las líneas
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
  const isReagyp = invoice.compensacionPercent != null;

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
      {isReagyp && (
        <div className="rounded-md border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/30 px-3 py-2">
          <div className="flex items-start gap-2">
            <div className="mt-0.5 h-5 w-5 rounded-md bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-purple-700 dark:text-purple-400">RE</span>
            </div>
            <div>
              <p className="text-xs font-medium text-purple-800 dark:text-purple-300">
                Cliente en régimen REAGYP
              </p>
              <p className="text-xs text-purple-700 dark:text-purple-400 mt-0.5">
                La rectificativa heredará la compensación del {invoice.compensacionPercent}% de la factura original.
              </p>
            </div>
          </div>
        </div>
      )}
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
  isReagyp?: boolean;
  compensacionPercent?: number;
}

type AbonoDirection = 'refund' | 'charge';

/**
 * ABONO: input de importe + selector de IVA.
 * El usuario elige la dirección (devolver vs cobrar adicional) y entra un valor positivo.
 * El signo se gestiona internamente.
 */
export function AbonoBody({ amount, onAmountChange, taxRate, onTaxRateChange, isReagyp, compensacionPercent }: AbonoBodyProps) {
  const direction: AbonoDirection = amount === '+' || (amount && parseFloat(amount) > 0)
    ? 'charge'
    : 'refund';
  const rawAmount = amount && amount !== '+' && amount !== '-' ? Math.abs(parseFloat(amount) || 0) : 0;

  const signPrefix = direction === 'refund' ? '−' : '+';
  const signClass = direction === 'refund' ? 'text-destructive' : 'text-secondary-600 dark:text-secondary-400';

  const handleAmountInput = (val: string) => {
    if (val === '' || val === '+' || val === '-') {
      onAmountChange(val);
      return;
    }
    const num = parseFloat(val);
    if (isNaN(num)) {
      onAmountChange('');
    } else {
      const absVal = Math.abs(num);
      onAmountChange(direction === 'refund' ? String(-absVal) : String(absVal));
    }
  };

  return (
    <div className="rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 space-y-3">
      <p className="text-xs text-amber-700 dark:text-amber-300">
        Ajusta el importe de la factura original. Puede ser a tu favor (cobras más) o a favor del cliente (devolución).
      </p>

      {/* Direction toggle */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => {
            const absVal = amount ? Math.abs(parseFloat(amount) || 0) : 0;
            onAmountChange(absVal > 0 ? String(-absVal) : '-');
          }}
          className={cn(
            'rounded-lg border px-3 py-2 text-left transition-all',
            direction === 'refund'
              ? 'border-destructive bg-destructive/5 ring-1 ring-destructive/30'
              : 'border-border hover:border-muted-foreground/40',
          )}
        >
          <div>
            <p className={cn('text-sm font-medium', direction === 'refund' ? 'text-destructive' : 'text-foreground')}>
              Devolver al cliente
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Ej: producto defectuoso, descuento no aplicado</p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => {
            const absVal = amount ? Math.abs(parseFloat(amount) || 0) : 0;
            onAmountChange(absVal > 0 ? String(absVal) : '+');
          }}
          className={cn(
            'rounded-lg border px-3 py-2 text-left transition-all',
            direction === 'charge'
              ? 'border-blue-500 bg-blue-500/5 ring-1 ring-blue-500/30'
              : 'border-border hover:border-muted-foreground/40',
          )}
        >
          <div>
            <p className={cn('text-sm font-medium', direction === 'charge' ? 'text-blue-600 dark:text-blue-400' : 'text-foreground')}>
              Cobrar adicional al cliente
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Ej: error en precio de venta, importe olvidado</p>
          </div>
        </button>
      </div>

      {isReagyp && (
        <div className="rounded-md border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/30 px-3 py-2.5">
          <div className="flex items-start gap-2">
            <div className="mt-0.5 h-5 w-5 rounded-md bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-purple-700 dark:text-purple-400">RE</span>
            </div>
            <div>
              <p className="text-xs font-medium text-purple-800 dark:text-purple-300">
                Cliente en régimen REAGYP
              </p>
              <p className="text-xs text-purple-700 dark:text-purple-400 mt-0.5">
                Este abono llevará la compensación del {compensacionPercent}% en vez de IVA, como la factura original.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className={cn('gap-2', isReagyp ? 'grid grid-cols-1' : 'grid grid-cols-3')}>
        <div className={isReagyp ? '' : 'col-span-2'}>
          <label htmlFor="rectify-amount" className="text-xs font-medium">
            Importe base (€)
          </label>
          <div className="relative mt-1">
            <span className={cn(
              'pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold select-none',
              signClass,
            )}>
              {signPrefix}
            </span>
            <input
              id="rectify-amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="50.00"
              value={rawAmount > 0 ? rawAmount : ''}
              onChange={(e) => handleAmountInput(e.target.value)}
              className="w-full rounded-md border border-input bg-background pl-7 pr-3 py-2 text-sm"
            />
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            {direction === 'refund'
              ? 'Este importe se restará de lo que el cliente te debe'
              : 'Este importe se sumará a lo que el cliente te debe'}
          </p>
        </div>
        {!isReagyp && (
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
        )}
      </div>
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
