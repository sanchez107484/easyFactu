'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  FileText,
  LayoutTemplate,
  Shield,
  Users,
  Crown,
  Bell,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  SlidersHorizontal,
  UserCircle,
} from 'lucide-react';
import { useTenant } from '@/hooks/use-tenant';
import { useAuthStore } from '@/store/auth-store';
import { AccountType, Plan } from '@easyfactura/shared-types';
import { Skeleton } from '@/components/ui/skeleton';
import { QrToggleCard } from './_components/qr-toggle-card';

const PLAN_LABELS: Record<Plan, string> = {
  [Plan.FREE]: 'Gratuito',
  [Plan.BASIC]: 'Básico',
  [Plan.PROFESSIONAL]: 'Profesional',
};

const BASE_SETTINGS_SECTIONS = [
  {
    href: '/dashboard/ajustes/cuenta',
    icon: UserCircle,
    title: 'Cuenta',
    description: 'Nombre, apellidos y contraseña',
  },
  {
    href: '/dashboard/ajustes/empresa',
    icon: Building2,
    title: 'Empresa',
    description: 'Datos fiscales, logo y certificado digital',
  },
  {
    href: '/dashboard/ajustes/predeterminados',
    icon: SlidersHorizontal,
    title: 'Predeterminados',
    description: 'Valores que se pre-rellenan al crear nuevas facturas',
  },
  {
    href: '/dashboard/ajustes/facturacion',
    icon: FileText,
    title: 'Facturación',
    description: 'Series de numeración de facturas',
  },
  {
    href: '/dashboard/ajustes/plantilla',
    icon: LayoutTemplate,
    title: 'Plantilla PDF',
    description: 'Diseño y apariencia de tus facturas PDF',
  },

  /*{
    href: '/dashboard/ajustes/seguridad',
    icon: Shield,
    title: 'Seguridad',
    description: 'Autenticación en dos pasos y sesiones',
  },
  
   {
    href: '/dashboard/ajustes/usuarios',
    icon: Users,
    title: 'Usuarios',
    description: 'Tu cuenta y gestión de accesos',
  },
  {
    href: '/dashboard/ajustes/plan',
    icon: Crown,
    title: 'Plan',
    description: 'Tu suscripción actual',
  }, */
  /* {
    href: '/dashboard/ajustes/notificaciones',
    icon: Bell,
    title: 'Notificaciones',
    description: 'Preferencias de avisos y alertas',
  }, */
];

export default function AjustesPage() {
  const { data: tenant, isLoading } = useTenant();
  const currentTenant = useAuthStore((s) => s.currentTenant);

  const isAgency = currentTenant?.accountType === AccountType.AGENCY;

  const SETTINGS_SECTIONS = [
    ...BASE_SETTINGS_SECTIONS,
    ...(!isAgency
      ? [
          {
            href: '/dashboard/ajustes/asesorias',
            icon: Users,
            title: 'Mis asesorías',
            description: 'Gestorías o asesorías con acceso a tu cuenta',
          },
        ]
      : []),
  ];

  const plan = currentTenant?.plan ?? Plan.FREE;
  const hasCertificate = Boolean(tenant?.certificateUrl);
  const certificateExpiry = tenant?.certificateExpiry ? new Date(tenant.certificateExpiry) : null;
  const isCertificateExpired = certificateExpiry ? certificateExpiry < new Date() : false;
  const isCertificateExpiringSoon =
    certificateExpiry && !isCertificateExpired
      ? certificateExpiry < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      : false;

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen de tu cuenta</CardTitle>
          <CardDescription>Estado actual de tu configuración</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Empresa */}
            <div className="rounded-lg border p-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Empresa
              </p>
              {isLoading ? (
                <Skeleton className="mt-1 h-5 w-32" />
              ) : (
                <p className="mt-1 font-semibold">{tenant?.businessName ?? '—'}</p>
              )}
              {isLoading ? (
                <Skeleton className="mt-0.5 h-4 w-24" />
              ) : (
                <p className="text-sm text-muted-foreground">{tenant?.nif ?? '—'}</p>
              )}
            </div>

            {/* Plan */}
            <div className="rounded-lg border p-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Plan
              </p>
              <div className="mt-1 flex items-center gap-2">
                <p className="font-semibold">{PLAN_LABELS[plan]}</p>
                <Badge variant="secondary" className="text-xs">
                  {plan}
                </Badge>
              </div>
            </div>

            {/* Certificado digital */}
            <div className="rounded-lg border p-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Certificado Digital
              </p>
              {isLoading ? (
                <Skeleton className="mt-1 h-5 w-28" />
              ) : hasCertificate ? (
                <div className="mt-1 flex items-center gap-1.5">
                  {isCertificateExpired ? (
                    <>
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      <span className="text-sm font-medium text-destructive">Caducado</span>
                    </>
                  ) : isCertificateExpiringSoon ? (
                    <>
                      <AlertCircle className="h-4 w-4 text-warning" />
                      <span className="text-sm font-medium">Caduca pronto</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 text-secondary-600" />
                      <span className="text-sm font-medium text-secondary-600">Válido</span>
                    </>
                  )}
                </div>
              ) : (
                <div className="mt-1 flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">No configurado</span>
                </div>
              )}
              {certificateExpiry && !isLoading && (
                <p className="text-xs text-muted-foreground">
                  Expira: {certificateExpiry.toLocaleDateString('es-ES')}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <QrToggleCard />

      {/* Secciones de configuración */}
      <div className="grid gap-3 sm:grid-cols-2">
        {SETTINGS_SECTIONS.map(({ href, icon: Icon, title, description }) => (
          <Link key={href} href={href}>
            <Card className="cursor-pointer transition-colors hover:bg-muted/50">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{title}</p>
                  <p className="text-sm text-muted-foreground truncate">{description}</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
