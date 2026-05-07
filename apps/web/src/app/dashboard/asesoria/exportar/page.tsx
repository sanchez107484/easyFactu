'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  ChevronsUpDown,
  Clock,
  Download,
  HelpCircle,
  Loader2,
  RefreshCw,
  Settings2,
  Users,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAgencyContext } from '@/hooks/use-agency-context';
import {
  useAgencyClients,
  useInvoicesForExport,
  useExportInvoices,
  useAgencyPreferredFormat,
  useUpdatePreferredFormat,
} from '@/hooks/use-agency';
import { triggerBlobDownload } from '@/lib/blob-download';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import type { ExportFormat, ExportMode, InvoiceForExport } from '@easyfactura/shared-types';
import { ImportGuideModal } from './_components/import-guide-modal';
import { SOFTWARE_INFO } from './_components/software-info';
import { SoftwareSelectModal } from './_components/software-select-modal';

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Constants ───────────────────────────────────────────────────────────────

const MODE_LABELS: Record<ExportMode, string> = {
  PENDING: 'Sin exportar todavía',
  PERIOD: 'Por período de fechas',
  MANUAL: 'Personalizada',
};

const MODE_DESCRIPTIONS: Record<ExportMode, string> = {
  PENDING: 'Solo facturas que aún no has enviado a contabilidad.',
  PERIOD: 'Facturas confirmadas dentro del rango de fechas elegido.',
  MANUAL: 'Empieza con la lista vacía y elige tú qué incluir.',
};

const DONT_SHOW_GUIDE_KEY = 'export-guide-dismissed';

// ─── Module-level constants (computed once at load, not re-evaluated per render) ─

const TODAY = format(new Date(), 'yyyy-MM-dd');
const FIRST_OF_MONTH = format(
  new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  'yyyy-MM-dd',
);

