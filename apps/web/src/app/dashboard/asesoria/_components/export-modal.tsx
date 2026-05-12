'use client';

import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  CheckCircle2,
  Clock,
  Download,
  AlertCircle,
  Info,
  Loader2,
  X,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { triggerBlobDownload } from '@/lib/blob-download';
import {
  useInvoicesForExport,
  useExportInvoices,
  useAgencyPreferredFormat,
} from '@/hooks/use-agency';
import type { ExportFormat, ExportMode, InvoiceForExport } from '@easyfactura/shared-types';

// ─── Types ───────────────────────────────────────────────────────────────────

type Step = 'config' | 'preview' | 'done';

interface ExportConfig {
  format: ExportFormat;
  mode: ExportMode;
  dateFrom: string;
  dateTo: string;
  selectedIds: Set<string>;
}

interface DownloadedFile {
  blob: Blob;
  filename: string;
}

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientTenantId: string;
  clientName: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const FORMAT_LABELS: Record<ExportFormat, string> = {
  CEGID: 'Cegid Contasimple (.xlsx)',
  CONTAPLUS: 'ContaPlus (.txt)',
  A3CON: 'A3CON (.txt) — Próximamente',
  DIAMACON: 'Diamacon (.xlsx) — Próximamente',
};

const MODE_LABELS: Record<ExportMode, string> = {
  PENDING: 'Pendientes de exportar',
  PERIOD: 'Por período de fechas',
  MANUAL: 'Selección manual',
};

const MODE_DESCRIPTIONS: Record<ExportMode, string> = {
  PENDING: 'Solo las facturas que aún no has exportado para este cliente.',
  PERIOD: 'Todas las facturas confirmadas dentro del rango de fechas elegido.',
  MANUAL: 'Selecciona manualmente qué facturas incluir en la exportación.',
};

// ─── Component ───────────────────────────────────────────────────────────────

