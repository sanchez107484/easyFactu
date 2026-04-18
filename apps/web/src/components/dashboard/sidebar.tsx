'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { brandConfig } from '@easyfactura/brand-config';
import { useUIStore } from '@/store/ui-store';
import { useAuthStore } from '@/store/auth-store';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

// ─── Navigation sets ──────────────────────────────────────────────────────────

const defaultNavItems: NavItem[] = [
  { title: 'Inicio', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Facturas', href: '/dashboard/facturas', icon: FileText },
  { title: 'Clientes', href: '/dashboard/clientes', icon: Users },
  { title: 'Productos', href: '/dashboard/productos', icon: Package },
  { title: 'Presupuestos', href: '/dashboard/presupuestos', icon: ClipboardList },
  { title: 'Recurrentes', href: '/dashboard/recurrentes', icon: RefreshCw },
  { title: 'Ajustes', href: '/dashboard/ajustes', icon: Settings },
];

// Nav when agency is operating inside a client tenant ("acting as")
const actingAsNavItems: NavItem[] = [
  { title: 'Inicio', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Facturas', href: '/dashboard/facturas', icon: FileText },
  { title: 'Clientes', href: '/dashboard/clientes', icon: Users },
  { title: 'Productos', href: '/dashboard/productos', icon: Package },
  { title: 'Presupuestos', href: '/dashboard/presupuestos', icon: ClipboardList },
  { title: 'Recurrentes', href: '/dashboard/recurrentes', icon: RefreshCw },
  { title: 'Ajustes', href: '/dashboard/ajustes', icon: Settings },
];

// Nav for the AGENCY's own tenant hub
const agencyNavItems: NavItem[] = [
  { title: 'Mi panel', href: '/dashboard/asesoria', icon: Briefcase },
  { title: 'Mis clientes', href: '/dashboard/asesoria/clientes', icon: UserCheck },
  { title: 'Directorio', href: '/dashboard/clientes', icon: Users },
  { title: 'Ajustes', href: '/dashboard/ajustes', icon: Settings },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebarCollapsed } = useUIStore();
  const currentTenant = useAuthStore((state) => state.currentTenant);
  const tenants = useAuthStore((state) => state.tenants);

  // Determine which nav items to show
  const agencyTenantInfo = tenants.find(
    (t) => t.tenant.accountType === AccountType.AGENCY && t.isOwner,
  );
  const isAgencyUser = agencyTenantInfo !== undefined;
  const isInAgencyOwnTenant = isAgencyUser && currentTenant?.id === agencyTenantInfo!.tenant.id;
  const isActingAsClient =
    isAgencyUser && currentTenant !== null && currentTenant.id !== agencyTenantInfo!.tenant.id;

  const navItems = isInAgencyOwnTenant
    ? agencyNavItems
    : isActingAsClient
      ? actingAsNavItems
      : defaultNavItems;

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen border-r bg-card transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-64',
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b px-4">
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
          className={cn('h-8 w-8', sidebarCollapsed && 'mx-auto')}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Agency badge while acting as client */}
      {!sidebarCollapsed && isActingAsClient && (
        <div className="border-b border-indigo-100 bg-indigo-50/50 px-3 py-2 dark:border-indigo-900 dark:bg-indigo-950/20">
          <p className="truncate text-xs font-medium text-indigo-600 dark:text-indigo-400">
            {agencyTenantInfo!.tenant.businessName}
          </p>
        </div>
      )}

      {/* Navigation */}
      <nav className="space-y-1 p-2">
        {navItems.map((item) => {
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
              {!sidebarCollapsed && <span>{item.title}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Tenant info footer */}
      {!sidebarCollapsed && currentTenant && (
        <div className="absolute bottom-0 left-0 right-0 border-t p-4">
          <div className="text-sm">
            <div className="flex items-center gap-2">
              <p className="font-medium truncate">{currentTenant.businessName}</p>
              {currentTenant.accountType === AccountType.AGENCY && (
                <Badge variant="secondary" className="shrink-0 text-xs px-1.5 py-0">
                  Asesoría
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">{currentTenant.nif}</p>
          </div>
        </div>
      )}
    </aside>
  );
}
