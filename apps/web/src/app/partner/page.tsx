'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import {
  Users,
  FileText,
  Building2,
  TrendingUp,
  Shield,
  RefreshCw,
  LogOut,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Activity,
  UserCheck,
  Zap,
  CreditCard,
  BarChart3,
  Clock,
  Search,
  X,
  Repeat,
  Eye,
  EyeOff,
  Trash2,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface GrowthSeries {
  startDate: string;
  endDate: string;
  users: Array<{ date: string; count: number }>;
  invoices: Array<{ date: string; count: number }>;
}

interface PartnerStats {
  users: {
    total: number;
    verified: number;
    unverified: number;
    newThisWeek: number;
    newThisMonth: number;
  };
  tenants: {
    total: number;
    active: number;
    inactive: number;
    setupCompleted: number;
    byPlan: { FREE: number; BASIC: number; PROFESSIONAL: number };
    byType: { INDIVIDUAL: number; BUSINESS: number; AGENCY: number; COLLABORATIVE: number };
  };
  invoices: {
    total: number;
    thisWeek: number;
    thisMonth: number;
    byStatus: Record<string, number>;
    totalAmount: number;
    thisMonthAmount: number;
  };
  verifactu: {
    tenantsWithCertificate: number;
    totalSent: number;
  };
  growth: {
    currentPeriod: GrowthSeries;
    previousPeriod: GrowthSeries;
  };
  recentTenants: Array<{
    id: string;
    businessName: string;
    email: string;
    plan: string;
    accountType: string;
    setupCompleted: boolean;
    createdAt: string;
    invoiceCount: number;
    customerCount: number;
    productCount: number;
    recurringInvoiceCount: number;
    lastUserActivityAt: string | null;
  }>;
  generatedAt: string;
}

type PlanFilter = 'ALL' | 'FREE' | 'BASIC' | 'PROFESSIONAL';
type TypeFilter = 'ALL' | 'INDIVIDUAL' | 'BUSINESS' | 'AGENCY' | 'COLLABORATIVE';
type QuickFilter = 'sinSetup' | 'soloPago';

interface FilterState {
  search: string;
  plan: PlanFilter;
  type: TypeFilter;
  quick: Set<QuickFilter>;
}

interface SortState {
  col: string;
  dir: 'asc' | 'desc';
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'partner_key';
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

const PERIODS = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '45d', days: 45 },
  { label: '3 meses', days: 90 },
  { label: '6 meses', days: 180 },
  { label: '1 año', days: 365 },
] as const;

const PLAN_ORDER: Record<string, number> = { FREE: 0, BASIC: 1, PROFESSIONAL: 2 };

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat('es-ES').format(n);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function fmtDateShort(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
}

function pct(num: number, denom: number): string {
  if (!denom) return '0%';
  return `${Math.round((num / denom) * 100)}%`;
}

