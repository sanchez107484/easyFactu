import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Hash,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { brandConfig } from '@easyfactura/brand-config';
import { InvoiceStatus } from '@easyfactura/shared-types';
import { verifyInvoiceByHash } from '@/lib/api/public-verify-api';
import { cn } from '@/lib/utils';

interface Props {
  params: Promise<{ hash: string }>;
}

const HASH_REGEX = /^[0-9a-f]{64}$/;

const STATUS_META: Partial<
  Record<InvoiceStatus, { label: string; chip: string; dot: string }>
> = {
  [InvoiceStatus.CONFIRMED]: {
    label: 'Emitida',
    chip: 'bg-slate-100 border-slate-300 text-slate-700 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300',
    dot: 'bg-slate-400',
  },
  [InvoiceStatus.SENT]: {
    label: 'Enviada',
    chip: 'bg-sky-100 border-sky-300 text-sky-700 dark:bg-sky-900/40 dark:border-sky-700 dark:text-sky-300',
    dot: 'bg-sky-500',
  },
  [InvoiceStatus.PAID]: {
    label: 'Pagada',
    chip: 'bg-emerald-100 border-emerald-300 text-emerald-700 dark:bg-emerald-900/40 dark:border-emerald-700 dark:text-emerald-300',
    dot: 'bg-emerald-500',
  },
};

const fmtCurrency = (amount: number) =>
  amount.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { hash } = await params;
  return {
    title: `Verificar factura | ${brandConfig.app.name}`,
    description: 'Verifica la autenticidad e integridad de esta factura electrónica.',
    robots: { index: false, follow: false },
    openGraph: {
      title: `Verificación de factura | ${brandConfig.app.name}`,
      description: 'Comprueba que esta factura es auténtica y no ha sido alterada.',
      url: `${brandConfig.app.url}/verify/${hash}`,
    },
  };
}

export default async function VerifyPage({ params }: Props) {
  const { hash: rawHash } = await params;
  const hash = rawHash.toLowerCase();

  if (!HASH_REGEX.test(hash)) {
    return <NotFoundState />;
  }

  let data: Awaited<ReturnType<typeof verifyInvoiceByHash>>;
  try {
    data = await verifyInvoiceByHash(hash);
  } catch {
    return <ErrorState />;
  }

  if (!data) {
    return <NotFoundState />;
  }

  const status = STATUS_META[data.invoice.status] ?? {
    label: data.invoice.status,
    chip: 'bg-slate-100 border-slate-300 text-slate-700',
    dot: 'bg-slate-400',
  };
  const verifiedAt = new Date().toISOString();

  return (
    <PageShell>
      {/* Hero */}
      <section
        aria-labelledby="verify-heading"
        className="relative overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-6 sm:p-8 shadow-sm dark:border-emerald-900/50 dark:from-emerald-950/40 dark:to-background print:border-emerald-200 print:bg-white print:shadow-none"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-30 print:hidden"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, #6ee7b7 0%, transparent 70%)' }}
        />
        <div className="relative flex flex-col items-center gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 ring-4 ring-emerald-50 dark:bg-emerald-900/50 dark:ring-emerald-950 sm:h-16 sm:w-16">
            <CheckCircle2
              className="h-7 w-7 text-emerald-600 dark:text-emerald-400 sm:h-8 sm:w-8"
              aria-hidden="true"
            />
          </div>
          <div>
            <h1
              id="verify-heading"
              className="text-2xl font-bold text-emerald-900 dark:text-emerald-100 sm:text-3xl"
            >
              Factura verificada
            </h1>
            <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-400 sm:text-base">
              Su integridad ha sido comprobada en nuestro registro.
            </p>
          </div>

          {/* Total prominente */}
          <p
            className="mt-1 text-3xl font-bold tabular-nums text-emerald-900 dark:text-emerald-100 sm:text-4xl"
            aria-label={`Importe total ${fmtCurrency(data.invoice.total)}`}
          >
            {fmtCurrency(data.invoice.total)}
          </p>

          <div className="flex flex-wrap justify-center gap-2">
            <Chip>Nº {data.invoice.number}</Chip>
            <StatusChip status={data.invoice.status}>
              <span className={cn('mr-1.5 inline-block h-1.5 w-1.5 rounded-full', status.dot)} />
              {status.label}
            </StatusChip>
          </div>


        </div>
      </section>

      {/* Dos columnas en desktop: Emisor + Factura */}
      <div className="mt-6 grid grid-cols-1 gap-y-2 lg:grid-cols-2 lg:gap-x-6">
        <section aria-labelledby="issuer-heading">
          <SectionTitle id="issuer-heading" icon={<Building2 className="h-4 w-4" />}>
            Emisor
          </SectionTitle>
          <Card>
            <Row label="Razón comercial" value={data.issuer.tradeName} />
            <Row label="NIF / CIF" value={data.issuer.nifMasked} mono />
          </Card>
        </section>

        <section aria-labelledby="invoice-heading">
          <SectionTitle id="invoice-heading" icon={<FileText className="h-4 w-4" />}>
            Factura
          </SectionTitle>
          <Card>
            <Row label="Número" value={data.invoice.number} />
            <Row
              label="Fecha de emisión"
              value={fmtDate(data.invoice.issueDate)}
              icon={<Calendar className="h-3.5 w-3.5" />}
              dateTime={data.invoice.issueDate}
            />
            <Row label="Base imponible" value={fmtCurrency(data.invoice.subtotal)} numeric />
            <Row label="IVA" value={fmtCurrency(data.invoice.taxTotal)} numeric />
            <Row
              label="Importe total"
              value={fmtCurrency(data.invoice.total)}
              numeric
              emphasis
            />
            <Row label="Estado" value={status.label} />
          </Card>
        </section>
      </div>

      {/* Integridad */}
      <section aria-labelledby="integrity-heading" className="mt-2">
        <SectionTitle id="integrity-heading" icon={<ShieldCheck className="h-4 w-4" />}>
          Integridad
        </SectionTitle>
        <Card>
          <Row
            label="Registrada el"
            value={fmtDateTime(data.confirmedAt)}
            icon={<Clock className="h-3.5 w-3.5" />}
            dateTime={data.confirmedAt}
          />
          <Row
            label="Consultada el"
            value={fmtDateTime(verifiedAt)}
            icon={<Clock className="h-3.5 w-3.5" />}
            dateTime={verifiedAt}
          />
          <div className="border-t px-4 py-3 first:border-t-0">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Hash className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="text-xs font-medium">SHA-256</span>
              </div>

            </div>
            <code
              className="block select-all break-all rounded-md bg-muted/50 px-3 py-2 font-mono text-[10px] leading-relaxed text-foreground sm:text-[11px]"
              aria-label="Hash SHA-256 de integridad"
            >
              {data.hashFull}
            </code>
          </div>
        </Card>
      </section>

      {/* Disclaimer VeriFactu */}
      <aside
        role="note"
        className="mt-4 flex gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300"
      >
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span>
          Verificación interna de {brandConfig.app.name}. La integración VeriFactu con la AEAT está
          en proceso — próximamente el registro será oficial.
        </span>
      </aside>
    </PageShell>
  );
}

