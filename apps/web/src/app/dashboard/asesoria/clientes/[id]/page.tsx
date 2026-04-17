'use client';

import { useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import {
  useAgencyClient,
  useRevokeClient,
  useUpdateClientNotes,
  useExportContaPlus,
  useClientFiscalAlerts,
} from '@/hooks/use-agency';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { InvoiceStatusBadge } from '@/components/common/invoice-status-badge';
import {
  ArrowLeft,
  LayoutDashboard,
  Trash2,
  Building2,
  Phone,
  Mail,
  MapPin,
  FileText,
  TrendingUp,
  Clock,
  StickyNote,
  Check,
  X,
  Download,
  AlertTriangle,
  AlertCircle,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { AccountType } from '@easyfactura/shared-types';
import type { FiscalAlert } from '@easyfactura/shared-types';

interface PageProps {
  params: Promise<{ id: string }>;
}

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2];
const QUARTER_OPTIONS = [
  { value: '', label: 'Año completo' },
  { value: '1', label: '1er trimestre (Ene-Mar)' },
  { value: '2', label: '2º trimestre (Abr-Jun)' },
  { value: '3', label: '3er trimestre (Jul-Sep)' },
  { value: '4', label: '4º trimestre (Oct-Dic)' },
];

function FiscalAlertRow({ alert }: { alert: FiscalAlert }) {
  const config = {
    error: {
      icon: AlertCircle,
      className:
        'border-destructive/30 bg-destructive/5 text-destructive dark:border-destructive/50 dark:bg-destructive/10',
      iconClass: 'text-destructive',
    },
    warning: {
      icon: AlertTriangle,
      className:
        'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/20 dark:text-amber-400',
      iconClass: 'text-amber-600 dark:text-amber-400',
    },
    info: {
      icon: Info,
      className:
        'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800/50 dark:bg-blue-950/20 dark:text-blue-400',
      iconClass: 'text-blue-600 dark:text-blue-400',
    },
  }[alert.type];

  const Icon = config.icon;

  return (
    <div className={cn('flex items-start gap-3 rounded-lg border p-3', config.className)}>
      <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', config.iconClass)} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-snug">{alert.title}</p>
        <p className="mt-0.5 text-xs opacity-80">{alert.description}</p>
        {alert.invoiceNumber && (
          <p className="mt-1 text-xs font-mono opacity-60">{alert.invoiceNumber}</p>
        )}
      </div>
    </div>
  );
}

export default function AgencyClientDetailPage({ params }: PageProps) {
  const { id: clientTenantId } = use(params);
  const router = useRouter();
  const currentTenant = useAuthStore((state) => state.currentTenant);
  const switchTenant = useAuthStore((state) => state.switchTenant);

  const [revokeOpen, setRevokeOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportYear, setExportYear] = useState(String(CURRENT_YEAR));
  const [exportQuarter, setExportQuarter] = useState('');
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState('');

  const { data, isLoading, error } = useAgencyClient(clientTenantId);
  const { revokeClient, isPending: isRevoking } = { revokeClient: useRevokeClient().mutate, isPending: useRevokeClient().isPending };
  const { mutate: updateNotes, isPending: isSavingNotes } = useUpdateClientNotes();
  const { mutate: exportContaPlus, isPending: isExporting } = useExportContaPlus();
  const { data: fiscalAlerts, isLoading: isLoadingAlerts } = useClientFiscalAlerts(clientTenantId);

  const isAgency = currentTenant?.accountType === AccountType.AGENCY;

  if (!isAgency) {
    router.replace('/dashboard');
    return null;
  }

  const handleManage = async () => {
    await switchTenant(clientTenantId);
    router.push('/dashboard');
  };

  const handleRevoke = () => {
    revokeClient(clientTenantId, {
      onSuccess: () => {
        setRevokeOpen(false);
        router.push('/dashboard/asesoria/clientes');
      },
    });
  };

  const handleStartEditNotes = () => {
    setNotesValue(data?.notes ?? '');
    setEditingNotes(true);
  };

  const handleSaveNotes = () => {
    updateNotes({ clientTenantId, notes: notesValue }, { onSuccess: () => setEditingNotes(false) });
  };

  const handleExport = () => {
    exportContaPlus(
      {
        clientTenantId,
        params: {
          year: parseInt(exportYear, 10),
          quarter: exportQuarter ? parseInt(exportQuarter, 10) : undefined,
        },
      },
      { onSuccess: () => setExportOpen(false) },
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <p className="font-medium text-destructive">No se pudo cargar la información del cliente</p>
        <Link href="/dashboard/asesoria/clientes">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a clientes
          </Button>
        </Link>
      </div>
    );
  }

  const client = data.clientTenant;
  const errorAlerts = fiscalAlerts?.filter((a) => a.type === 'error') ?? [];
  const hasAlerts = (fiscalAlerts?.length ?? 0) > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link href="/dashboard/asesoria/clientes">
            <Button variant="ghost" size="icon" className="mt-0.5 h-8 w-8 shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{client.businessName}</h1>
              {errorAlerts.length > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errorAlerts.length} alerta{errorAlerts.length > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {client.nif}
              {client.city && ` · ${client.city}`}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => setExportOpen(true)}>
            <Download className="mr-2 h-4 w-4" />
            Exportar ContaPlus
          </Button>
          <Button onClick={handleManage}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Gestionar
          </Button>
          <Button
            variant="outline"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setRevokeOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Revocar acceso
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Facturas emitidas
                </p>
                <p className="mt-1 text-2xl font-bold">{data.stats.totalInvoices}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/30">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Pendientes de cobro
                </p>
                <p className="mt-1 text-2xl font-bold">{data.stats.pendingInvoices}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-50 dark:bg-orange-950/30">
                <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Facturación este mes
                </p>
                <p className="mt-1 text-2xl font-bold">
                  {formatCurrency(data.stats.monthlyRevenue)}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50 dark:bg-green-950/30">
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fiscal alerts */}
      {(isLoadingAlerts || hasAlerts) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <ShieldAlert className="h-4 w-4" />
              Revisión fiscal preventiva
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingAlerts ? (
              <div className="space-y-2">
                <Skeleton className="h-14 rounded-lg" />
                <Skeleton className="h-14 rounded-lg" />
              </div>
            ) : hasAlerts ? (
              <div className="space-y-2">
                {fiscalAlerts!.map((alert, i) => (
                  <FiscalAlertRow key={`${alert.code}-${i}`} alert={alert} />
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Client info */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Building2 className="h-4 w-4" />
                Datos del cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {client.email && (
                <div className="flex items-start gap-2">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <a
                    href={`mailto:${client.email}`}
                    className="text-primary hover:underline break-all"
                  >
                    {client.email}
                  </a>
                </div>
              )}
              {client.phone && (
                <div className="flex items-start gap-2">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <a href={`tel:${client.phone}`} className="hover:underline">
                    {client.phone}
                  </a>
                </div>
              )}
              {(client.address || client.city) && (
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {[client.address, client.postalCode, client.city, client.province]
                      .filter(Boolean)
                      .join(', ')}
                  </span>
                </div>
              )}
              <div className="pt-1 border-t">
                <p className="text-xs text-muted-foreground">
                  Cliente desde{' '}
                  <span className="font-medium text-foreground">{formatDate(data.createdAt)}</span>
                </p>
                {!client.setupCompleted && (
                  <Badge
                    variant="outline"
                    className="mt-2 border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400"
                  >
                    Configuración pendiente
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <StickyNote className="h-4 w-4" />
                  Notas internas
                </CardTitle>
                {!editingNotes && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={handleStartEditNotes}
                  >
                    Editar
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {editingNotes ? (
                <div className="space-y-2">
                  <Textarea
                    value={notesValue}
                    onChange={(e) => setNotesValue(e.target.value)}
                    placeholder="Añade notas internas sobre este cliente..."
                    rows={4}
                    className="resize-none text-sm"
                    autoFocus
                  />
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingNotes(false)}
                      disabled={isSavingNotes}
                    >
                      <X className="mr-1 h-3.5 w-3.5" />
                      Cancelar
                    </Button>
                    <Button size="sm" onClick={handleSaveNotes} disabled={isSavingNotes}>
                      <Check className="mr-1 h-3.5 w-3.5" />
                      Guardar
                    </Button>
                  </div>
                </div>
              ) : data.notes ? (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{data.notes}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Sin notas. Haz clic en Editar para añadir.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent invoices */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <FileText className="h-4 w-4" />
                  Últimas facturas
                </CardTitle>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleManage}>
                  Ver todas
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {data.recentInvoices.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                  <FileText className="h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    Este cliente no tiene facturas aún
                  </p>
                  <Button size="sm" variant="outline" onClick={handleManage}>
                    <LayoutDashboard className="mr-1.5 h-3.5 w-3.5" />
                    Ir al dashboard del cliente
                  </Button>
                </div>
              ) : (
                <div className="divide-y">
                  {data.recentInvoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {invoice.number ?? 'Sin número'}
                          {invoice.customer && (
                            <span className="ml-2 font-normal text-muted-foreground">
                              · {invoice.customer.name}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(invoice.issueDate)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <InvoiceStatusBadge status={invoice.status} />
                        <span className="text-sm font-semibold tabular-nums">
                          {formatCurrency(invoice.total)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Export ContaPlus dialog */}
      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Exportar a ContaPlus
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Genera un archivo <code className="text-xs">.txt</code> compatible con ContaPlus con
              las facturas confirmadas del período seleccionado.
            </p>

            <div className="space-y-1.5">
              <Label htmlFor="export-year">Año</Label>
              <Select value={exportYear} onValueChange={setExportYear}>
                <SelectTrigger id="export-year">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {YEAR_OPTIONS.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="export-quarter">Período</Label>
              <Select value={exportQuarter} onValueChange={setExportQuarter}>
                <SelectTrigger id="export-quarter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {QUARTER_OPTIONS.map((q) => (
                    <SelectItem key={q.value} value={q.value}>
                      {q.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={isExporting}>
                Cancelar
              </Button>
            </DialogClose>
            <Button onClick={handleExport} disabled={isExporting}>
              {isExporting ? (
                'Generando...'
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Descargar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke confirmation */}
      <AlertDialog open={revokeOpen} onOpenChange={setRevokeOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revocar acceso</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres revocar el acceso a{' '}
              <strong>{client.businessName}</strong>? Dejarás de poder gestionar su facturación. Los
              datos del cliente no se eliminarán.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevoke}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isRevoking}
            >
              Revocar acceso
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

                    Editar
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {editingNotes ? (
                <div className="space-y-2">
                  <Textarea
                    value={notesValue}
                    onChange={(e) => setNotesValue(e.target.value)}
                    placeholder="Añade notas internas sobre este cliente..."
                    rows={4}
                    className="resize-none text-sm"
                    autoFocus
                  />
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingNotes(false)}
                      disabled={isSavingNotes}
                    >
                      <X className="mr-1 h-3.5 w-3.5" />
                      Cancelar
                    </Button>
                    <Button size="sm" onClick={handleSaveNotes} disabled={isSavingNotes}>
                      <Check className="mr-1 h-3.5 w-3.5" />
                      Guardar
                    </Button>
                  </div>
                </div>
              ) : data.notes ? (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{data.notes}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Sin notas. Haz clic en Editar para añadir.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent invoices */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <FileText className="h-4 w-4" />
                  Últimas facturas
                </CardTitle>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleManage}>
                  Ver todas
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {data.recentInvoices.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                  <FileText className="h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    Este cliente no tiene facturas aún
                  </p>
                  <Button size="sm" variant="outline" onClick={handleManage}>
                    <LayoutDashboard className="mr-1.5 h-3.5 w-3.5" />
                    Ir al dashboard del cliente
                  </Button>
                </div>
              ) : (
                <div className="divide-y">
                  {data.recentInvoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {invoice.number ?? 'Sin número'}
                          {invoice.customer && (
                            <span className="ml-2 font-normal text-muted-foreground">
                              · {invoice.customer.name}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(invoice.issueDate)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <InvoiceStatusBadge status={invoice.status} />
                        <span className="text-sm font-semibold tabular-nums">
                          {formatCurrency(invoice.total)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Revoke confirmation */}
      <AlertDialog open={revokeOpen} onOpenChange={setRevokeOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revocar acceso</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres revocar el acceso a{' '}
              <strong>{client.businessName}</strong>? Dejarás de poder gestionar su facturación. Los
              datos del cliente no se eliminarán.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevoke}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isRevoking}
            >
              Revocar acceso
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