export function ExportModal({ open, onOpenChange, clientTenantId, clientName }: ExportModalProps) {
  const { data: preferred } = useAgencyPreferredFormat();

  // Compute "today" and "firstOfMonth" at render time so they're never stale
  const today = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const firstOfMonth = useMemo(
    () => format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'),
    [],
  );

  const [step, setStep] = useState<Step>('config');
  const [config, setConfig] = useState<ExportConfig>({
    format: 'CONTAPLUS' as ExportFormat,
    mode: 'PENDING' as ExportMode,
    dateFrom: firstOfMonth,
    dateTo: today,
    selectedIds: new Set(),
  });
  const [showGuide, setShowGuide] = useState(false);
  // Persists the last downloaded file so the user can re-download if needed
  const [downloadedFile, setDownloadedFile] = useState<DownloadedFile | null>(null);

  // Pre-populate preferred format once loaded
  useEffect(() => {
    const preferredFormat = preferred?.format;
    if (preferredFormat) {
      setConfig((prev) => ({ ...prev, format: preferredFormat }));
    }
  }, [preferred?.format]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setStep('config');
      setShowGuide(false);
      setDownloadedFile(null);
      setConfig((prev) => ({ ...prev, selectedIds: new Set() }));
    }
  }, [open]);

  const previewEnabled =
    step === 'preview' && (config.mode !== 'PERIOD' || (!!config.dateFrom && !!config.dateTo));

  const {
    data: previewData,
    isLoading: previewLoading,
    error: previewError,
  } = useInvoicesForExport(
    clientTenantId,
    config.mode,
    config.mode === 'PERIOD' ? config.dateFrom : undefined,
    config.mode === 'PERIOD' ? config.dateTo : undefined,
    previewEnabled,
  );

  const { mutate: runExport, isPending: exporting } = useExportInvoices(clientTenantId);

  // When mode is MANUAL and preview loads, select all by default
  useEffect(() => {
    if (config.mode === 'MANUAL' && previewData?.invoices) {
      setConfig((prev) => ({
        ...prev,
        selectedIds: new Set(previewData.invoices.map((i) => i.id)),
      }));
    }
  }, [previewData?.invoices, config.mode]);

  const handleGoToPreview = () => setStep('preview');

  const handleExport = () => {
    const invoiceIds = config.mode === 'MANUAL' ? Array.from(config.selectedIds) : undefined;

    runExport(
      {
        format: config.format,
        mode: config.mode,
        dateFrom: config.mode === 'PERIOD' ? config.dateFrom : undefined,
        dateTo: config.mode === 'PERIOD' ? config.dateTo : undefined,
        invoiceIds,
      },
      {
        onSuccess: ({ blob, filename }) => {
          // Trigger download and save blob for potential re-download
          triggerBlobDownload(blob, filename);
          setDownloadedFile({ blob, filename });
          setStep('done');
          const guideShown = localStorage.getItem('export-guide-dismissed');
          if (!guideShown) setShowGuide(true);
        },
      },
    );
  };

  const handleToggleAll = (checked: boolean) => {
    setConfig((prev) => ({
      ...prev,
      selectedIds: checked ? new Set(previewData?.invoices.map((i) => i.id) ?? []) : new Set(),
    }));
  };

  const handleToggleOne = (id: string, checked: boolean) => {
    setConfig((prev) => {
      const next = new Set(prev.selectedIds);
      checked ? next.add(id) : next.delete(id);
      return { ...prev, selectedIds: next };
    });
  };

  // For PERIOD mode show totalCount (all invoices in range will be exported, even if already exported).
  // For PENDING mode show pendingCount. For MANUAL show selected count.
  const exportableCount =
    config.mode === 'MANUAL'
      ? config.selectedIds.size
      : config.mode === 'PERIOD'
        ? (previewData?.totalCount ?? 0)
        : (previewData?.pendingCount ?? previewData?.totalCount ?? 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-lg">
            Exportar facturas —{' '}
            <span className="text-muted-foreground font-normal">{clientName}</span>
          </DialogTitle>
          <StepIndicator step={step} />
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {step === 'config' && (
            <ConfigStep
              config={config}
              today={today}
              onChange={(patch) => setConfig((prev) => ({ ...prev, ...patch }))}
            />
          )}
          {step === 'preview' && (
            <PreviewStep
              invoices={previewData?.invoices ?? []}
              isLoading={previewLoading}
              error={previewError}
              mode={config.mode}
              selectedIds={config.selectedIds}
              onToggleAll={handleToggleAll}
              onToggleOne={handleToggleOne}
            />
          )}
          {step === 'done' && (
            <DoneStep
              showGuide={showGuide}
              downloadedFile={downloadedFile}
              onDismissGuide={() => {
                setShowGuide(false);
                localStorage.setItem('export-guide-dismissed', '1');
              }}
            />
          )}
        </div>

        <div className="px-6 py-4 border-t flex items-center justify-between gap-3">
          {step === 'done' ? (
            <>
              <span className="text-sm text-muted-foreground">
                El archivo se ha descargado automáticamente.
              </span>
              <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
            </>
          ) : step === 'preview' ? (
            <>
              <Button variant="outline" onClick={() => setStep('config')} disabled={exporting}>
                Atrás
              </Button>
              <Button onClick={handleExport} disabled={exporting || exportableCount === 0}>
                {exporting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Exportando...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar {exportableCount > 0 ? `(${exportableCount})` : ''}
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={handleGoToPreview}>Continuar</Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: Step }) {
  const steps: { key: Step; label: string }[] = [
    { key: 'config', label: 'Configurar' },
    { key: 'preview', label: 'Revisar' },
    { key: 'done', label: 'Descargado' },
  ];
  const currentIndex = steps.findIndex((s) => s.key === step);

  return (
    <div className="flex items-center gap-2 mt-2">
      {steps.map((s, i) => (
        <div key={s.key} className="flex items-center gap-2">
          <div
            className={cn(
              'h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium',
              i < currentIndex && 'bg-primary text-primary-foreground',
              i === currentIndex && 'bg-primary text-primary-foreground ring-2 ring-primary/30',
              i > currentIndex && 'bg-muted text-muted-foreground',
            )}
          >
            {i < currentIndex ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
          </div>
          <span
            className={cn(
              'text-xs',
              i === currentIndex ? 'text-foreground font-medium' : 'text-muted-foreground',
            )}
          >
            {s.label}
          </span>
          {i < steps.length - 1 && <div className="h-px w-6 bg-border" />}
        </div>
      ))}
    </div>
  );
}

// ─── Step 1: Config ───────────────────────────────────────────────────────────

interface ConfigStepProps {
  config: ExportConfig;
  today: string;
  onChange: (patch: Partial<ExportConfig>) => void;
}

function ConfigStep({ config, today, onChange }: ConfigStepProps) {
  // Quick-period shortcuts — useful for quarterly VAT filing workflows
  const quickPeriods = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth(); // 0-indexed
    const currentQ = Math.floor(m / 3); // 0=Q1, 1=Q2, 2=Q3, 3=Q4

    const quarter = (q: number, yr: number) => ({
      dateFrom: format(new Date(yr, q * 3, 1), 'yyyy-MM-dd'),
      dateTo: format(new Date(yr, q * 3 + 3, 0), 'yyyy-MM-dd'),
    });

    const prevMonthDate = new Date(y, m - 1, 1);
    const prevMonth = {
      dateFrom: format(prevMonthDate, 'yyyy-MM-dd'),
      dateTo: format(new Date(y, m, 0), 'yyyy-MM-dd'),
    };

    // Show current quarter + previous quarter + previous month
    const shortcuts = [{ label: `T${currentQ + 1} ${y}`, ...quarter(currentQ, y) }];
    if (currentQ > 0) {
      shortcuts.push({ label: `T${currentQ} ${y}`, ...quarter(currentQ - 1, y) });
    } else {
      shortcuts.push({ label: `T4 ${y - 1}`, ...quarter(3, y - 1) });
    }
    shortcuts.push({ label: 'Mes anterior', ...prevMonth });

    return shortcuts;
  }, []);
  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-5 space-y-6">
        {/* Format */}
        <div className="space-y-2">
          <Label>Software de contabilidad</Label>
          <Select
            value={config.format}
            onValueChange={(v) => onChange({ format: v as ExportFormat })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(FORMAT_LABELS) as ExportFormat[]).map((f) => (
                <SelectItem key={f} value={f} disabled={f !== 'CONTAPLUS'}>
                  {FORMAT_LABELS[f]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Mode */}
        <div className="space-y-2">
          <Label>¿Qué facturas quieres exportar?</Label>
          <div className="grid grid-cols-1 gap-2">
            {(Object.keys(MODE_LABELS) as ExportMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => onChange({ mode: m })}
                className={cn(
                  'text-left rounded-lg border p-3 transition-colors',
                  config.mode === m
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-muted-foreground/40',
                )}
              >
                <div className="font-medium text-sm">{MODE_LABELS[m]}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{MODE_DESCRIPTIONS[m]}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Date range (only for PERIOD) */}
        {config.mode === 'PERIOD' && (
          <div className="space-y-3">
            {/* Quick-select shortcuts */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Selección rápida</Label>
              <div className="flex flex-wrap gap-1.5">
                {quickPeriods.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => onChange({ dateFrom: p.dateFrom, dateTo: p.dateTo })}
                    className={cn(
                      'text-xs px-2.5 py-1 rounded-md border transition-colors',
                      config.dateFrom === p.dateFrom && config.dateTo === p.dateTo
                        ? 'border-primary bg-primary/10 text-primary font-medium'
                        : 'border-border hover:border-muted-foreground/40 text-muted-foreground',
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateFrom">Desde</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={config.dateFrom}
                  onChange={(e) => onChange({ dateFrom: e.target.value })}
                  max={config.dateTo || today}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateTo">Hasta</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={config.dateTo}
                  onChange={(e) => onChange({ dateTo: e.target.value })}
                  min={config.dateFrom}
                  max={today}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Step 2: Preview ──────────────────────────────────────────────────────────

interface PreviewStepProps {
  invoices: InvoiceForExport[];
  isLoading: boolean;
  error?: unknown;
  mode: ExportMode;
  selectedIds: Set<string>;
  onToggleAll: (checked: boolean) => void;
  onToggleOne: (id: string, checked: boolean) => void;
}

function PreviewStep({
  invoices,
  isLoading,
  error,
  mode,
  selectedIds,
  onToggleAll,
  onToggleOne,
}: PreviewStepProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-3 text-center px-6">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <div>
          <p className="font-medium text-destructive">Error al cargar las facturas</p>
          <p className="text-sm text-muted-foreground mt-1">
            Comprueba tu conexión y vuelve atrás para intentarlo de nuevo.
          </p>
        </div>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-2 text-center px-6">
        <CheckCircle2 className="h-8 w-8 text-emerald-500" />
        <p className="font-medium">Todo al día</p>
        <p className="text-sm text-muted-foreground">
          No hay facturas pendientes de exportar con los criterios seleccionados.
        </p>
      </div>
    );
  }

  // In PERIOD mode: count invoices already exported previously so we can warn the user
  const alreadyExportedCount =
    mode === 'PERIOD' ? invoices.filter((i) => !!i.lastExportedAt).length : 0;

  const allSelected = invoices.every((i) => selectedIds.has(i.id));

  return (
    <div className="flex flex-col h-full">
      {/* Already-exported warning for PERIOD mode */}
      {alreadyExportedCount > 0 && (
        <div className="px-6 py-2.5 bg-amber-50 border-b border-amber-200 flex items-center gap-2 text-amber-800 dark:bg-amber-950/20 dark:border-amber-800/50 dark:text-amber-400">
          <Info className="h-3.5 w-3.5 shrink-0" />
          <p className="text-xs">
            {alreadyExportedCount === 1
              ? '1 factura ya fue exportada anteriormente y se incluirá de nuevo.'
              : `${alreadyExportedCount} facturas ya fueron exportadas anteriormente y se incluirán de nuevo.`}
          </p>
        </div>
      )}

      {/* Summary bar */}
      <div className="px-6 py-3 bg-muted/40 border-b flex items-center justify-between">
        <span className="text-sm">
          <strong>{invoices.length}</strong> factura{invoices.length !== 1 ? 's' : ''}
          {mode === 'MANUAL' && (
            <>
              {' '}
              — <strong>{selectedIds.size}</strong> seleccionada{selectedIds.size !== 1 ? 's' : ''}
            </>
          )}
        </span>
        {mode === 'MANUAL' && (
          <div className="flex items-center gap-2">
            <Checkbox
              id="select-all"
              checked={allSelected}
              onCheckedChange={(v) => onToggleAll(!!v)}
            />
            <Label htmlFor="select-all" className="text-sm cursor-pointer">
              Seleccionar todas
            </Label>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="divide-y">
          {invoices.map((inv) => (
            <InvoicePreviewRow
              key={inv.id}
              invoice={inv}
              showCheckbox={mode === 'MANUAL'}
              checked={selectedIds.has(inv.id)}
              onCheckedChange={(v) => onToggleOne(inv.id, v)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface InvoicePreviewRowProps {
  invoice: InvoiceForExport;
  showCheckbox: boolean;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

function InvoicePreviewRow({
  invoice,
  showCheckbox,
  checked,
  onCheckedChange,
}: InvoicePreviewRowProps) {
  const isExported = !!invoice.lastExportedAt;

  return (
    <div
      className={cn('flex items-center gap-3 px-6 py-3', showCheckbox && !checked && 'opacity-60')}
    >
      {showCheckbox && <Checkbox checked={checked} onCheckedChange={(v) => onCheckedChange(!!v)} />}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-medium">{invoice.number ?? '—'}</span>
          <span className="text-muted-foreground text-xs">
            {format(new Date(invoice.issueDate), 'd MMM yyyy', { locale: es })}
          </span>
        </div>
        <p className="text-xs text-muted-foreground truncate">{invoice.customerName}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-medium">
          {invoice.total.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
        </p>
        {isExported ? (
          <span className="text-xs text-emerald-600 flex items-center justify-end gap-1">
            <CheckCircle2 className="h-3 w-3" />
            {format(new Date(invoice.lastExportedAt!), 'd MMM', { locale: es })}
          </span>
        ) : (
          <span className="text-xs text-amber-600 flex items-center justify-end gap-1">
            <Clock className="h-3 w-3" />
            Pendiente
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Step 3: Done ─────────────────────────────────────────────────────────────

interface DoneStepProps {
  showGuide: boolean;
  onDismissGuide: () => void;
  downloadedFile: DownloadedFile | null;
}

function DoneStep({ showGuide, onDismissGuide, downloadedFile }: DoneStepProps) {
  return (
    <div className="px-6 py-6 space-y-4">
      <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
        <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-emerald-900">Exportación completada</p>
          <p className="text-sm text-emerald-700">
            El archivo se ha descargado a tu carpeta de descargas.
          </p>
        </div>
        {downloadedFile && (
          <button
            type="button"
            onClick={() => triggerBlobDownload(downloadedFile.blob, downloadedFile.filename)}
            className="shrink-0 flex items-center gap-1.5 text-xs text-emerald-700 hover:text-emerald-900 transition-colors"
            title="Volver a descargar el archivo"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Volver a descargar
          </button>
        )}
      </div>

      {showGuide && (
        <div className="border rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-muted/40 border-b">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-sm">Cómo importar en ContaPlus</span>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDismissGuide}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          <ol className="divide-y">
            {CONTAPLUS_STEPS.map((step, i) => (
              <li key={i} className="flex items-start gap-3 px-4 py-3">
                <span className="h-5 w-5 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="text-sm">{step}</span>
              </li>
            ))}
          </ol>
          <div className="px-4 py-3 border-t bg-muted/20">
            <button
              onClick={onDismissGuide}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              No mostrar de nuevo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const CONTAPLUS_STEPS = [
  'Abre ContaPlus y ve a Archivo → Importar → Facturas emitidas.',
  'Selecciona el archivo descargado (.txt) desde tu carpeta de descargas.',
  'Verifica el mapeo de campos: Fecha, Número, NIF, Base imponible, Cuota IVA.',
  'Confirma la importación. ContaPlus generará los asientos automáticamente.',
];
