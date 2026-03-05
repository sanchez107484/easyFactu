'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { brandConfig } from '@easyfactura/brand-config';
import { useUIStore } from '@/store/ui-store';
import { useAuthStore } from '@/store/auth-store';
import {
  LayoutDashboard,
  FileText,
  Users,
  Package,
  Shield,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  {
    title: 'Inicio',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Facturas',
    href: '/dashboard/facturas',
    icon: FileText,
  },
  {
    title: 'Clientes',
    href: '/dashboard/clientes',
    icon: Users,
  },
  {
    title: 'Productos',
    href: '/dashboard/productos',
    icon: Package,
  },
  /*{
    title: 'VeriFactu',
    href: '/dashboard/verifactu',
    icon: Shield,
  },
  {
    title: 'Informes',
    href: '/dashboard/informes',
    icon: BarChart3,
  },*/
  {
    title: 'Ajustes',
    href: '/dashboard/ajustes',
    icon: Settings,
  },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebarCollapsed } = useUIStore();
  const tenant = useAuthStore((state) => state.currentTenant);

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen border-r bg-card transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-64',
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!sidebarCollapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-lg font-bold text-primary">{brandConfig.app.name}</span>
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

      {/* Navigation */}
      <nav className="space-y-1 p-2">
        {navItems.map((item) => {
          const Icon = item.icon;

          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
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

      {/* Tenant info */}
      {!sidebarCollapsed && tenant && (
        <div className="absolute bottom-0 left-0 right-0 border-t p-4">
          <div className="text-sm">
            <p className="font-medium truncate">{tenant.businessName}</p>
            <p className="text-xs text-muted-foreground truncate">{tenant.nif}</p>
          </div>
        </div>
      )}
    </aside>
  );
}
