'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Eye,
  Filter,
  Download,
} from 'lucide-react';

// Mock data para desarrollo
const mockLogs = [
  {
    id: '1',
    invoiceNumber: 'F-2026-001',
    status: 'ACCEPTED',
    attempts: 1,
    lastAttempt: '2026-02-19T10:30:00Z',
    message: 'Factura aceptada correctamente',
    xmlUrl: '#',
  },
  {
    id: '2',
    invoiceNumber: 'F-2026-002',
    status: 'PENDING',
    attempts: 0,
    lastAttempt: '2026-02-19T11:00:00Z',
    message: 'Pendiente de envío',
    xmlUrl: '#',
  },
  {
    id: '3',
    invoiceNumber: 'F-2026-003',
    status: 'REJECTED',
    attempts: 3,
    lastAttempt: '2026-02-19T09:45:00Z',
    message: 'XML firmado inválido - certificado caducado',
    xmlUrl: '#',
  },
  {
    id: '4',
    invoiceNumber: 'F-2026-004',
    status: 'ACCEPTED_WITH_WARNINGS',
    attempts: 2,
    lastAttempt: '2026-02-19T08:15:00Z',
    message: 'Factura aceptada con avisos menores',
    xmlUrl: '#',
  },
];

const statusConfig = {
  PENDING: {
    label: 'Pendiente',
    icon: Clock,
    variant: 'secondary' as const,
    color: 'text-muted-foreground',
  },
  SENDING: {
    label: 'Enviando',
    icon: RefreshCw,
    variant: 'default' as const,
    color: 'text-invoice-500',
  },
  ACCEPTED: {
    label: 'Aceptada',
    icon: CheckCircle2,
    variant: 'default' as const,
    color: 'text-secondary-500',
  },
  ACCEPTED_WITH_WARNINGS: {
    label: 'Aceptada con avisos',
    icon: AlertCircle,
    variant: 'default' as const,
    color: 'text-proforma-500',
  },
  REJECTED: {
    label: 'Rechazada',
    icon: XCircle,
    variant: 'destructive' as const,
    color: 'text-rectificativa-500',
  },
  ERROR: {
    label: 'Error',
    icon: XCircle,
    variant: 'destructive' as const,
    color: 'text-rectificativa-500',
  },
};

export default function VerifactuPage() {
  const [logs] = useState(mockLogs);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = logs.filter((log) => {
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    const matchesSearch = log.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const stats = {
    total: logs.length,
    accepted: logs.filter((l) => l.status === 'ACCEPTED').length,
    pending: logs.filter((l) => l.status === 'PENDING').length,
    errors: logs.filter((l) => l.status === 'REJECTED' || l.status === 'ERROR').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">VeriFactu</h1>
        <p className="mt-2 text-muted-foreground">
          Monitorización de envíos a la AEAT y gestión de logs
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Facturas</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aceptadas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-secondary-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.accepted}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-proforma-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Con Errores</CardTitle>
            <XCircle className="h-4 w-4 text-rectificativa-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.errors}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Logs de Envío</CardTitle>
          <CardDescription>Historial de envíos y respuestas de la AEAT</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="search">Buscar factura</Label>
              <Input
                id="search"
                placeholder="Número de factura..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="status">Estado</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="PENDING">Pendiente</SelectItem>
                  <SelectItem value="SENDING">Enviando</SelectItem>
                  <SelectItem value="ACCEPTED">Aceptada</SelectItem>
                  <SelectItem value="ACCEPTED_WITH_WARNINGS">Aceptada con avisos</SelectItem>
                  <SelectItem value="REJECTED">Rechazada</SelectItem>
                  <SelectItem value="ERROR">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-2">
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filtros avanzados
              </Button>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Exportar
              </Button>
            </div>
          </div>

          {/* Tabla de logs */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Factura</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Intentos</TableHead>
                  <TableHead>Último intento</TableHead>
                  <TableHead>Mensaje</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No se encontraron logs
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => {
                    const config = statusConfig[log.status as keyof typeof statusConfig];
                    const StatusIcon = config.icon;

                    return (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">{log.invoiceNumber}</TableCell>
                        <TableCell>
                          <Badge variant={config.variant} className="gap-1.5">
                            <StatusIcon className={`h-3.5 w-3.5 ${config.color}`} />
                            {config.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {log.attempts > 1 ? (
                            <span className="text-proforma-600">{log.attempts}/3</span>
                          ) : (
                            <span>{log.attempts}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(log.lastAttempt).toLocaleString('es-ES')}
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-sm">{log.message}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {(log.status === 'REJECTED' || log.status === 'ERROR') && (
                              <Button size="sm" variant="outline" className="gap-2">
                                <RefreshCw className="h-3.5 w-3.5" />
                                Reintentar
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" className="gap-2">
                              <Eye className="h-3.5 w-3.5" />
                              Ver XML
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
