'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Filter, FileText, Download, Send, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Mock data (TODO: fetch from backend)
const invoices: any[] = [];

const statusLabels = {
  DRAFT: 'Borrador',
  CONFIRMED: 'Confirmada',
  PENDING: 'Pendiente',
  PAID: 'Pagada',
  CANCELLED: 'Anulada',
};

const statusColors = {
  DRAFT: 'secondary',
  CONFIRMED: 'outline',
  PENDING: 'default',
  PAID: 'default',
  CANCELLED: 'destructive',
} as const;

export default function FacturasPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const isEmpty = invoices.length === 0;

  if (isEmpty) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Facturas</h1>
            <p className="text-muted-foreground">Gestiona tus facturas</p>
          </div>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-2xl font-semibold mb-2">Crea tu primera factura</h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              Genera facturas profesionales en segundos. Cumple con VeriFactu automáticamente.
            </p>
            <Link href="/dashboard/facturas/nueva">
              <Button size="lg">
                <Plus className="mr-2 h-5 w-5" />
                Crear primera factura
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Facturas</h1>
          <p className="text-muted-foreground">{invoices.length} facturas en total</p>
        </div>
        <Link href="/dashboard/facturas/nueva">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nueva factura
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por número, cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                <SelectItem value="DRAFT">Borradores</SelectItem>
                <SelectItem value="CONFIRMED">Confirmadas</SelectItem>
                <SelectItem value="PENDING">Pendientes</SelectItem>
                <SelectItem value="PAID">Pagadas</SelectItem>
                <SelectItem value="CANCELLED">Anuladas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="p-4 text-left text-sm font-medium">Número</th>
                  <th className="p-4 text-left text-sm font-medium">Cliente</th>
                  <th className="p-4 text-left text-sm font-medium">Fecha</th>
                  <th className="p-4 text-right text-sm font-medium">Total</th>
                  <th className="p-4 text-left text-sm font-medium">Estado</th>
                  <th className="p-4 text-right text-sm font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {invoices.map((invoice: any) => (
                  <tr key={invoice.id} className="hover:bg-muted/50">
                    <td className="p-4">
                      <Link
                        href={`/dashboard/facturas/${invoice.id}`}
                        className="font-medium hover:underline"
                      >
                        {invoice.number}
                      </Link>
                    </td>
                    <td className="p-4">{invoice.customerName}</td>
                    <td className="p-4 text-sm">
                      {new Date(invoice.issueDate).toLocaleDateString('es-ES')}
                    </td>
                    <td className="p-4 text-right font-medium">
                      {invoice.total.toLocaleString('es-ES', {
                        style: 'currency',
                        currency: 'EUR',
                      })}
                    </td>
                    <td className="p-4">
                      <Badge variant={statusColors[invoice.status as keyof typeof statusColors]}>
                        {statusLabels[invoice.status as keyof typeof statusLabels]}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Link
                              href={`/dashboard/facturas/${invoice.id}`}
                              className="flex items-center w-full"
                            >
                              <FileText className="mr-2 h-4 w-4" />
                              Ver detalle
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="mr-2 h-4 w-4" />
                            Descargar PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Send className="mr-2 h-4 w-4" />
                            Enviar por email
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
