'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { brandConfig } from '@easyfactura/brand-config';
import { useUIStore } from '@/store/ui-store';
import { useAuthStore } from '@/store/auth-store';
import { useAgencyContext } from '@/hooks/use-agency-context';
import { AccountType } from '@easyfactura/shared-types';
import {
  LayoutDashboard,
  FileText,
  Users,
  Package,
  Settings,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  RefreshCw,
  Briefcase,
  UserCheck,
  ArrowLeft,
  Loader2,
  FileDown,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  // When false, disables Next.js Link prefetching for routes that are visited rarely
  // and pull in heavy bundles (e.g. exportador, auditoría).
  prefetch?: boolean;
  /** When true, applies agency (violet) color scheme to this nav item */
  isAgency?: boolean;
}

interface NavSeparator {
  type: 'separator';
  label?: string;
  /** When true, renders as a styled agency section header instead of a plain divider */
  isAgency?: boolean;
}

type NavEntry = NavItem | NavSeparator;

// ─── Navigation sets ──────────────────────────────────────────────────────────

const defaultNavItems: NavEntry[] = [
  { title: 'Inicio', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Facturas', href: '/dashboard/facturas', icon: FileText },
  { title: 'Clientes', href: '/dashboard/clientes', icon: Users },
  { title: 'Productos', href: '/dashboard/productos', icon: Package },
  { title: 'Presupuestos', href: '/dashboard/presupuestos', icon: ClipboardList },
  { title: 'Recurrentes', href: '/dashboard/recurrentes', icon: RefreshCw },
  { title: 'Ajustes', href: '/dashboard/ajustes', icon: Settings },
];

// Nav when acting as a managed client — same structure as a normal user
const actingAsNavItems: NavEntry[] = defaultNavItems;

// Nav for the AGENCY's own tenant hub
const agencyNavItems: NavEntry[] = [
  // ── Facturación propia de la asesoría ─────────────────────────────────────
  { title: 'Inicio', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Facturas', href: '/dashboard/facturas', icon: FileText },
  {
    title: 'Clientes para facturar',
    href: '/dashboard/clientes',
    icon: Users,
    description: 'Destinatarios de tus facturas propias',
  },
  { title: 'Productos', href: '/dashboard/productos', icon: Package },
  { title: 'Presupuestos', href: '/dashboard/presupuestos', icon: ClipboardList },
  { title: 'Recurrentes', href: '/dashboard/recurrentes', icon: RefreshCw },
  { title: 'Ajustes', href: '/dashboard/ajustes', icon: Settings },

  // ── Gestión de cartera ────────────────────────────────────────────────────
  { type: 'separator', label: 'Panel de asesoría', isAgency: true },
  { title: 'Mi panel', href: '/dashboard/asesoria', icon: Briefcase, isAgency: true },
  {
    title: 'Mis clientes',
    href: '/dashboard/asesoria/clientes',
    icon: UserCheck,
    isAgency: true,
    description: 'Autónomos y empresas que gestionas',
  },
  {
    title: 'Facturas de clientes',
    href: '/dashboard/asesoria/facturas',
    icon: FileText,
    isAgency: true,
    description: 'Vista consolidada de todas las facturas',
  },
  {
    title: 'Exportar facturas',
    href: '/dashboard/asesoria/exportar',
    icon: FileDown,
    isAgency: true,
    description: 'Exporta facturas para tu programa de contabilidad',
    prefetch: false,
  },
  {
    title: 'Auditoría',
    href: '/dashboard/asesoria/auditoria',
    icon: ShieldCheck,
    isAgency: true,
    description: 'Registro de accesos a clientes',
    prefetch: false,
  },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebarCollapsed } = useUIStore();
  const currentTenant = useAuthStore((state) => state.currentTenant);
  const { agencyTenant, isOnAgencyTenant, isActingAsClient, returnToAgency, isReturning } =
    useAgencyContext();

  const navItems: NavEntry[] = isOnAgencyTenant
    ? agencyNavItems
    : isActingAsClient
      ? actingAsNavItems
      : defaultNavItems;

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col border-r bg-card transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-64',
        isActingAsClient && 'border-customer-200 dark:border-customer-800',
      )}
    >
      {/* Floating rail toggle — overlaps the right border for a clean look at any state */}
      <Button
        variant="outline"
        size="icon"
        onClick={toggleSidebarCollapsed}
        aria-label={sidebarCollapsed ? 'Expandir menú lateral' : 'Recoger menú lateral'}
        title={sidebarCollapsed ? 'Expandir menú' : 'Recoger menú'}
        className={cn(
          'absolute top-5 -right-3 z-50 h-6 w-6 rounded-full border bg-card shadow-sm',
          'hover:bg-accent hover:text-accent-foreground',
        )}
      >
        {sidebarCollapsed ? (
          <ChevronRight className="h-3.5 w-3.5" />
        ) : (
          <ChevronLeft className="h-3.5 w-3.5" />
        )}
      </Button>

      {/* Logo */}
      <div
        className={cn(
          'flex h-16 shrink-0 items-center border-b',
          sidebarCollapsed ? 'justify-center px-2' : 'px-4',
        )}
      >
        {sidebarCollapsed ? (
          <Link
            href="/dashboard"
            className="flex items-center justify-center"
            title={brandConfig.app.name}
          >
            <Image
              src={brandConfig.logos.icon}
              alt={brandConfig.app.shortName}
              width={36}
              height={36}
              className="object-contain"
              priority
            />
          </Link>
        ) : (
          <Link href="/dashboard" className="flex items-center">
            <Image
              src={brandConfig.logos.main}
              alt={brandConfig.app.name}
              width={140}
              height={80}
              className="object-contain"
              style={{ width: 'auto', height: '40px' }}
              priority
            />
          </Link>
        )}
      </div>

      {/* "Acting as" return button — shown when managing a client tenant */}
      {isActingAsClient && (
        <div className="shrink-0 border-b border-customer-100 bg-customer-50/60 dark:border-customer-900 dark:bg-customer-950/30">
          <button
            onClick={() => returnToAgency()}
            disabled={isReturning}
            className={cn(
              'flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm',
              'text-customer-700 transition-colors hover:bg-customer-100/80 dark:text-customer-300 dark:hover:bg-customer-900/50',
              'disabled:cursor-not-allowed disabled:opacity-60',
              sidebarCollapsed && 'justify-center',
            )}
            title={sidebarCollapsed ? `Volver a ${agencyTenant?.businessName}` : undefined}
          >
            {isReturning ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
            ) : (
              <ArrowLeft className="h-4 w-4 shrink-0" />
            )}
            {!sidebarCollapsed && (
              <span className="truncate font-medium">Volver a {agencyTenant?.businessName}</span>
            )}
          </button>
          {!sidebarCollapsed && (
            <p className="truncate px-3 pb-2 text-xs text-customer-500 dark:text-customer-400">
              Gestionando: {currentTenant?.businessName}
            </p>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        {(() => {
          // Split navItems into personal entries and the agency block
          const agencySepIdx = navItems.findIndex(
            (e) => 'type' in e && e.type === 'separator' && (e as NavSeparator).isAgency,
          );
          const personalEntries = agencySepIdx >= 0 ? navItems.slice(0, agencySepIdx) : navItems;
          const agencyEntries =
            agencySepIdx >= 0
              ? (navItems.slice(agencySepIdx + 1).filter((e) => !('type' in e)) as NavItem[])
              : [];
          const agencyLabel =
            agencySepIdx >= 0
              ? ((navItems[agencySepIdx] as NavSeparator).label ?? 'Panel de asesoría')
              : 'Panel de asesoría';

          const renderNavItem = (item: NavItem) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/dashboard' || item.href === '/dashboard/asesoria'
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={item.prefetch}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  sidebarCollapsed && 'justify-center',
                )}
                title={sidebarCollapsed ? item.title : undefined}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!sidebarCollapsed && (
                  <div className="min-w-0 flex-1">
                    <span className="block leading-tight">{item.title}</span>
                    {item.description && (
                      <span
                        title={item.description}
                        className={cn(
                          'mt-0.5 block truncate text-xs leading-tight',
                          isActive ? 'text-primary-foreground/70' : 'opacity-55',
                        )}
                      >
                        {item.description}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            );
          };

          const renderAgencyItem = (item: NavItem) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/dashboard' || item.href === '/dashboard/asesoria'
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={item.prefetch}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-agency-600 text-white'
                    : 'text-muted-foreground hover:bg-agency-100/80 hover:text-foreground dark:hover:bg-agency-900/40 dark:hover:text-foreground',
                  sidebarCollapsed && 'justify-center',
                )}
                title={sidebarCollapsed ? item.title : undefined}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!sidebarCollapsed && (
                  <div className="min-w-0 flex-1">
                    <span className="block leading-tight">{item.title}</span>
                    {item.description && (
                      <span
                        title={item.description}
                        className={cn(
                          'mt-0.5 block truncate text-xs leading-tight',
                          isActive ? 'text-white/70' : 'opacity-55',
                        )}
                      >
                        {item.description}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            );
          };

          return (
            <>
              {/* Personal nav items */}
              {personalEntries.map((entry) => {
                if ('type' in entry) return null;
                return renderNavItem(entry as NavItem);
              })}

              {/* Agency block */}
              {agencyEntries.length > 0 && (
                <div
                  className={cn(
                    'mt-3 overflow-hidden rounded-lg border border-agency-200/70 bg-agency-50 dark:border-agency-800/70 dark:bg-agency-950/30',
                    sidebarCollapsed ? 'p-1' : 'p-1.5',
                  )}
                >
                  {/* Header label (only when expanded) */}
                  {!sidebarCollapsed && (
                    <p className="mb-1 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-agency-600 dark:text-agency-400">
                      {agencyLabel}
                    </p>
                  )}
                  {sidebarCollapsed && (
                    <div className="mb-1 mx-1 h-0.5 rounded-full bg-agency-300 dark:bg-agency-700" />
                  )}
                  {/* Agency nav items */}
                  <div className="space-y-0.5">{agencyEntries.map(renderAgencyItem)}</div>
                </div>
              )}
            </>
          );
        })()}
      </nav>

      {/* Tenant info footer */}
      {!sidebarCollapsed && currentTenant && (
        <div className="shrink-0 border-t p-4">
          <div className="text-sm">
            <div className="flex items-center gap-2">
              <p className="truncate font-medium">{currentTenant.businessName}</p>
              {currentTenant.accountType === AccountType.AGENCY && (
                <Badge className="shrink-0 border-agency-300 bg-agency-100 px-1.5 py-0 text-xs text-agency-700 dark:border-agency-700 dark:bg-agency-900/40 dark:text-agency-300">
                  Asesoría
                </Badge>
              )}
            </div>
            <p className="truncate text-xs text-muted-foreground">{currentTenant.nif}</p>
          </div>
        </div>
      )}
    </aside>
  );
}