async function fetchStats(key: string, days: number): Promise<PartnerStats> {
  const res = await fetch(`${API_URL}/partner/stats?days=${days}`, {
    headers: { Authorization: `Bearer ${key}` },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const body = await res.json();
  return body.data ?? body;
}

async function apiDeleteTenant(key: string, tenantId: string): Promise<void> {
  const res = await fetch(`${API_URL}/partner/tenant/${tenantId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${key}` },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

// ── KpiCard ────────────────────────────────────────────────────────────────────

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  color = 'blue',
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'indigo' | 'cyan';
}) {
  const iconColors: Record<string, string> = {
    blue: 'bg-blue-500/20 text-blue-400',
    green: 'bg-emerald-500/20 text-emerald-400',
    purple: 'bg-purple-500/20 text-purple-400',
    orange: 'bg-orange-500/20 text-orange-400',
    indigo: 'bg-indigo-500/20 text-indigo-400',
    cyan: 'bg-cyan-500/20 text-cyan-400',
  };
  return (
    <div className="rounded-2xl border border-white/5 bg-gray-900 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm text-gray-400">{label}</p>
          <p className="mt-1 text-2xl font-bold text-white sm:text-3xl">{value}</p>
          {sub && <p className="mt-1 text-xs text-gray-500">{sub}</p>}
        </div>
        <div className={`shrink-0 rounded-xl p-2.5 ${iconColors[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

// ── HealthBadge ───────────────────────────────────────────────────────────────

function HealthBadge({
  label,
  num,
  denom,
  threshold,
}: {
  label: string;
  num: number;
  denom: number;
  threshold: number;
}) {
  const ratio = denom > 0 ? num / denom : 0;
  const good = ratio >= threshold;
  const percentage = Math.round(ratio * 100);
  return (
    <div className="flex flex-col gap-1.5 rounded-xl bg-gray-800/60 px-4 py-3">
      <span className="text-xs text-gray-500">{label}</span>
      <div className="flex items-end justify-between gap-2">
        <span className="text-sm font-bold text-white">
          {fmt(num)}
          <span className="font-normal text-gray-500">/{fmt(denom)}</span>
        </span>
        <span className={`text-sm font-bold ${good ? 'text-emerald-400' : 'text-orange-400'}`}>
          {percentage}%
        </span>
      </div>
    </div>
  );
}

// ── PlanBar ───────────────────────────────────────────────────────────────────

function PlanBar({
  label,
  value,
  max,
  colorClass,
  badgeClass,
}: {
  label: string;
  value: number;
  max: number;
  colorClass: string;
  badgeClass: string;
}) {
  const p = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className={`inline-block h-2 w-2 rounded-full ${colorClass}`} />
          <span className="text-gray-300">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badgeClass}`}>
            {p}%
          </span>
          <span className="w-8 text-right font-semibold text-white">{fmt(value)}</span>
        </div>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-800">
        <div
          className={`h-2 rounded-full transition-all duration-700 ${colorClass}`}
          style={{ width: `${p}%` }}
        />
      </div>
    </div>
  );
}

// ── DualLineChart (GSC-style) ─────────────────────────────────────────────────

function DualLineChart({
  current,
  previous,
  color,
  gradientId,
  currentLabel,
  previousLabel,
  icon: Icon,
  title,
  subtitle,
}: {
  current: Array<{ date: string; count: number }>;
  previous: Array<{ date: string; count: number }>;
  color: string;
  gradientId: string;
  currentLabel: string;
  previousLabel: string;
  icon: React.ElementType;
  title: string;
  subtitle: string;
}) {
  const W = 400;
  const H = 140;
  const padX = 6;
  const padY = 8;

  const allCounts = [...current.map((d) => d.count), ...previous.map((d) => d.count)];
  const max = Math.max(...allCounts, 1);

  function toPoints(data: Array<{ date: string; count: number }>) {
    if (!data.length) return [];
    return data.map((d, i) => ({
      x: padX + (i / Math.max(data.length - 1, 1)) * (W - padX * 2),
      y: padY + (1 - d.count / max) * (H - padY * 2),
      count: d.count,
    }));
  }

  function buildPath(pts: ReturnType<typeof toPoints>) {
    if (!pts.length) return '';
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  }

  const curPts = toPoints(current);
  const prevPts = toPoints(previous);
  const curPath = buildPath(curPts);
  const prevPath = buildPath(prevPts);
  const areaPath =
    curPath && curPts.length > 1
      ? `${curPath} L${curPts[curPts.length - 1].x.toFixed(1)},${H} L${curPts[0].x.toFixed(1)},${H} Z`
      : '';

  const curTotal = current.reduce((s, d) => s + d.count, 0);
  const prevTotal = previous.reduce((s, d) => s + d.count, 0);
  const delta = prevTotal > 0 ? Math.round(((curTotal - prevTotal) / prevTotal) * 100) : null;
  const positive = delta !== null && delta >= 0;

  const gridYs = [0.25, 0.5, 0.75].map((f) => (padY + (1 - f) * (H - padY * 2)).toFixed(1));

  const noData = !current.length && !previous.length;

  return (
    <div className="rounded-2xl border border-white/5 bg-gray-900 p-5">
      {/* Header */}
      <div className="mb-5 flex items-center gap-2.5">
        <div className="rounded-lg p-2" style={{ background: `${color}22` }}>
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
        <div>
          <h3 className="font-semibold text-white">{title}</h3>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
      </div>

      {/* Hero stat */}
      <div className="mb-1 flex items-end gap-3">
        <span className="text-4xl font-extrabold leading-none tabular-nums text-white">
          {fmt(curTotal)}
        </span>
        {delta !== null ? (
          <span
            className={`mb-0.5 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
              positive ? 'bg-emerald-900/40 text-emerald-400' : 'bg-red-900/40 text-red-400'
            }`}
          >
            {positive ? '▲' : '▼'} {Math.abs(delta)}%
            <span className="font-normal opacity-60">vs anterior</span>
          </span>
        ) : (
          <span className="mb-0.5 rounded-full bg-gray-800 px-2.5 py-1 text-xs text-gray-600">
            sin datos anteriores
          </span>
        )}
      </div>

      {/* Period comparison row */}
      <div className="mb-5 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs">
        <div className="flex items-center gap-1.5">
          <span
            className="inline-block h-[2px] w-4 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="text-gray-300">{currentLabel}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg width="14" height="4" className="shrink-0">
            <line
              x1="0"
              y1="2"
              x2="14"
              y2="2"
              stroke="#4b5563"
              strokeWidth="2"
              strokeDasharray="4 2"
            />
          </svg>
          <span className="text-gray-500">
            {previousLabel}
            {' · '}
            <strong className="text-gray-400">{fmt(prevTotal)}</strong>
          </span>
        </div>
      </div>

      {/* Chart */}
      {noData ? (
        <div className="flex h-28 items-center justify-center rounded-xl bg-gray-800/40 text-sm text-gray-600">
          Sin datos para este período
        </div>
      ) : (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.2" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {gridYs.map((y) => (
            <line key={y} x1={padX} y1={y} x2={W - padX} y2={y} stroke="#1f2937" strokeWidth="1" />
          ))}

          {/* Previous period */}
          {prevPath && (
            <path
              d={prevPath}
              fill="none"
              stroke="#374151"
              strokeWidth="1.5"
              strokeDasharray="5 4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Current period */}
          {areaPath && <path d={areaPath} fill={`url(#${gradientId})`} />}
          {curPath && (
            <path
              d={curPath}
              fill="none"
              stroke={color}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* End dot */}
          {curPts.length > 0 && (
            <circle
              cx={curPts[curPts.length - 1].x}
              cy={curPts[curPts.length - 1].y}
              r="4"
              fill={color}
              stroke="#111827"
              strokeWidth="2"
            />
          )}
        </svg>
      )}
    </div>
  );
}

// ── SortableHeader ────────────────────────────────────────────────────────────

function SortableHeader({
  col,
  label,
  align,
  sort,
  onSort,
}: {
  col: string;
  label: string;
  align: string;
  sort: SortState;
  onSort: (col: string) => void;
}) {
  const active = sort.col === col;
  return (
    <th
      onClick={() => onSort(col)}
      className={`cursor-pointer select-none px-4 py-3 text-xs font-semibold uppercase tracking-wider transition ${align} ${
        active ? 'text-white' : 'text-gray-400 hover:text-gray-200'
      }`}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <span className={`text-[10px] transition-opacity ${active ? 'opacity-100' : 'opacity-20'}`}>
          {active && sort.dir === 'asc' ? '↑' : '↓'}
        </span>
      </span>
    </th>
  );
}

// ── FilterBar ─────────────────────────────────────────────────────────────────

const PLAN_OPTIONS: Array<{ value: PlanFilter; label: string }> = [
  { value: 'ALL', label: 'Todos' },
  { value: 'FREE', label: 'FREE' },
  { value: 'BASIC', label: 'BASIC' },
  { value: 'PROFESSIONAL', label: 'PRO' },
];

const TYPE_OPTIONS: Array<{ value: TypeFilter; label: string }> = [
  { value: 'ALL', label: 'Todos' },
  { value: 'INDIVIDUAL', label: 'Autónomo' },
  { value: 'BUSINESS', label: 'Empresa' },
  { value: 'AGENCY', label: 'Asesoría' },
  { value: 'COLLABORATIVE', label: 'Colaborativo' },
];

function FilterBar({
  filter,
  onChange,
  resultCount,
  total,
}: {
  filter: FilterState;
  onChange: (f: FilterState) => void;
  resultCount: number;
  total: number;
}) {
  const hasActiveFilters =
    filter.search !== '' || filter.plan !== 'ALL' || filter.type !== 'ALL' || filter.quick.size > 0;

  function toggleQuick(q: QuickFilter) {
    const next = new Set(filter.quick);
    if (next.has(q)) next.delete(q);
    else next.add(q);
    onChange({ ...filter, quick: next });
  }

  return (
    <div className="space-y-3">
      {/* Search row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por empresa o email..."
            value={filter.search}
            onChange={(e) => onChange({ ...filter, search: e.target.value })}
            className="w-full rounded-xl border border-gray-700 bg-gray-800 py-2 pl-9 pr-8 text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
          {filter.search && (
            <button
              onClick={() => onChange({ ...filter, search: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <span className="shrink-0 text-xs text-gray-500">
          {resultCount === total ? (
            <span>{fmt(total)} empresas</span>
          ) : (
            <span>
              <strong className="text-white">{fmt(resultCount)}</strong>{' '}
              <span>de {fmt(total)}</span>
            </span>
          )}
        </span>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {/* Plan */}
        <div className="flex items-center gap-0.5 rounded-xl border border-gray-800 bg-gray-900 p-1">
          {PLAN_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => onChange({ ...filter, plan: value })}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
                filter.plan === value
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Type */}
        <div className="flex items-center gap-0.5 rounded-xl border border-gray-800 bg-gray-900 p-1">
          {TYPE_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => onChange({ ...filter, type: value })}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
                filter.type === value
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Quick: Sin setup */}
        <button
          onClick={() => toggleQuick('sinSetup')}
          className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition ${
            filter.quick.has('sinSetup')
              ? 'border-orange-500/50 bg-orange-900/30 text-orange-300'
              : 'border-gray-800 bg-gray-900 text-gray-400 hover:text-gray-200'
          }`}
        >
          Sin setup
        </button>

        {/* Quick: Solo de pago */}
        <button
          onClick={() => toggleQuick('soloPago')}
          className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition ${
            filter.quick.has('soloPago')
              ? 'border-cyan-500/50 bg-cyan-900/30 text-cyan-300'
              : 'border-gray-800 bg-gray-900 text-gray-400 hover:text-gray-200'
          }`}
        >
          Solo de pago
        </button>

        {/* Reset */}
        {hasActiveFilters && (
          <button
            onClick={() => onChange({ search: '', plan: 'ALL', type: 'ALL', quick: new Set() })}
            className="flex items-center gap-1.5 rounded-xl border border-gray-800 bg-gray-900 px-3 py-1.5 text-xs font-medium text-gray-500 transition hover:text-gray-300"
          >
            <X className="h-3 w-3" />
            Limpiar
          </button>
        )}
      </div>
    </div>
  );
}