const QUICK_PERIODS = (() => {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const currentQ = Math.floor(m / 3);
  const quarter = (q: number, yr: number) => ({
    dateFrom: format(new Date(yr, q * 3, 1), 'yyyy-MM-dd'),
    dateTo: format(new Date(yr, q * 3 + 3, 0), 'yyyy-MM-dd'),
  });
  return [
    {
      label: 'Mes actual',
      dateFrom: format(new Date(y, m, 1), 'yyyy-MM-dd'),
      dateTo: format(new Date(y, m + 1, 0), 'yyyy-MM-dd'),
    },
    {
      label: 'Mes anterior',
      dateFrom: format(new Date(y, m - 1, 1), 'yyyy-MM-dd'),
      dateTo: format(new Date(y, m, 0), 'yyyy-MM-dd'),
    },
    { label: `T${currentQ + 1} ${y}`, ...quarter(currentQ, y) },
    currentQ > 0
      ? { label: `T${currentQ} ${y}`, ...quarter(currentQ - 1, y) }
      : { label: `T4 ${y - 1}`, ...quarter(3, y - 1) },
  ];
})();

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ExportarFacturasPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isOnAgencyTenant, isActingAsClient } = useAgencyContext();

  useEffect(() => {
    if (!isOnAgencyTenant && !isActingAsClient) {
      router.replace('/dashboard/asesoria');
    }
  }, [isOnAgencyTenant, isActingAsClient, router]);

  const [selectedClientId, setSelectedClientId] = useState<string>(
    () => searchParams.get('clientId') ?? '',
  );
  const [clientComboOpen, setClientComboOpen] = useState(false);
  const [downloadedFile, setDownloadedFile] = useState<DownloadedFile | null>(null);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [softwareModalOpen, setSoftwareModalOpen] = useState(false);
  const preferredLoadedRef = useRef(false);

  const [config, setConfig] = useState<ExportConfig>({
    format: 'CONTAPLUS' as ExportFormat,
    mode: 'PENDING' as ExportMode,
    dateFrom: '',
    dateTo: '',
    selectedIds: new Set(),
  });

  const patch = (partial: Partial<ExportConfig>) => setConfig((prev) => ({ ...prev, ...partial }));

  // Pre-populate preferred format; open modal if none is set yet
  const { data: preferred, isLoading: preferredLoading } = useAgencyPreferredFormat();
  const { mutate: updatePreferredFormat } = useUpdatePreferredFormat();

  useEffect(() => {
    if (preferredLoading || preferredLoadedRef.current) return;
    preferredLoadedRef.current = true;
    if (preferred?.format) {
      patch({ format: preferred.format });
    } else {
      setSoftwareModalOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferred, preferredLoading]);

  const handleSoftwareConfirm = (fmt: ExportFormat, saveAsDefault: boolean) => {
    patch({ format: fmt });
    if (saveAsDefault) updatePreferredFormat(fmt);
    setSoftwareModalOpen(false);
  };

  // Load clients — only when on the agency tenant
  const { data: clientsData, isLoading: clientsLoading } = useAgencyClients(
    { limit: 500 },
    isOnAgencyTenant,
  );
  const clients = clientsData?.data ?? [];
  const selectedClient = clients.find((c) => c.clientTenantId === selectedClientId);

  // Dates are active when both fields are filled (and the user has not chosen "Sin fechas")
  const useDateFilter = !!config.dateFrom && !!config.dateTo;

  const {
    data: invoicesData,
    isLoading: invoicesLoading,
    error: invoicesError,
    refetch: refetchInvoices,
  } = useInvoicesForExport(
    selectedClientId,
    config.mode,
    useDateFilter ? config.dateFrom : undefined,
    useDateFilter ? config.dateTo : undefined,
    !!selectedClientId,
  );

  const invoices = invoicesData?.invoices ?? [];

  // Pre-selection strategy when invoices or mode changes
  useEffect(() => {
    if (!invoicesData?.invoices) return;
    if (config.mode === 'MANUAL') {
      patch({ selectedIds: new Set() });
    } else {
      patch({ selectedIds: new Set(invoicesData.invoices.map((i) => i.id)) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoicesData?.invoices, config.mode]);

  // Reset selection when client changes
  useEffect(() => {
    patch({ selectedIds: new Set() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClientId]);

  const { mutate: runExport, isPending: exporting } = useExportInvoices(selectedClientId);

  const exportableCount = config.selectedIds.size;

  const handleExport = () => {
    runExport(
      {
        format: config.format,
        mode: 'MANUAL' as ExportMode,
        invoiceIds: Array.from(config.selectedIds),
      },
      {
        onSuccess: ({ blob, filename }: { blob: Blob; filename: string }) => {
          triggerBlobDownload(blob, filename);
          setDownloadedFile({ blob, filename });
          const dismissed = localStorage.getItem(DONT_SHOW_GUIDE_KEY) === '1';
          if (!dismissed) setSuccessModalOpen(true);
        },
      },
    );
  };

  const handleToggleAll = (checked: boolean) => {
    patch({ selectedIds: checked ? new Set(invoices.map((i) => i.id)) : new Set() });
  };

  const handleToggleOne = (id: string, checked: boolean) => {
    setConfig((prev) => {
      const next = new Set(prev.selectedIds);
      if (checked) next.add(id);
      else next.delete(id);
      return { ...prev, selectedIds: next };
    });
  };

  const isPeriodMode = config.mode === 'PERIOD';
  const isNoDate = !config.dateFrom && !config.dateTo;
  const periodMissingDates = isPeriodMode && (!config.dateFrom || !config.dateTo);
  const softwareInfo = SOFTWARE_INFO[config.format];

  const dateStepTitle = isPeriodMode ? 'Período de fechas' : 'Filtrar por fechas (opcional)';
  const dateStepDescription = isPeriodMode
    ? 'Requerido: elige el rango de fechas del período.'
    : 'Acota la lista por fecha. Usa "Sin fechas" para ver todas.';

  const exportButtonHint = !selectedClientId
    ? 'Selecciona un cliente para continuar'
    : periodMissingDates
      ? 'Elige un rango de fechas para exportar'
      : exportableCount === 0
        ? 'Marca al menos una factura'
        : `${exportableCount} seleccionada${exportableCount !== 1 ? 's' : ''} · máx. 200`;

  return (
    <div className="flex flex-col h-full">
      {/* ══ TOP BAR ═══════════════════════════════════════════════════════════ */}
      <div className="flex items-stretch border-b bg-background shrink-0 min-h-[52px]">
        {/* Back + title */}
        <div className="flex items-center gap-3 px-4 shrink-0">
          <Link
            href="/dashboard/asesoria"
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Volver a asesoría"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <span className="font-semibold text-sm whitespace-nowrap">Exportar facturas</span>
        </div>

        <div className="w-px bg-border self-stretch shrink-0" />

        {/* Spacer */}
        <div className="flex-1" />

        {/* Software selector — branded chip */}
        <div className="flex items-center gap-2 px-4 py-2 shrink-0">
          <button
            type="button"
            onClick={() => setSoftwareModalOpen(true)}
            className={cn(
              'flex items-center gap-2.5 px-3 py-1.5 rounded-lg border transition-all',
              'hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              softwareInfo.brandBgSoft,
              softwareInfo.brandBorder,
            )}
            title="Cambiar software de exportación"
          >
            <span
              className={cn(
                'h-6 w-6 rounded text-[10px] font-bold flex items-center justify-center shrink-0',
                softwareInfo.brandBg,
                softwareInfo.brandText,
              )}
            >
              {softwareInfo.initials}
            </span>
            <div className="flex flex-col items-start leading-none gap-0.5">
              <span className="text-[10px] text-muted-foreground">Exportando para</span>
              <span className="text-sm font-semibold">{softwareInfo.name}</span>
            </div>
            <Settings2 className="h-3.5 w-3.5 text-muted-foreground ml-0.5" />
          </button>
          <div className="w-px bg-border self-stretch shrink-0" />
          <button
            type="button"
            onClick={() => setInfoModalOpen(true)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors whitespace-nowrap px-1"
          >
            <HelpCircle className="h-3.5 w-3.5" />
            Cómo importar en {softwareInfo.name}
          </button>
        </div>
      </div>

      {/* ══ MAIN LAYOUT ═══════════════════════════════════════════════════════ */}
      <div className="flex flex-1 overflow-hidden">
        {/* ─── Left sidebar ─── */}
        <aside className="w-[440px] shrink-0 border-r flex flex-col overflow-hidden bg-background">
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-3">
              {/* ── Step 1: client selector ── */}
              <SidebarSection
                step="1"
                title="Cliente"
                description="Selecciona el cliente cuyas facturas quieres exportar."
              >
                {clientsLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : clients.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-4 text-center">
                    <Users className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Aún no tienes clientes.{' '}
                      <Link
                        href="/dashboard/asesoria"
                        className="text-primary underline-offset-2 hover:underline"
                      >
                        Añadir cliente
                      </Link>
                    </p>
                  </div>
                ) : (
                  <Popover open={clientComboOpen} onOpenChange={setClientComboOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={clientComboOpen}
                        className="w-full h-10 px-3 text-sm font-normal justify-between"
                      >
                        <span className="truncate">
                          {selectedClient
                            ? selectedClient.clientTenant.businessName
                            : 'Selecciona un cliente...'}
                        </span>
                        <ChevronsUpDown className="ml-1.5 h-3.5 w-3.5 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[380px] p-0" align="start">
                      <Command
                        filter={(value: string, search: string) =>
                          value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0
                        }
                      >
                        <CommandInput placeholder="Nombre o NIF..." />
                        <CommandList>
                          <CommandEmpty>No se encontró ningún cliente.</CommandEmpty>
                          <CommandGroup>
                            {clients.map((c) => (
                              <CommandItem
                                key={c.clientTenantId}
                                value={`${c.clientTenant.businessName} ${c.clientTenant.nif}`}
                                onSelect={() => {
                                  setSelectedClientId(c.clientTenantId);
                                  setClientComboOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4 shrink-0',
                                    selectedClientId === c.clientTenantId
                                      ? 'opacity-100'
                                      : 'opacity-0',
                                  )}
                                />
                                <div className="min-w-0">
                                  <div className="text-sm font-medium truncate">
                                    {c.clientTenant.businessName}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {c.clientTenant.nif}
                                  </div>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}
              </SidebarSection>

              {/* ── Step 2: what to export ── */}
              <SidebarSection
                step="2"
                title="¿Qué facturas exportar?"
                description="Define el filtro de carga; podrás ajustar la selección en la lista."
              >
                <div className="space-y-2">
                  {(Object.keys(MODE_LABELS) as ExportMode[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        const updates: Partial<ExportConfig> = { mode: m };
                        if (
                          (m === 'PERIOD' || m === 'MANUAL') &&
                          !config.dateFrom &&
                          !config.dateTo
                        ) {
                          updates.dateFrom = FIRST_OF_MONTH;
                          updates.dateTo = TODAY;
                        }
                        patch(updates);
                      }}
                      className={cn(
                        'w-full text-left rounded-lg border-2 p-3 transition-all',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        config.mode === m
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-muted-foreground/40 bg-background',
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={cn(
                            'h-4 w-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors',
                            config.mode === m
                              ? 'border-primary bg-primary'
                              : 'border-muted-foreground/40',
                          )}
                        >
                          {config.mode === m && (
                            <span className="h-1.5 w-1.5 rounded-full bg-white block" />
                          )}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{MODE_LABELS[m]}</div>
                          <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                            {MODE_DESCRIPTIONS[m]}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </SidebarSection>

              {/* ── Step 3: date filter ── */}
              <SidebarSection step="3" title={dateStepTitle} description={dateStepDescription}>
                <div className="space-y-3">
                  {/* Quick chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_PERIODS.map((p) => (
                      <QuickChip
                        key={p.label}
                        label={p.label}
                        icon={<Calendar className="h-3 w-3" />}
                        active={config.dateFrom === p.dateFrom && config.dateTo === p.dateTo}
                        onClick={() => patch({ dateFrom: p.dateFrom, dateTo: p.dateTo })}
                      />
                    ))}
                    {!isPeriodMode && (
                      <QuickChip
                        label="Sin fechas"
                        icon={<XCircle className="h-3 w-3" />}
                        active={isNoDate}
                        onClick={() => patch({ dateFrom: '', dateTo: '' })}
                      />
                    )}
                  </div>

                  {/* Manual date pickers — hidden when "Sin fechas" is active (non-PERIOD) */}
                  {(isPeriodMode || !isNoDate) && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label htmlFor="dateFrom" className="text-xs text-muted-foreground">
                          Desde
                        </Label>
                        <Input
                          id="dateFrom"
                          type="date"
                          value={config.dateFrom}
                          onChange={(e) => patch({ dateFrom: e.target.value })}
                          max={config.dateTo || TODAY}
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="dateTo" className="text-xs text-muted-foreground">
                          Hasta
                        </Label>
                        <Input
                          id="dateTo"
                          type="date"
                          value={config.dateTo}
                          onChange={(e) => patch({ dateTo: e.target.value })}
                          min={config.dateFrom}
                          max={TODAY}
                          className="h-9"
                        />
                      </div>
                    </div>
                  )}

                  {periodMissingDates && (
                    <p className="text-xs text-amber-600 dark:text-amber-500 flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      Introduce un rango de fechas para continuar.
                    </p>
                  )}
                </div>
              </SidebarSection>
            </div>
          </div>

          {/* ─── Footer: export button ─── */}
          <div className="p-4 border-t bg-background shrink-0 space-y-3">
            <Button
              className="w-full h-11 text-sm font-semibold"
              disabled={
                !selectedClientId || exporting || exportableCount === 0 || periodMissingDates
              }
              onClick={handleExport}
            >
              {exporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Exportando...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                  {selectedClientId && exportableCount > 0 ? ` (${exportableCount})` : ''}
                </>
              )}
            </Button>
            <p className="text-xs text-center text-muted-foreground min-h-[1.25rem]">
              {exportButtonHint}
            </p>
          </div>
        </aside>

        {/* ─── Right panel: invoice list ─── */}
        <main className="flex-1 flex flex-col overflow-hidden bg-muted/20">
          {!selectedClientId ? (
            <EmptyClientSelection />
          ) : (
            <InvoicePanel
              clientName={selectedClient?.clientTenant.businessName ?? ''}
              invoices={invoices}
              isLoading={invoicesLoading}
              error={invoicesError}
              selectedIds={config.selectedIds}
              onToggleAll={handleToggleAll}
              onToggleOne={handleToggleOne}
              onRefetch={() => refetchInvoices()}
            />
          )}
        </main>
      </div>

      {/* ═══ Modals ════════════════════════════════════════════════════════════ */}
      <SoftwareSelectModal
        open={softwareModalOpen}
        currentFormat={config.format}
        isFirstTime={preferred?.format === null || preferred?.format === undefined}
        onConfirm={handleSoftwareConfirm}
        onClose={() => setSoftwareModalOpen(false)}
      />
      <ImportGuideModal
        open={successModalOpen}
        format={config.format}
        variant="success"
        downloadedFilename={downloadedFile?.filename ?? null}
        onReDownload={() =>
          downloadedFile && triggerBlobDownload(downloadedFile.blob, downloadedFile.filename)
        }
        onClose={() => setSuccessModalOpen(false)}
        showDontShowAgain
        onDontShowAgain={() => {
          localStorage.setItem(DONT_SHOW_GUIDE_KEY, '1');
          setSuccessModalOpen(false);
        }}
      />
      <ImportGuideModal
        open={infoModalOpen}
        format={config.format}
        variant="info"
        onClose={() => setInfoModalOpen(false)}
      />
    </div>
  );
}

// ─── QuickChip ────────────────────────────────────────────────────────────────

interface QuickChipProps {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}

function QuickChip({ label, icon, active, onClick }: QuickChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border-2 transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        active
          ? 'border-primary bg-primary text-primary-foreground font-semibold shadow-sm'
          : 'border-border bg-background text-foreground hover:border-primary/50 hover:bg-primary/5',
      )}
    >
      {icon}
      {label}
    </button>
  );
}

// ─── Sidebar section wrapper ──────────────────────────────────────────────────

interface SidebarSectionProps {
  step: string;
  title: string | React.ReactNode;
  description?: string;
  children: React.ReactNode;
}

function SidebarSection({ step, title, description, children }: SidebarSectionProps) {
  return (
    <section className="rounded-lg border bg-muted/30 overflow-hidden">
      {/* Header strip */}
      <div className="bg-muted/60 border-b px-4 py-2.5 flex items-start gap-2.5">
        <span className="h-5 w-5 rounded-full bg-primary/15 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-px">
          {step}
        </span>
        <div className="min-w-0">
          <Label className="font-semibold text-sm leading-tight">{title}</Label>
          {description && (
            <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{description}</p>
          )}
        </div>
      </div>
      {/* Content */}
      <div className="p-4">{children}</div>
    </section>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyClientSelection() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
      <div className="h-16 w-16 rounded-full bg-background border flex items-center justify-center shadow-sm">
        <Users className="h-7 w-7 text-muted-foreground" />
      </div>
      <div className="max-w-sm">
        <p className="font-semibold text-foreground">Selecciona un cliente</p>
        <p className="text-sm text-muted-foreground mt-1">
          Elige un cliente en el paso 1 del panel lateral para ver sus facturas.
        </p>
      </div>
    </div>
  );
}

// ─── Invoice panel ────────────────────────────────────────────────────────────

interface InvoicePanelProps {
  clientName: string;
  invoices: InvoiceForExport[];
  isLoading: boolean;
  error: unknown;
  selectedIds: Set<string>;
  onToggleAll: (checked: boolean) => void;
  onToggleOne: (id: string, checked: boolean) => void;
  onRefetch: () => void;
}

function InvoicePanel({
  clientName,
  invoices,
  isLoading,
  error,
  selectedIds,
  onToggleAll,
  onToggleOne,
  onRefetch,
}: InvoicePanelProps) {
  const allSelected = invoices.length > 0 && invoices.every((i) => selectedIds.has(i.id));
  const someSelected = invoices.some((i) => selectedIds.has(i.id));
  const indeterminate = someSelected && !allSelected;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-6 py-3 border-b bg-background flex items-center justify-between shrink-0">
        <div className="min-w-0">
          <span className="font-semibold text-sm truncate block">{clientName}</span>
          {!isLoading && !error && (
            <span className="text-muted-foreground text-xs">
              {invoices.length} factura{invoices.length !== 1 ? 's' : ''} en la lista
              {selectedIds.size > 0 && (
                <>
                  {' · '}
                  <strong className="text-foreground">{selectedIds.size}</strong> seleccionada
                  {selectedIds.size !== 1 ? 's' : ''}
                </>
              )}
            </span>
          )}
        </div>
        {invoices.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            <Checkbox
              id="select-all"
              checked={indeterminate ? 'indeterminate' : allSelected}
              onCheckedChange={(v) => onToggleAll(!!v)}
            />
            <Label htmlFor="select-all" className="text-xs cursor-pointer select-none">
              {allSelected ? 'Deseleccionar todas' : 'Seleccionar todas'}
            </Label>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <InvoiceListSkeleton />
        ) : error ? (
          <InvoiceListError onRetry={onRefetch} />
        ) : invoices.length === 0 ? (
          <InvoiceListEmpty />
        ) : (
          <div className="h-full overflow-y-auto px-3 py-2">
            <div className="space-y-1.5">
              {invoices.map((inv) => (
                <InvoiceRow
                  key={inv.id}
                  invoice={inv}
                  checked={selectedIds.has(inv.id)}
                  onCheckedChange={(v) => onToggleOne(inv.id, v)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Invoice row ──────────────────────────────────────────────────────────────

interface InvoiceRowProps {
  invoice: InvoiceForExport;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

function InvoiceRow({ invoice, checked, onCheckedChange }: InvoiceRowProps) {
  return (
    <label
      className={cn(
        'flex items-center gap-3 rounded-lg border bg-background px-4 py-2.5 cursor-pointer transition-all',
        'hover:border-primary/40 hover:shadow-sm',
        checked
          ? 'border-primary/40 ring-1 ring-primary/20'
          : 'border-border opacity-90 hover:opacity-100',
      )}
    >
      <Checkbox checked={checked} onCheckedChange={(v) => onCheckedChange(!!v)} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-sm font-semibold">{invoice.number ?? '—'}</span>
          <span className="text-muted-foreground text-xs">
            {format(new Date(invoice.issueDate), 'd MMM yyyy', { locale: es })}
          </span>
          <ExportStatusBadge invoice={invoice} />
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{invoice.customerName}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-semibold tabular-nums">
          {invoice.total.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
        </p>
        {invoice.taxTotal > 0 && (
          <p className="text-[10px] text-muted-foreground tabular-nums">
            IVA {invoice.taxTotal.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
          </p>
        )}
      </div>
    </label>
  );
}

// ─── Export status badge ──────────────────────────────────────────────────────

function ExportStatusBadge({ invoice }: { invoice: InvoiceForExport }) {
  if (invoice.lastExportedAt) {
    return (
      <span
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
        title={`Exportada el ${format(new Date(invoice.lastExportedAt), 'd MMM yyyy', { locale: es })}`}
      >
        <CheckCircle2 className="h-2.5 w-2.5" />
        Ya exportada
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
      <Clock className="h-2.5 w-2.5" />
      Sin exportar
    </span>
  );
}

// ─── List states ──────────────────────────────────────────────────────────────

function InvoiceListSkeleton() {
  return (
    <div className="px-3 py-2 space-y-1.5">
      {Array.from({ length: 7 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-lg border bg-background px-4 py-2.5"
        >
          <Skeleton className="h-4 w-4 rounded" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}

function InvoiceListError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-8">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <div>
        <p className="font-medium text-destructive">Error al cargar las facturas</p>
        <p className="text-sm text-muted-foreground mt-1">
          Comprueba tu conexión e inténtalo de nuevo.
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RefreshCw className="h-4 w-4 mr-2" />
        Reintentar
      </Button>
    </div>
  );
}

function InvoiceListEmpty() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-8">
      <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center dark:bg-emerald-950/30">
        <CheckCircle2 className="h-6 w-6 text-emerald-600" />
      </div>
      <div>
        <p className="font-medium">Todo al día</p>
        <p className="text-sm text-muted-foreground mt-1">
          No hay facturas con los criterios seleccionados.
        </p>
      </div>
    </div>
  );
}
