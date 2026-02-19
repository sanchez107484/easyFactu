'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Building2, FileText, Users, CreditCard, Shield, Settings, Bell } from 'lucide-react';

const settingsSections = [
  {
    title: 'General',
    href: '/ajustes',
    icon: Settings,
  },
  {
    title: 'Empresa',
    href: '/ajustes/empresa',
    icon: Building2,
  },
  {
    title: 'Facturación',
    href: '/ajustes/facturacion',
    icon: FileText,
  },
  {
    title: 'Usuarios',
    href: '/ajustes/usuarios',
    icon: Users,
  },
  {
    title: 'Plan y Facturación',
    href: '/ajustes/plan',
    icon: CreditCard,
  },
  {
    title: 'Seguridad',
    href: '/ajustes/seguridad',
    icon: Shield,
  },
  {
    title: 'Notificaciones',
    href: '/ajustes/notificaciones',
    icon: Bell,
  },
];

export default function AjustesLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Ajustes</h1>
        <p className="mt-2 text-muted-foreground">
          Configura tu cuenta y preferencias de facturación
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[250px_1fr]">
        {/* Sidebar de navegación */}
        <aside className="space-y-1">
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
        </aside>

        {/* Contenido */}
        <main>{children}</main>
      </div>
    </div>
  );
}
