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
  Mail,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

interface NavSeparator {
  type: 'separator';
  label?: string;
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
  { type: 'separator', label: 'Gestión de clientes' },
  { title: 'Mi panel', href: '/dashboard/asesoria', icon: Briefcase },
  {
    title: 'Mis clientes',
    href: '/dashboard/asesoria/clientes',
    icon: UserCheck,
    description: 'Autónomos y empresas que gestionas',
  },
  {
    title: 'Invitaciones',
    href: '/dashboard/asesoria/invitaciones',
    icon: Mail,
    description: 'Historial de invitaciones enviadas',
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
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b px-4">
        {sidebarCollapsed ? (
          <Link href="/dashboard" className="flex items-center justify-center">
            <Image
              src={brandConfig.logos.icon}
              alt={brandConfig.app.shortName}
              width={32}
              height={32}
              className="object-contain"
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
            />
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebarCollapsed}
          className={cn('h-8 w-8 shrink-0', sidebarCollapsed && 'mx-auto')}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* "Acting as" return button — shown when managing a client tenant */}
      {isActingAsClient && (
        <div className="shrink-0 border-b border-customer-100 bg-customer-50/60 dark:border-customer-900 dark:bg-customer-950/30">
          <button
            onClick={returnToAgency}
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
        {navItems.map((entry, index) => {
          if ('type' in entry && entry.type === 'separator') {
            return (
              <div key={`sep-${index}`} className="px-1 pb-1 pt-2">
                <div className="border-t border-border" />
                {!sidebarCollapsed && entry.label && (
                  <p className="mt-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/50">
                    {entry.label}
                  </p>
                )}
              </div>
            );
          }

          const item = entry as NavItem;
          const Icon = item.icon;
          const isActive =
            item.href === '/dashboard' || item.href === '/dashboard/asesoria'
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
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
        })}
      </nav>

      {/* Tenant info footer */}
      {!sidebarCollapsed && currentTenant && (
        <div className="shrink-0 border-t p-4">
          <div className="text-sm">
            <div className="flex items-center gap-2">
              <p className="truncate font-medium">{currentTenant.businessName}</p>
              {currentTenant.accountType === AccountType.AGENCY && (
                <Badge variant="secondary" className="shrink-0 px-1.5 py-0 text-xs">
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
