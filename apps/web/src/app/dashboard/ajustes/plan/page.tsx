'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { CreditCard, Download, Check, Zap, Building2, Users, FileText, Crown } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const plans = [
  {
    name: 'Inicial',
    price: '0€',
    period: '/mes',
    description: 'Perfecto para empezar',
    features: [
      'Hasta 10 facturas/mes',
      '1 usuario',
      '5 clientes',
      'Soporte por email',
      'VeriFactu básico',
    ],
    current: false,
  },
  {
    name: 'Profesional',
    price: '19€',
    period: '/mes',
    description: 'Para autónomos activos',
    features: [
      'Facturas ilimitadas',
      'Hasta 3 usuarios',
      'Clientes ilimitados',
      'Soporte prioritario',
      'VeriFactu completo',
      'Informes avanzados',
      'Plantillas personalizadas',
    ],
    current: true,
    popular: true,
  },
  {
    name: 'Empresa',
    price: '49€',
    period: '/mes',
    description: 'Para equipos y gestorías',
    features: [
      'Todo del plan Profesional',
      'Usuarios ilimitados',
      'Múltiples empresas',
      'Soporte 24/7',
      'API avanzada',
      'Exportación masiva',
      'Manager dedicado',
    ],
    current: false,
  },
];

const mockInvoices = [
  {
    id: '1',
    number: 'SUB-2026-02',
    date: '2026-02-01',
    plan: 'Profesional',
    amount: 19,
    status: 'paid',
    pdfUrl: '#',
  },
  {
    id: '2',
    number: 'SUB-2026-01',
    date: '2026-01-01',
    plan: 'Profesional',
    amount: 19,
    status: 'paid',
    pdfUrl: '#',
  },
  {
    id: '3',
    number: 'SUB-2025-12',
    date: '2025-12-01',
    plan: 'Inicial',
    amount: 0,
    status: 'paid',
    pdfUrl: '#',
  },
];

export default function AjustesPlanPage() {
  const handleChangePlan = (planName: string) => {
    toast.success(`Plan ${planName} activado correctamente`);
  };

  const handleDownloadInvoice = (invoiceNumber: string) => {
    toast.success(`Descargando factura ${invoiceNumber}`);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Plan Actual
          </CardTitle>
          <CardDescription>Gestiona tu suscripción y facturación</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="border-primary bg-primary/5">
            <Zap className="h-4 w-4 text-primary" />
            <AlertDescription>
              Estás en el plan <strong>Profesional</strong>. Próximo pago:{' '}
              <strong>1 de marzo de 2026</strong> (19€)
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.name} className={plan.current ? 'border-primary shadow-lg' : ''}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription className="mt-1">{plan.description}</CardDescription>
                </div>
                {plan.popular && (
                  <Badge variant="default" className="gap-1">
                    <Zap className="h-3 w-3" />
                    Popular
                  </Badge>
                )}
              </div>
              <div className="mt-4">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground">{plan.period}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {plan.current ? (
                <Button variant="outline" className="w-full" disabled>
                  Plan actual
                </Button>
              ) : (
                <Button className="w-full" onClick={() => handleChangePlan(plan.name)}>
                  {plan.price === '0€' ? 'Cambiar a gratis' : 'Actualizar plan'}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Método de Pago
          </CardTitle>
          <CardDescription>Gestiona tu forma de pago</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-16 items-center justify-center rounded border bg-muted">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">Visa •••• 4242</p>
                <p className="text-sm text-muted-foreground">Expira 12/2027</p>
              </div>
            </div>
            <Button variant="outline">Cambiar</Button>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Facturación automática</span>
            <Badge variant="default">Activa</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historial de Facturas</CardTitle>
          <CardDescription>Facturas de suscripción emitidas</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Importe</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.number}</TableCell>
                  <TableCell>{new Date(invoice.date).toLocaleDateString('es-ES')}</TableCell>
                  <TableCell>{invoice.plan}</TableCell>
                  <TableCell className="font-semibold">
                    {invoice.amount.toLocaleString('es-ES', {
                      style: 'currency',
                      currency: 'EUR',
                    })}
                  </TableCell>
                  <TableCell>
                    <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
                      {invoice.status === 'paid' ? 'Pagada' : 'Pendiente'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-2"
                      onClick={() => handleDownloadInvoice(invoice.number)}
                    >
                      <Download className="h-3.5 w-3.5" />
                      Descargar PDF
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Uso del Plan</CardTitle>
          <CardDescription>Recursos utilizados este mes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Facturas emitidas
                </span>
                <span className="font-medium">87 / Ilimitadas</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
                <div className="h-full w-[35%] bg-primary" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Usuarios
                </span>
                <span className="font-medium">2 / 3</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
                <div className="h-full w-[66%] bg-primary" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Clientes
                </span>
                <span className="font-medium">45 / Ilimitados</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
                <div className="h-full w-[20%] bg-primary" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
