'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Building2,
  FileText,
  Users,
  LayoutTemplate,
  SlidersHorizontal,
  Settings,
  UserCircle,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { AccountType } from '@easyfactura/shared-types';

const BASE_SECTIONS = [
  {
    title: 'General',
    href: '/dashboard/ajustes',
    icon: Settings,
  },
  {
    title: 'Cuenta',
    href: '/dashboard/ajustes/cuenta',
    icon: UserCircle,
  },
  {
    title: 'Empresa',
    href: '/dashboard/ajustes/empresa',
    icon: Building2,
  },
  {
    title: 'Predeterminados',
    href: '/dashboard/ajustes/predeterminados',
    icon: SlidersHorizontal,
  },
  {
    title: 'Facturación',
    href: '/dashboard/ajustes/facturacion',
    icon: FileText,
  },
  {
    title: 'Plantilla PDF',
    href: '/dashboard/ajustes/plantilla',
    icon: LayoutTemplate,
  },
];

/** Rutas que necesitan ancho completo (sin sidebar ni cabecera de ajustes). */
const FULL_WIDTH_ROUTES = new Set(['/dashboard/ajustes/plantilla']);

export default function AjustesLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentTenant = useAuthStore((s) => s.currentTenant);

  if (FULL_WIDTH_ROUTES.has(pathname)) {
    return <div className="h-full">{children}</div>;
  }

  const settingsSections = [
    ...BASE_SECTIONS,
    // Solo visible para tenants no-asesoría (clientes)
    ...(currentTenant?.accountType !== AccountType.AGENCY
      ? [{ title: 'Mis asesorías', href: '/dashboard/ajustes/asesorias', icon: Users }]
      : []),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Ajustes</h1>
        <p className="mt-2 text-muted-foreground">
          Configura tu cuenta y preferencias de facturación
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[250px_1fr]">
        <nav className="space-y-1">
          {settingsSections.map((section) => {
            const Icon = section.icon;
            const isActive = pathname === section.href;

            return (
              <Link
                key={section.href}
                href={section.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )}
              >
                <Icon className="h-4 w-4" />
                {section.title}
              </Link>
            );
          })}
        </nav>

        <main>{children}</main>
      </div>
    </div>
  );
}
