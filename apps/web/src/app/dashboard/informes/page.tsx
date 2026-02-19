'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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
import { Download, TrendingUp, FileBarChart, Calendar } from 'lucide-react';

// Mock data para desarrollo
const mockRevenueData = [
  { month: 'Ene', revenue: 12500, invoices: 45 },
  { month: 'Feb', revenue: 15200, invoices: 52 },
  { month: 'Mar', revenue: 18900, invoices: 61 },
  { month: 'Abr', revenue: 16300, invoices: 48 },
  { month: 'May', revenue: 21000, invoices: 70 },
  { month: 'Jun', revenue: 19500, invoices: 65 },
];

const mockModel303Data = {
  quarter: 'Q1 2026',
  period: 'Enero - Marzo 2026',
  totalBase: 45600,
  totalIva: 9576,
  totalIvaDeductible: 2340,
  ivaToPay: 7236,
  invoicesIssued: 158,
  invoicesReceived: 42,
};

const mockTopCustomers = [
  { name: 'Acme Corp', invoices: 12, total: 18500 },
  { name: 'TechStart SL', invoices: 8, total: 15200 },
  { name: 'Desarrollo Web SA', invoices: 15, total: 12800 },
  { name: 'Consultoría Digital', invoices: 6, total: 9500 },
  { name: 'Innovación Plus', invoices: 10, total: 8900 },
];

export default function InformesPage() {
  const [period, setPeriod] = useState('monthly');
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2026-06-30');

  const totalRevenue = mockRevenueData.reduce((sum, item) => sum + item.revenue, 0);
  const totalInvoices = mockRevenueData.reduce((sum, item) => sum + item.invoices, 0);
  const avgInvoice = totalRevenue / totalInvoices;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Informes</h1>
        <p className="mt-2 text-muted-foreground">Análisis de facturación y reportes fiscales</p>
      </div>

      {/* Filtros de fecha */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Periodo de análisis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <Label htmlFor="period">Agrupación</Label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger id="period">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Diario</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensual</SelectItem>
                  <SelectItem value="quarterly">Trimestral</SelectItem>
                  <SelectItem value="yearly">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="start-date">Fecha inicio</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="end-date">Fecha fin</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div className="flex items-end gap-2">
              <Button variant="outline" className="w-full gap-2">
                <Download className="h-4 w-4" />
                Exportar CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumen general */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Facturación Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalRevenue.toLocaleString('es-ES', {
                style: 'currency',
                currency: 'EUR',
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              {mockRevenueData.length} meses analizados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Facturas</CardTitle>
            <FileBarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInvoices}</div>
            <p className="text-xs text-muted-foreground">
              {(totalInvoices / mockRevenueData.length).toFixed(1)} facturas/mes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Medio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {avgInvoice.toLocaleString('es-ES', {
                style: 'currency',
                currency: 'EUR',
              })}
            </div>
            <p className="text-xs text-muted-foreground">Por factura emitida</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de facturación mensual */}
      <Card>
        <CardHeader>
          <CardTitle>Evolución de Facturación</CardTitle>
          <CardDescription>Ingresos mensuales del periodo seleccionado</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockRevenueData.map((item, index) => {
              const maxRevenue = Math.max(...mockRevenueData.map((d) => d.revenue));
              const percentage = (item.revenue / maxRevenue) * 100;

              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{item.month}</span>
                    <span className="text-muted-foreground">{item.invoices} facturas</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="h-8 w-full overflow-hidden rounded-md bg-secondary">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                    <span className="w-28 text-right text-sm font-semibold">
                      {item.revenue.toLocaleString('es-ES', {
                        style: 'currency',
                        currency: 'EUR',
                      })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Top clientes */}
      <Card>
        <CardHeader>
          <CardTitle>Top Clientes</CardTitle>
          <CardDescription>Mayores compradores del periodo</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-center">Facturas</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockTopCustomers.map((customer, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell className="text-center">{customer.invoices}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {customer.total.toLocaleString('es-ES', {
                      style: 'currency',
                      currency: 'EUR',
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modelo 303 */}
      <Card>
        <CardHeader>
          <CardTitle>Modelo 303 - IVA</CardTitle>
          <CardDescription>Resumen trimestral para declaración de IVA</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Periodo</p>
                <p className="text-lg font-semibold">{mockModel303Data.period}</p>
              </div>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Descargar resumen
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border p-4">
                <p className="text-sm font-medium text-muted-foreground">Base Imponible Total</p>
                <p className="mt-1 text-2xl font-bold">
                  {mockModel303Data.totalBase.toLocaleString('es-ES', {
                    style: 'currency',
                    currency: 'EUR',
                  })}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {mockModel303Data.invoicesIssued} facturas emitidas
                </p>
              </div>

              <div className="rounded-lg border p-4">
                <p className="text-sm font-medium text-muted-foreground">IVA Repercutido</p>
                <p className="mt-1 text-2xl font-bold">
                  {mockModel303Data.totalIva.toLocaleString('es-ES', {
                    style: 'currency',
                    currency: 'EUR',
                  })}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">21% sobre base imponible</p>
              </div>

              <div className="rounded-lg border p-4">
                <p className="text-sm font-medium text-muted-foreground">IVA Soportado</p>
                <p className="mt-1 text-2xl font-bold">
                  {mockModel303Data.totalIvaDeductible.toLocaleString('es-ES', {
                    style: 'currency',
                    currency: 'EUR',
                  })}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {mockModel303Data.invoicesReceived} facturas recibidas
                </p>
              </div>

              <div className="rounded-lg border border-primary bg-primary/5 p-4">
                <p className="text-sm font-medium text-primary">IVA a Ingresar</p>
                <p className="mt-1 text-2xl font-bold text-primary">
                  {mockModel303Data.ivaToPay.toLocaleString('es-ES', {
                    style: 'currency',
                    currency: 'EUR',
                  })}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Diferencia repercutido - soportado
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
