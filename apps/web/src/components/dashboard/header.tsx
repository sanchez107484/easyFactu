'use client';

import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { useAgencyContext } from '@/hooks/use-agency-context';
import { DashboardUserMenu } from './user-menu';
import { ThemeToggle } from './theme-toggle';
import { ChevronRight } from 'lucide-react';
import { useInvoice } from '@/hooks/use-invoices';
import { useCustomer } from '@/hooks/use-customers';
import { useProduct } from '@/hooks/use-products';
import { useRecurringInvoice } from '@/hooks/use-recurring-invoices';
import { useAgencyClient } from '@/hooks/use-agency';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  facturas: 'Facturas',
  presupuestos: 'Presupuestos',
  clientes: 'Clientes',
  productos: 'Productos',
  ajustes: 'Ajustes',
  empresa: 'Empresa',
  facturacion: 'Facturación',
  plantilla: 'Plantilla',
  seguridad: 'Seguridad',
  usuarios: 'Usuarios',
  notificaciones: 'Notificaciones',
  plan: 'Plan',
  verifactu: 'VeriFactu',
  informes: 'Informes',
  onboarding: 'Primeros pasos',
  setup: 'Configuración',
  recurrentes: 'Recurrentes',
  importar: 'Importar',
  nueva: 'Nueva',
  nuevo: 'Nuevo',
  editar: 'Editar',
};

function InvoiceBreadcrumbLabel({ id }: { id: string }) {
  const { data } = useInvoice(id);
  return <>{data?.number ?? '…'}</>;
}

function CustomerBreadcrumbLabel({ id }: { id: string }) {
  const { data } = useCustomer(id);
  return <>{data?.name ?? '…'}</>;
}

function ProductBreadcrumbLabel({ id }: { id: string }) {
  const { data } = useProduct(id);
  return <>{data?.name ?? '…'}</>;
}

function RecurringInvoiceBreadcrumbLabel({ id }: { id: string }) {
  const { data } = useRecurringInvoice(id);
  return <>{data?.customer?.name ?? '…'}</>;
}

function AgencyClientBreadcrumbLabel({ id }: { id: string }) {
  const { data } = useAgencyClient(id);
  return <>{data?.clientTenant.businessName ?? '…'}</>;
}

function DynamicSegmentLabel({
  id,
  parentSegment,
  grandparentSegment,
}: {
  id: string;
  parentSegment: string | null;
  grandparentSegment: string | null;
}) {
  if (parentSegment === 'facturas' || parentSegment === 'presupuestos') {
    return <InvoiceBreadcrumbLabel id={id} />;
  }
  // In the asesoria context, the UUID after 'clientes' is a clientTenantId
  if (parentSegment === 'clientes' && grandparentSegment === 'asesoria') {
    return <AgencyClientBreadcrumbLabel id={id} />;
  }
  if (parentSegment === 'clientes') {
    return <CustomerBreadcrumbLabel id={id} />;
  }
  if (parentSegment === 'productos') {
    return <ProductBreadcrumbLabel id={id} />;
  }
  if (parentSegment === 'recurrentes') {
    return <RecurringInvoiceBreadcrumbLabel id={id} />;
  }
  return <>{id}</>;
}

function SegmentLabel({
  segment,
  parentSegment,
  grandparentSegment,
}: {
  segment: string;
  parentSegment: string | null;
  grandparentSegment: string | null;
}) {
  if (UUID_REGEX.test(segment)) {
    return (
      <DynamicSegmentLabel
        id={segment}
        parentSegment={parentSegment}
        grandparentSegment={grandparentSegment}
      />
    );
  }
  const label = SEGMENT_LABELS[segment];
  return <>{label ?? segment.charAt(0).toUpperCase() + segment.slice(1)}</>;
}

function resolveSegmentLabel(segment: string): string {
  return SEGMENT_LABELS[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1);
}

export function DashboardHeader() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const { isActingAsClient } = useAgencyContext();

  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs = segments.map((segment, index) => ({
    segment,
    parentSegment: index > 0 ? segments[index - 1] : null,
    grandparentSegment: index > 1 ? segments[index - 2] : null,
    href: '/' + segments.slice(0, index + 1).join('/'),
  }));

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm">
        {breadcrumbs.map((crumb, index) => (
          <div key={crumb.href} className="flex items-center gap-2">
            {index > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            <span
              className={index === breadcrumbs.length - 1 ? 'font-medium' : 'text-muted-foreground'}
            >
              <SegmentLabel
                segment={crumb.segment}
                parentSegment={crumb.parentSegment}
                grandparentSegment={crumb.grandparentSegment}
              />
            </span>
          </div>
        ))}
      </div>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-4">
        <ThemeToggle />
        <DashboardUserMenu user={user} />
      </div>
    </header>
  );
}
