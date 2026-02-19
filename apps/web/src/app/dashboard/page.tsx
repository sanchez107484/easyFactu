'use client';

import { useAuthStore } from '@/store/auth-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  FileText,
  Euro,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  ArrowUpRight,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Datos de ejemplo para el gráfico (TODO: cargar desde backend)
const monthlyData = [
  { month: 'Ene', amount: 0 },
  { month: 'Feb', amount: 0 },
  { month: 'Mar', amount: 0 },
  { month: 'Abr', amount: 0 },
  { month: 'May', amount: 0 },
  { month: 'Jun', amount: 0 },
];

// Datos de ejemplo para últimas facturas (TODO: cargar desde backend)
const recentInvoices: any[] = [];

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const tenant = useAuthStore((state) => state.currentTenant);

  // TODO: Fetch real data from backend
  const isLoading = false;
  const isEmpty = recentInvoices.length === 0;

  const stats = [
    {
      title: 'Facturado este mes',
      value: '€0,00',
      change: '+0%',
      icon: Euro,
      trend: 'up',
    },
    {
      title: 'Pendiente de cobro',
      value: '€0,00',
      icon: Clock,
      description: '0 facturas',
    },
    {
      title: 'Facturas este mes',
      value: '0',
      change: '+0',
      icon: FileText,
    },
    {
      title: 'Estado VeriFactu',
      value: '0/0',
      icon: CheckCircle2,
      description: 'Enviadas/Errores',
    },
  ];

  const alerts: any[] = [
    // TODO: cargar alertas reales del backend
    // { type: 'warning', title: 'Certificado por caducar', description: 'Caduca en 30 días' },
    // { type: 'error', title: '2 errores VeriFactu', description: 'Requieren atención' },
  ];

  if (isEmpty) {
    return (
      <div className="space-y-6">
        {/* Welcome */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">¡Bienvenido, {user?.firstName}!</h1>
          <p className="text-muted-foreground">Empieza a facturar con {tenant?.businessName}</p>
        </div>

        {/* Empty State */}
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-2xl font-semibold mb-2">Aún no tienes facturas</h3>
            <p className="text-muted-foreground mb-6 text-center">
              ¡Crea tu primera factura para empezar! Es rápido y sencillo.
            </p>
            <Link href="/dashboard/facturas/nueva">
              <Button size="lg">
                <Plus className="mr-2 h-5 w-5" />
                Crear primera factura
              </Button>
            </Link>

            <div className="mt-8 grid gap-4 md:grid-cols-3 w-full max-w-2xl">
              <Card>
                <CardContent className="pt-6 text-center">
                  <FileText className="h-8 w-8 text-primary-600 mx-auto mb-2" />
                  <h4 className="font-semibold mb-1">1. Añade clientes</h4>
                  <p className="text-sm text-muted-foreground">Gestiona tu cartera de clientes</p>
                  <Link href="/dashboard/clientes/nuevo">
                    <Button variant="link" size="sm" className="mt-2">
                      Ir a clientes →
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 text-center">
                  <FileText className="h-8 w-8 text-primary-600 mx-auto mb-2" />
                  <h4 className="font-semibold mb-1">2. Añade productos</h4>
                  <p className="text-sm text-muted-foreground">Define tus servicios o productos</p>
                  <Link href="/dashboard/productos/nuevo">
                    <Button variant="link" size="sm" className="mt-2">
                      Ir a productos →
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 text-center">
                  <FileText className="h-8 w-8 text-primary-600 mx-auto mb-2" />
                  <h4 className="font-semibold mb-1">3. Factura</h4>
                  <p className="text-sm text-muted-foreground">Crea facturas en segundos</p>
                  <Link href="/dashboard/facturas/nueva">
                    <Button variant="link" size="sm" className="mt-2">
                      Crear factura →
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">¡Bienvenido, {user?.firstName}!</h1>
          <p className="text-muted-foreground">Así va tu negocio en {tenant?.businessName}</p>
        </div>
        <Link href="/dashboard/facturas/nueva">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nueva factura
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-4 rounded" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-24 mb-2" />
                  <Skeleton className="h-3 w-20" />
                </CardContent>
              </Card>
            ))
          : stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.title}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    {stat.change && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        {stat.trend === 'up' && <TrendingUp className="h-3 w-3 text-green-600" />}
                        {stat.change} vs mes anterior
                      </p>
                    )}
                    {stat.description && (
                      <p className="text-xs text-muted-foreground">{stat.description}</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
      </div>

      {/* Graph + Alerts */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Graph */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Facturación mensual</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value) => [`€${value}`, 'Facturado']}
                  contentStyle={{ borderRadius: '8px' }}
                />
                <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Alertas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-600 mb-2" />
                <p className="text-sm text-muted-foreground">Todo en orden</p>
              </div>
            ) : (
              alerts.map((alert, index) => (
                <Alert key={index} variant={alert.type === 'error' ? 'destructive' : 'default'}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>{alert.title}</AlertTitle>
                  <AlertDescription>{alert.description}</AlertDescription>
                </Alert>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Invoices */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Últimas facturas</CardTitle>
            <Link href="/dashboard/facturas">
              <Button variant="ghost" size="sm">
                Ver todas
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentInvoices.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No hay facturas recientes
              </div>
            ) : (
              <div className="space-y-3">
                {recentInvoices.slice(0, 10).map((invoice: any) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-medium">{invoice.number}</p>
                        <p className="text-sm text-muted-foreground">{invoice.customer.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-medium">€{invoice.total.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">{invoice.issueDate}</p>
                      </div>
                      <Badge>{invoice.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
