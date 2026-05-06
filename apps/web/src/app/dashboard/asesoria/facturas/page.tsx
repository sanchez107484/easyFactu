'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, FileText, LogIn, Search, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { InvoiceStatusBadge } from '@/components/common/invoice-status-badge';
import { PaymentStatusBadge } from '@/components/common/payment-status-badge';

import { useAllClientsInvoices, useAgencyClients } from '@/hooks/use-agency';
import { useAgencyContext } from '@/hooks/use-agency-context';
import { useSwitchTenant } from '@/hooks/use-switch-tenant';
import { useDebounce } from '@/hooks/use-debounce';
import { formatCurrency } from '@/lib/utils';

import { InvoiceStatus, PaymentStatus, type AgencyInvoicesQuery } from '@easyfactura/shared-types';

const ALL_VALUE = '__all__';

interface KpiItem {
  label: string;
  value: string;
  hint?: string;
}

function KpiCard({ label, value, hint }: KpiItem) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-bold leading-tight tabular-nums">{value}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export default function AgencyInvoicesPage() {
  const router = useRouter();
  const { isOnAgencyTenant, isActingAsClient, returnToAgency } = useAgencyContext();
  const { switchTenant, isPending: isSwitching } = useSwitchTenant();

  // ─── Filter state ───────────────────────────────────────────────────────
  const [clientTenantId, setClientTenantId] = useState<string>(ALL_VALUE);
  const [status, setStatus] = useState<string>(ALL_VALUE);
  const [paymentStatus, setPaymentStatus] = useState<string>(ALL_VALUE);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [searchInput, setSearchInput] = useState<string>('');
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [switchingId, setSwitchingId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(searchInput, 350);

  // Reset to page 1 whenever any filter changes
  useEffect(() => {
    setPage(1);
  }, [
    clientTenantId,
    status,
    paymentStatus,
    dateFrom,
    dateTo,
    debouncedSearch,
    minAmount,
    maxAmount,
  ]);

  // ─── Auto-return-to-agency on mount if landed while acting as client ────
  const mountedActingAsClient = useRef(isActingAsClient);
  const mountedOnAgencyTenant = useRef(isOnAgencyTenant);
  useEffect(() => {
    if (mountedActingAsClient.current) {
      returnToAgency();
    } else if (!mountedOnAgencyTenant.current) {
      router.replace('/dashboard');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const query: AgencyInvoicesQuery = useMemo(() => {
    const min = minAmount.trim() === '' ? undefined : Number(minAmount);
    const max = maxAmount.trim() === '' ? undefined : Number(maxAmount);
    return {
      clientTenantId: clientTenantId === ALL_VALUE ? undefined : clientTenantId,
      status: status === ALL_VALUE ? undefined : (status as InvoiceStatus),
      paymentStatus: paymentStatus === ALL_VALUE ? undefined : (paymentStatus as PaymentStatus),
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      search: debouncedSearch.trim() || undefined,
      minAmount: Number.isFinite(min) ? min : undefined,
      maxAmount: Number.isFinite(max) ? max : undefined,
      page,
      limit: 10,
      sortBy: 'issueDate',
      sortDir: 'desc',
    };
  }, [
    clientTenantId,
    status,
    paymentStatus,
    dateFrom,
    dateTo,
    debouncedSearch,
    minAmount,
    maxAmount,
    page,
  ]);

  const { data: clientsData } = useAgencyClients(undefined, isOnAgencyTenant);
  const { data, isLoading, error } = useAllClientsInvoices(query, isOnAgencyTenant);

  if (!isOnAgencyTenant) return null;

  const handleSwitchToClient = async (targetTenantId: string) => {
    if (switchingId) return;
    setSwitchingId(targetTenantId);
    try {
      await switchTenant(targetTenantId);
      router.push('/dashboard/facturas');
    } catch {
      toast.error('No se pudo acceder al cliente. Inténtalo de nuevo.');
      setSwitchingId(null);
    }
  };

  const clearFilters = () => {
    setClientTenantId(ALL_VALUE);
    setStatus(ALL_VALUE);
    setPaymentStatus(ALL_VALUE);
    setDateFrom('');
    setDateTo('');
    setSearchInput('');
    setMinAmount('');
    setMaxAmount('');
  };

  const summary = data?.summary;
  const meta = data?.meta;
  const rows = data?.data ?? [];

  const hasActiveFilters =
    clientTenantId !== ALL_VALUE ||
    status !== ALL_VALUE ||
    paymentStatus !== ALL_VALUE ||
    dateFrom !== '' ||
    dateTo !== '' ||
    searchInput !== '' ||
    minAmount !== '' ||
    maxAmount !== '';

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Facturas de clientes</h1>
        <p className="mt-1 text-muted-foreground">
          Vista consolidada de todas las facturas emitidas por los clientes que gestionas.
        </p>
      </div>

      {/* KPI strip */}
      <KpiStrip summary={summary} isLoading={isLoading} />

      {/* Filters */}
      <div className="rounded-xl border bg-card p-4">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Buscar</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Nº factura, cliente, NIF, destinatario..."
                className="pl-9"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Cliente</label>
            <Select value={clientTenantId} onValueChange={setClientTenantId}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>Todos los clientes</SelectItem>
                {clientsData?.data?.map((rel) => (
                  <SelectItem key={rel.clientTenantId} value={rel.clientTenantId}>
                    {rel.clientTenant.businessName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Estado</label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>Todos</SelectItem>
                <SelectItem value={InvoiceStatus.CONFIRMED}>Confirmadas</SelectItem>
                <SelectItem value={InvoiceStatus.SENT}>Enviadas</SelectItem>
                <SelectItem value={InvoiceStatus.PAID}>Pagadas</SelectItem>
                <SelectItem value={InvoiceStatus.RECTIFIED}>Rectificadas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Cobro</label>
            <Select value={paymentStatus} onValueChange={setPaymentStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>Todos</SelectItem>
                <SelectItem value={PaymentStatus.UNPAID}>Pendientes de cobro</SelectItem>
                <SelectItem value={PaymentStatus.PARTIALLY_PAID}>Cobro parcial</SelectItem>
                <SelectItem value={PaymentStatus.PAID}>Cobradas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Desde</label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Hasta</label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Importe mínimo
            </label>
            <Input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              placeholder="0,00"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Importe máximo
            </label>
            <Input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
              placeholder="0,00"
            />
          </div>
        </div>

        {hasActiveFilters && (
          <div className="mt-3 flex justify-end">
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="mr-1.5 h-3.5 w-3.5" />
              Limpiar filtros
            </Button>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="rounded-xl border bg-card">
        {isLoading ? (
          <TableSkeleton />
        ) : error ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Error al cargar las facturas. Inténtalo de nuevo.
          </div>
        ) : rows.length === 0 ? (
          <EmptyState hasActiveFilters={hasActiveFilters} onClearFilters={clearFilters} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Número</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Destinatario</TableHead>
                    <TableHead className="text-right">Base</TableHead>
                    <TableHead className="text-right">IVA</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Cobro</TableHead>
                    <TableHead className="w-[80px] text-center text-xs">Acceder</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell>
                        <div className="font-medium">{inv.client.businessName}</div>
                        <div className="text-xs text-muted-foreground">{inv.client.nif}</div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{inv.number ?? '—'}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm">
                        {new Date(inv.issueDate).toLocaleDateString('es-ES')}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[180px] truncate text-sm">{inv.customer.name}</div>
                        <div className="text-xs text-muted-foreground">{inv.customer.nif}</div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right tabular-nums text-sm">
                        {formatCurrency(inv.subtotal)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right tabular-nums text-sm">
                        {formatCurrency(inv.taxTotal)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right font-semibold tabular-nums">
                        {formatCurrency(inv.total)}
                      </TableCell>
                      <TableCell>
                        <InvoiceStatusBadge status={inv.status} />
                      </TableCell>
                      <TableCell>
                        <PaymentStatusBadge status={inv.paymentStatus} />
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleSwitchToClient(inv.client.tenantId)}
                          disabled={isSwitching || switchingId === inv.client.tenantId}
                          title="Acceder como este cliente"
                        >
                          <LogIn className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
                <p className="text-muted-foreground">
                  Página <span className="font-medium text-foreground">{meta.page}</span> de{' '}
                  <span className="font-medium text-foreground">{meta.totalPages}</span> ·{' '}
                  {meta.total} factura{meta.total === 1 ? '' : 's'}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={meta.page <= 1}
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                    disabled={meta.page >= meta.totalPages}
                  >
                    Siguiente
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function KpiStrip({
  summary,
  isLoading,
}: {
  summary:
    | {
        totalRevenue: number;
        totalIva: number;
        totalIrpf: number;
        totalPending: number;
        invoicesCount: number;
        clientsCount: number;
      }
    | undefined;
  isLoading: boolean;
}) {
  if (isLoading || !summary) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-[88px] rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <KpiCard
        label="Total facturado"
        value={formatCurrency(summary.totalRevenue)}
        hint={`${summary.invoicesCount} factura${summary.invoicesCount === 1 ? '' : 's'} · ${summary.clientsCount} cliente${summary.clientsCount === 1 ? '' : 's'}`}
      />
      <KpiCard label="IVA repercutido" value={formatCurrency(summary.totalIva)} />
      <KpiCard label="IRPF retenido" value={formatCurrency(summary.totalIrpf)} />
      <KpiCard
        label="Pendiente de cobro"
        value={formatCurrency(summary.totalPending)}
        hint="Sobre facturas filtradas"
      />
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-2 p-4">
      {[...Array(8)].map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-md" />
      ))}
    </div>
  );
}

function EmptyState({
  hasActiveFilters,
  onClearFilters,
}: {
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <FileText className="h-6 w-6 text-muted-foreground" />
      </div>
      {hasActiveFilters ? (
        <>
          <p className="text-sm font-medium">No hay facturas que coincidan con los filtros</p>
          <p className="text-xs text-muted-foreground">
            Prueba a relajar los criterios o limpia los filtros.
          </p>
          <Button variant="outline" size="sm" onClick={onClearFilters} className="mt-2">
            Limpiar filtros
          </Button>
        </>
      ) : (
        <>
          <p className="text-sm font-medium">Aún no hay facturas confirmadas</p>
          <p className="text-xs text-muted-foreground">
            Cuando tus clientes confirmen sus facturas, aparecerán aquí.
          </p>
          <Link
            href="/dashboard/asesoria/clientes"
            className="mt-2 text-sm font-medium text-primary hover:underline"
          >
            Ver mis clientes
          </Link>
        </>
      )}
    </div>
  );
}