// ---------- Sub-components ----------

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-emerald-200 bg-white px-3 py-0.5 text-xs font-medium text-emerald-800 shadow-sm dark:border-emerald-800 dark:bg-white/10 dark:text-emerald-300">
      {children}
    </span>
  );
}

function StatusChip({
  status,
  children,
}: {
  status: InvoiceStatus;
  children: React.ReactNode;
}) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-medium shadow-sm',
        meta?.chip ??
          'bg-slate-100 border-slate-300 text-slate-700 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300',
      )}
    >
      {children}
    </span>
  );
}

function SectionTitle({
  id,
  icon,
  children,
}: {
  id?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <h2
      id={id}
      className="mb-2 mt-5 flex items-center gap-1.5 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
    >
      <span aria-hidden="true">{icon}</span>
      {children}
    </h2>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <dl className="w-full divide-y rounded-xl border bg-card text-sm shadow-sm print:shadow-none">
      {children}
    </dl>
  );
}

interface RowProps {
  label: string;
  value: string;
  mono?: boolean;
  numeric?: boolean;
  emphasis?: boolean;
  icon?: React.ReactNode;
  /** ISO 8601 — when present, wraps value in <time dateTime> */
  dateTime?: string;
}

function Row({ label, value, mono, numeric, emphasis, icon, dateTime }: RowProps) {
  const valueClasses = cn(
    'text-right',
    mono && 'font-mono text-xs',
    numeric && !mono && 'tabular-nums',
    emphasis ? 'text-base font-semibold text-foreground' : 'font-medium',
  );
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <dt className="flex shrink-0 items-center gap-1.5 text-muted-foreground">
        {icon && (
          <span aria-hidden="true" className="text-muted-foreground">
            {icon}
          </span>
        )}
        <span>{label}</span>
      </dt>
      <dd className={valueClasses}>
        {dateTime ? <time dateTime={dateTime}>{value}</time> : value}
      </dd>
    </div>
  );
}

function NotFoundState() {
  return (
    <PageShell>
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 ring-4 ring-red-50 dark:bg-red-900/30 dark:ring-red-950">
          <XCircle className="h-7 w-7 text-red-500 dark:text-red-400" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-semibold">Factura no encontrada</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          No hemos podido verificar esta factura. Es posible que el enlace sea incorrecto o que la
          factura no exista en nuestro sistema.
        </p>
        <Link
          href={brandConfig.app.url}
          className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          {brandConfig.app.name}
        </Link>
      </div>
    </PageShell>
  );
}

function ErrorState() {
  return (
    <PageShell>
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 ring-4 ring-red-50 dark:bg-red-900/30 dark:ring-red-950">
          <XCircle className="h-7 w-7 text-red-500 dark:text-red-400" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-semibold">Error de verificación</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          No hemos podido completar la verificación en este momento. Inténtalo de nuevo en unos
          minutos.
        </p>
      </div>
    </PageShell>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:shadow"
      >
        Saltar al contenido
      </a>

      <header className="sticky top-0 z-10 border-b border-border/50 bg-background/80 px-4 py-3 backdrop-blur sm:px-6 lg:px-8 print:static print:bg-white print:backdrop-blur-none">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link
            href={brandConfig.app.url}
            className="flex items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={brandConfig.app.name}
          >
            <Image
              src={brandConfig.logos.main}
              alt={brandConfig.app.name}
              width={140}
              height={36}
              className="h-8 w-auto sm:h-9"
              priority
            />
          </Link>
          <span className="rounded-full border border-border/50 bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground sm:text-xs">
            Verificación pública
          </span>
        </div>
      </header>

      <main
        id="main"
        className="flex flex-1 flex-col items-center px-4 py-6 sm:px-6 sm:py-10 lg:px-8"
      >
        <div className="w-full max-w-md sm:max-w-2xl lg:max-w-4xl">{children}</div>
      </main>

      <footer className="border-t border-border/50 px-4 py-5 text-center text-[11px] text-muted-foreground sm:text-xs print:hidden">
        Verificación proporcionada por{' '}
        <Link href={brandConfig.app.url} className="underline hover:text-foreground">
          {brandConfig.app.name}
        </Link>{' '}
        · Sin cookies ni rastreadores.
      </footer>
    </div>
  );
}