// ── LoginForm ─────────────────────────────────────────────────────────────────

function LoginForm({ onSuccess }: { onSuccess: (key: string) => void }) {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showKey, setShowKey] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!key.trim()) return;
    setLoading(true);
    setError('');
    try {
      await fetchStats(key.trim(), 30);
      localStorage.setItem(STORAGE_KEY, key.trim());
      onSuccess(key.trim());
    } catch {
      setError('Clave incorrecta. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-6 flex justify-center">
            <Image
              src="/brand/logo-white.png"
              alt="NovaFactura"
              width={180}
              height={48}
              priority
              className="h-12 w-auto"
            />
          </div>
          <h1 className="text-2xl font-bold text-white">Panel de Socio</h1>
          <p className="mt-1 text-sm text-gray-400">Acceso restringido</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              placeholder="Clave de acceso"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 pr-12 text-white placeholder-gray-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowKey((v) => !v)}
              className="absolute inset-y-0 right-0 flex items-center px-4 text-gray-500 hover:text-gray-300"
              tabIndex={-1}
              aria-label={showKey ? 'Ocultar clave' : 'Mostrar clave'}
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {error && (
            <p className="flex items-center gap-2 text-sm text-red-400">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading || !key.trim()}
            className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50"
          >
            {loading ? 'Verificando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

const ACCOUNT_TYPE_LABEL: Record<string, string> = {
  INDIVIDUAL: 'Autónomo',
  BUSINESS: 'Empresa',
  AGENCY: 'Asesoría',
  COLLABORATIVE: 'Colaborativo',
};

function Dashboard({
  stats,
  partnerKey,
  selectedDays,
  onPeriodChange,
  onRefresh,
  onLogout,
  refreshing,
}: {
  stats: PartnerStats;
  partnerKey: string;
  selectedDays: number;
  onPeriodChange: (days: number) => void;
  onRefresh: () => void;
  onLogout: () => void;
  refreshing: boolean;
}) {
  const [filter, setFilter] = useState<FilterState>({
    search: '',
    plan: 'ALL',
    type: 'ALL',
    quick: new Set(),
  });
  const [sort, setSort] = useState<SortState>({ col: 'createdAt', dir: 'desc' });
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await apiDeleteTenant(partnerKey, confirmDelete.id);
      setConfirmDelete(null);
      onRefresh();
    } catch {
      // silently close — onRefresh will show updated data
      setConfirmDelete(null);
    } finally {
      setDeleting(false);
    }
  }

  function handleSort(col: string) {
    setSort((prev) =>
      prev.col === col ? { col, dir: prev.dir === 'desc' ? 'asc' : 'desc' } : { col, dir: 'desc' },
    );
  }

  const totalTenants = stats.tenants.total;
  const payingTenants = stats.tenants.byPlan.BASIC + stats.tenants.byPlan.PROFESSIONAL;
  const payingRate = pct(payingTenants, totalTenants);
  const verifactuRate = pct(stats.verifactu.tenantsWithCertificate, totalTenants);
  const avgInvoicesPerTenant =
    totalTenants > 0 ? Math.round(stats.invoices.total / totalTenants) : 0;

  const { currentPeriod, previousPeriod } = stats.growth;
  const currentLabel = `${fmtDateShort(currentPeriod.startDate)} – ${fmtDateShort(currentPeriod.endDate)}`;
  const previousLabel = `${fmtDateShort(previousPeriod.startDate)} – ${fmtDateShort(previousPeriod.endDate)}`;

  const filteredTenants = useMemo(() => {
    const filtered = stats.recentTenants.filter((t) => {
      const q = filter.search.toLowerCase();
      if (q && !t.businessName.toLowerCase().includes(q) && !t.email.toLowerCase().includes(q))
        return false;
      if (filter.plan !== 'ALL' && t.plan !== filter.plan) return false;
      if (filter.type !== 'ALL' && t.accountType !== filter.type) return false;
      if (filter.quick.has('sinSetup') && t.setupCompleted) return false;
      if (filter.quick.has('soloPago') && t.plan === 'FREE') return false;
      return true;
    });

    const { col, dir } = sort;
    const mult = dir === 'asc' ? 1 : -1;
    filtered.sort((a, b) => {
      let cmp = 0;
      if (col === 'businessName') cmp = a.businessName.localeCompare(b.businessName, 'es');
      else if (col === 'email') cmp = a.email.localeCompare(b.email, 'es');
      else if (col === 'plan') cmp = (PLAN_ORDER[a.plan] ?? 0) - (PLAN_ORDER[b.plan] ?? 0);
      else if (col === 'accountType') cmp = a.accountType.localeCompare(b.accountType, 'es');
      else if (col === 'invoiceCount') cmp = a.invoiceCount - b.invoiceCount;
      else if (col === 'recurringInvoiceCount')
        cmp = a.recurringInvoiceCount - b.recurringInvoiceCount;
      else if (col === 'productCount') cmp = a.productCount - b.productCount;
      else if (col === 'customerCount') cmp = a.customerCount - b.customerCount;
      else if (col === 'setupCompleted')
        cmp = (a.setupCompleted ? 1 : 0) - (b.setupCompleted ? 1 : 0);
      else if (col === 'createdAt')
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      else if (col === 'lastUserActivityAt') {
        const aT = a.lastUserActivityAt ? new Date(a.lastUserActivityAt).getTime() : -Infinity;
        const bT = b.lastUserActivityAt ? new Date(b.lastUserActivityAt).getTime() : -Infinity;
        cmp = aT - bT;
      }
      return cmp * mult;
    });
    return filtered;
  }, [stats.recentTenants, filter, sort]);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* ── Header ── */}
      <header className="sticky top-0 z-10 border-b border-white/5 bg-gray-950/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-screen-2xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Image
            src="/brand/logo-white.png"
            alt="NovaFactura"
            width={130}
            height={34}
            className="h-8 w-auto"
          />
          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-3 rounded-xl border border-white/5 bg-gray-900 px-4 py-1.5 text-xs sm:flex">
              <span className="text-gray-400">
                Usuarios: <strong className="text-white">{fmt(stats.users.total)}</strong>
              </span>
              <span className="text-gray-700">|</span>
              <span className="text-gray-400">
                Empresas: <strong className="text-white">{fmt(totalTenants)}</strong>
              </span>
              <span className="text-gray-700">|</span>
              <span className="text-gray-400">
                Facturas: <strong className="text-white">{fmt(stats.invoices.total)}</strong>
              </span>
            </div>
            <button
              onClick={onRefresh}
              disabled={refreshing}
              className="flex items-center gap-1.5 rounded-xl border border-white/5 bg-gray-900 px-3 py-2 text-sm font-medium text-gray-300 transition hover:bg-gray-800 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 rounded-xl border border-white/5 bg-gray-900 px-3 py-2 text-sm font-medium text-gray-300 transition hover:bg-gray-800"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-screen-2xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {/* ── 1. KPIs ── */}
        <section>
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-500">
            Métricas clave
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <KpiCard
              icon={Users}
              label="Usuarios"
              value={fmt(stats.users.total)}
              sub={`+${fmt(stats.users.newThisMonth)} este mes`}
              color="blue"
            />
            <KpiCard
              icon={Building2}
              label="Empresas"
              value={fmt(totalTenants)}
              sub={`${fmt(stats.tenants.active)} activas`}
              color="purple"
            />
            <KpiCard
              icon={FileText}
              label="Facturas emitidas"
              value={fmt(stats.invoices.total)}
              sub={`+${fmt(stats.invoices.thisMonth)} este mes`}
              color="green"
            />
            <KpiCard
              icon={CreditCard}
              label="Clientes de pago"
              value={fmt(payingTenants)}
              sub={`${payingRate} del total`}
              color="cyan"
            />
            <KpiCard
              icon={BarChart3}
              label="Fact. por empresa"
              value={fmt(avgInvoicesPerTenant)}
              sub="media acumulada"
              color="indigo"
            />
          </div>
        </section>

        {/* ── 2. SALUD ── */}
        <section>
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-500">
            Salud del negocio
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <HealthBadge
              label="Emails verificados"
              num={stats.users.verified}
              denom={stats.users.total}
              threshold={0.7}
            />
            <HealthBadge
              label="Setup completado"
              num={stats.tenants.setupCompleted}
              denom={totalTenants}
              threshold={0.5}
            />
            <HealthBadge
              label="Empresas activas"
              num={stats.tenants.active}
              denom={totalTenants}
              threshold={0.4}
            />
            <HealthBadge
              label="Conversión a pago"
              num={payingTenants}
              denom={totalTenants}
              threshold={0.1}
            />
            <HealthBadge
              label="Adopción VeriFactu"
              num={stats.verifactu.tenantsWithCertificate}
              denom={totalTenants}
              threshold={0.2}
            />
          </div>
        </section>

        {/* ── 3. CRECIMIENTO ── */}
        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
              Crecimiento
            </p>
            <div className="flex items-center gap-0.5 rounded-xl border border-gray-800 bg-gray-900 p-1">
              {PERIODS.map(({ label, days }) => (
                <button
                  key={days}
                  onClick={() => onPeriodChange(days)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    selectedDays === days
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <DualLineChart
              icon={Users}
              title="Nuevos usuarios"
              subtitle="Registros diarios"
              current={currentPeriod.users}
              previous={previousPeriod.users}
              color="#3b82f6"
              gradientId="usersGrad"
              currentLabel={currentLabel}
              previousLabel={previousLabel}
            />
            <DualLineChart
              icon={TrendingUp}
              title="Facturas emitidas"
              subtitle="Confirmadas por día"
              current={currentPeriod.invoices}
              previous={previousPeriod.invoices}
              color="#10b981"
              gradientId="invoicesGrad"
              currentLabel={currentLabel}
              previousLabel={previousLabel}
            />
          </div>
        </section>

        {/* ── Aviso período ── */}
        <div className="flex items-start gap-2 rounded-xl border border-gray-800 bg-gray-900/50 px-4 py-3 text-xs text-gray-500">
          <span className="mt-0.5 shrink-0 text-gray-600">ℹ</span>
          <span>
            Las secciones siguientes (adquisición, actividad, monetización y VeriFactu) muestran
            datos <strong className="text-gray-400">acumulados totales</strong> y no cambian al
            seleccionar un período de crecimiento. Solo los gráficos de arriba reflejan el período
            seleccionado.
          </span>
        </div>

        {/* ── 4. ADQUISICIÓN + ACTIVIDAD ── */}
        <section className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/5 bg-gray-900 p-5">
            <div className="mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-400" />
              <h3 className="font-semibold text-white">Adquisición de usuarios</h3>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Esta semana', value: stats.users.newThisWeek, color: 'text-blue-400' },
                { label: 'Este mes', value: stats.users.newThisMonth, color: 'text-blue-300' },
                {
                  label: 'Email verificado',
                  value: stats.users.verified,
                  color: 'text-emerald-400',
                },
                { label: 'Sin verificar', value: stats.users.unverified, color: 'text-orange-400' },
                { label: 'Total acumulado', value: stats.users.total, color: 'text-white' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">{label}</span>
                  <span className={`font-bold ${color}`}>{fmt(value)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/5 bg-gray-900 p-5">
            <div className="mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-400" />
              <h3 className="font-semibold text-white">Estado de empresas</h3>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Total registradas', value: totalTenants, color: 'text-white' },
                {
                  label: 'Activas (período)',
                  value: stats.tenants.active,
                  color: 'text-emerald-400',
                },
                { label: 'Inactivas', value: stats.tenants.inactive, color: 'text-gray-500' },
                {
                  label: 'Setup completado',
                  value: stats.tenants.setupCompleted,
                  color: 'text-blue-400',
                },
                {
                  label: 'Sin completar',
                  value: totalTenants - stats.tenants.setupCompleted,
                  color: 'text-orange-400',
                },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">{label}</span>
                  <span className={`font-bold ${color}`}>{fmt(value)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/5 bg-gray-900 p-5">
            <div className="mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-400" />
              <h3 className="font-semibold text-white">Actividad de facturación</h3>
            </div>
            <div className="space-y-3">
              {[
                { key: 'PAID', label: 'Pagadas', color: 'text-emerald-400' },
                { key: 'SENT', label: 'Enviadas', color: 'text-blue-400' },
                { key: 'CONFIRMED', label: 'Confirmadas', color: 'text-indigo-400' },
                { key: 'DRAFT', label: 'Borradores', color: 'text-gray-500' },
                { key: 'RECTIFIED', label: 'Rectificadas', color: 'text-orange-400' },
              ].map(({ key, label, color }) => (
                <div key={key} className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">{label}</span>
                  <span className={`font-bold ${color}`}>
                    {fmt(stats.invoices.byStatus[key] ?? 0)}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 border-t border-gray-800 pt-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Esta semana</span>
                <span className="font-semibold text-white">+{fmt(stats.invoices.thisWeek)}</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── 5. MONETIZACIÓN ── */}
        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/5 bg-gray-900 p-5">
            <div className="mb-5 flex items-start justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-cyan-400" />
                <h3 className="font-semibold text-white">Distribución por plan</h3>
              </div>
              <span className="rounded-full bg-cyan-900/40 px-2.5 py-0.5 text-xs font-semibold text-cyan-300">
                {payingRate} de pago
              </span>
            </div>
            <div className="space-y-4">
              <PlanBar
                label="FREE"
                value={stats.tenants.byPlan.FREE}
                max={totalTenants}
                colorClass="bg-gray-500"
                badgeClass="bg-gray-700 text-gray-300"
              />
              <PlanBar
                label="BASIC"
                value={stats.tenants.byPlan.BASIC}
                max={totalTenants}
                colorClass="bg-blue-500"
                badgeClass="bg-blue-900/50 text-blue-300"
              />
              <PlanBar
                label="PROFESSIONAL"
                value={stats.tenants.byPlan.PROFESSIONAL}
                max={totalTenants}
                colorClass="bg-purple-500"
                badgeClass="bg-purple-900/50 text-purple-300"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-white/5 bg-gray-900 p-5">
            <div className="mb-5 flex items-center gap-2">
              <Zap className="h-5 w-5 text-orange-400" />
              <h3 className="font-semibold text-white">Tipo de cliente</h3>
            </div>
            <div className="space-y-4">
              <PlanBar
                label="Autónomos"
                value={stats.tenants.byType.INDIVIDUAL}
                max={totalTenants}
                colorClass="bg-orange-500"
                badgeClass="bg-orange-900/50 text-orange-300"
              />
              <PlanBar
                label="Empresas"
                value={stats.tenants.byType.BUSINESS}
                max={totalTenants}
                colorClass="bg-blue-500"
                badgeClass="bg-blue-900/50 text-blue-300"
              />
              <PlanBar
                label="Asesorías"
                value={stats.tenants.byType.AGENCY}
                max={totalTenants}
                colorClass="bg-emerald-500"
                badgeClass="bg-emerald-900/50 text-emerald-300"
              />
              <PlanBar
                label="Colaborativos"
                value={stats.tenants.byType.COLLABORATIVE}
                max={totalTenants}
                colorClass="bg-purple-500"
                badgeClass="bg-purple-900/50 text-purple-300"
              />
            </div>
          </div>
        </section>

        {/* ── 6. VERIFACTU ── */}
        <section>
          <div className="rounded-2xl border border-indigo-900/40 bg-indigo-950/30 p-5">
            <div className="mb-5 flex items-center gap-2">
              <Shield className="h-5 w-5 text-indigo-400" />
              <h3 className="font-semibold text-white">VeriFactu — Integración AEAT</h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-gray-900 p-4 text-center">
                <p className="text-3xl font-bold text-indigo-400">
                  {fmt(stats.verifactu.tenantsWithCertificate)}
                </p>
                <p className="mt-1 text-xs text-gray-400">Empresas con certificado digital</p>
              </div>
              <div className="rounded-xl bg-gray-900 p-4 text-center">
                <p className="text-3xl font-bold text-emerald-400">
                  {fmt(stats.verifactu.totalSent)}
                </p>
                <p className="mt-1 text-xs text-gray-400">Facturas enviadas a la AEAT</p>
              </div>
              <div className="rounded-xl bg-gray-900 p-4">
                <p className="mb-2 text-xs text-gray-400">Tasa de adopción</p>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-800">
                  <div
                    className="h-2.5 rounded-full bg-gradient-to-r from-indigo-600 to-indigo-400"
                    style={{ width: verifactuRate }}
                  />
                </div>
                <p className="mt-2 text-right text-xl font-bold text-indigo-300">{verifactuRate}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 7. TABLA DE EMPRESAS ── */}
        <section>
          <div className="mb-4 flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-purple-400" />
            <h3 className="font-semibold text-white">Empresas registradas</h3>
            <div className="ml-auto flex items-center gap-1.5 rounded-full border border-white/5 bg-gray-900 px-3 py-1 text-xs text-gray-400">
              <Clock className="h-3.5 w-3.5" />
              Haz clic en cualquier columna para ordenar
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-white/5 bg-gray-900">
            <div className="border-b border-gray-800 p-4">
              <FilterBar
                filter={filter}
                onChange={setFilter}
                resultCount={filteredTenants.length}
                total={stats.recentTenants.length}
              />
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-800">
                <thead className="bg-gray-800/40">
                  <tr>
                    {(
                      [
                        { col: 'businessName', label: 'Empresa', align: 'text-left' },
                        { col: 'email', label: 'Email', align: 'text-left' },
                        { col: 'plan', label: 'Plan', align: 'text-center' },
                        { col: 'accountType', label: 'Tipo', align: 'text-center' },
                        { col: 'invoiceCount', label: 'Facturas', align: 'text-center' },
                        {
                          col: 'recurringInvoiceCount',
                          label: 'Recurrentes',
                          align: 'text-center',
                        },
                        { col: 'productCount', label: 'Productos', align: 'text-center' },
                        { col: 'customerCount', label: 'Clientes', align: 'text-center' },
                        { col: 'setupCompleted', label: 'Setup', align: 'text-center' },
                        { col: 'createdAt', label: 'Registro', align: 'text-left' },
                        { col: 'lastUserActivityAt', label: 'Últ. acceso', align: 'text-left' },
                      ] as const
                    ).map(({ col, label, align }) => (
                      <SortableHeader
                        key={col}
                        col={col}
                        label={label}
                        align={align}
                        sort={sort}
                        onSort={handleSort}
                      />
                    ))}
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Acción
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {filteredTenants.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="px-4 py-10 text-center text-sm text-gray-500">
                        Ninguna empresa coincide con los filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    filteredTenants.map((t) => (
                      <tr key={t.id} className="transition hover:bg-gray-800/30">
                        <td className="px-4 py-3 text-sm font-medium text-white">
                          {t.businessName}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-400">{t.email}</td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                              t.plan === 'PROFESSIONAL'
                                ? 'bg-purple-900/50 text-purple-300'
                                : t.plan === 'BASIC'
                                  ? 'bg-blue-900/50 text-blue-300'
                                  : 'bg-gray-700 text-gray-400'
                            }`}
                          >
                            {t.plan}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-xs text-gray-400">
                          {ACCOUNT_TYPE_LABEL[t.accountType] ?? t.accountType}
                        </td>
                        <td className="px-4 py-3 text-center text-sm font-semibold text-white">
                          {fmt(t.invoiceCount)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {t.recurringInvoiceCount > 0 ? (
                            <span className="inline-flex items-center gap-1 text-sm text-emerald-400">
                              <Repeat className="h-3.5 w-3.5" />
                              {fmt(t.recurringInvoiceCount)}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-700">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-400">
                          {fmt(t.productCount)}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-400">
                          {fmt(t.customerCount)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {t.setupCompleted ? (
                            <CheckCircle2 className="mx-auto h-4 w-4 text-emerald-400" />
                          ) : (
                            <XCircle className="mx-auto h-4 w-4 text-gray-700" />
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-400">{fmtDate(t.createdAt)}</td>
                        <td className="px-4 py-3 text-sm">
                          {t.lastUserActivityAt ? (
                            <span className="text-gray-300">
                              {fmtDateTime(t.lastUserActivityAt)}
                            </span>
                          ) : (
                            <span className="text-gray-700">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => setConfirmDelete({ id: t.id, name: t.businessName })}
                            className="rounded-lg p-1.5 text-gray-600 transition hover:bg-red-900/40 hover:text-red-400"
                            title="Eliminar empresa"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <footer className="border-t border-white/5 pt-6 text-center text-xs text-gray-600">
          NovaFactura · Panel de Socio · Datos generados{' '}
          {new Date(stats.generatedAt).toLocaleString('es-ES')}
        </footer>
      </main>

      {/* ── Modal confirmación eliminar ── */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-red-900/40 bg-gray-900 p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-lg bg-red-900/30 p-2">
                <Trash2 className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Eliminar empresa</h3>
                <p className="text-xs text-gray-500">Esta acción es irreversible</p>
              </div>
            </div>
            <p className="mb-2 text-sm text-gray-300">
              Se eliminará permanentemente{' '}
              <strong className="text-white">{confirmDelete.name}</strong> junto con todas sus
              facturas, clientes, productos, recurrentes y usuarios que no pertenezcan a ninguna
              otra empresa.
            </p>
            <p className="mb-6 text-xs text-red-400">
              ¿Estás seguro? No hay forma de deshacer esto.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                disabled={deleting}
                className="flex-1 rounded-xl border border-gray-700 py-2.5 text-sm font-medium text-gray-300 transition hover:bg-gray-800 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-50"
              >
                {deleting ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function PartnerPage() {
  const [partnerKey, setPartnerKey] = useState<string | null>(null);
  const [stats, setStats] = useState<PartnerStats | null>(null);
  const [selectedDays, setSelectedDays] = useState(30);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = useCallback(async (key: string, days: number) => {
    setRefreshing(true);
    setError('');
    try {
      const data = await fetchStats(key, days);
      setStats(data);
    } catch {
      setError('No se pudieron cargar las estadísticas.');
      setStats(null);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setPartnerKey(saved);
      loadStats(saved, 30);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleLoginSuccess(key: string) {
    setPartnerKey(key);
    loadStats(key, selectedDays);
  }

  function handleLogout() {
    localStorage.removeItem(STORAGE_KEY);
    setPartnerKey(null);
    setStats(null);
  }

  function handleRefresh() {
    if (partnerKey) loadStats(partnerKey, selectedDays);
  }

  function handlePeriodChange(days: number) {
    setSelectedDays(days);
    if (partnerKey) loadStats(partnerKey, days);
  }

  if (!partnerKey) return <LoginForm onSuccess={handleLoginSuccess} />;

  if (!stats && !error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <div className="flex items-center gap-3 text-gray-400">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Cargando datos...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-950">
        <p className="text-red-400">{error}</p>
        <button
          onClick={handleLogout}
          className="rounded-xl bg-gray-800 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
        >
          Volver al login
        </button>
      </div>
    );
  }

  return (
    <Dashboard
      stats={stats!}
      partnerKey={partnerKey}
      selectedDays={selectedDays}
      onPeriodChange={handlePeriodChange}
      onRefresh={handleRefresh}
      onLogout={handleLogout}
      refreshing={refreshing}
    />
  );
}
