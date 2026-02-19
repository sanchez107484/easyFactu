'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Download, Send, Edit, Trash2, CheckCircle2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

// Mock data (TODO: fetch from backend)
const invoice = {
  id: '1',
  number: 'F-2025-0001',
  issueDate: '2025-01-20',
  dueDate: '2025-02-20',
  status: 'CONFIRMED',
  customer: {
    name: 'Juan Pérez García',
    nif: '12345678Z',
    address: 'Calle Principal, 123',
    postalCode: '28001',
    city: 'Madrid',
    province: 'Madrid',
  },
  lines: [
    {
      id: '1',
      description: 'Consultoría técnica - 10 horas',
      quantity: 10,
      price: 50,
      discount: 0,
      taxRate: 21,
    },
    {
      id: '2',
      description: 'Desplazamiento',
      quantity: 1,
      price: 50,
      discount: 10,
      taxRate: 21,
    },
  ],
  notes: 'Pago mediante transferencia bancaria',
};

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

export default function FacturaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  // Calculate totals
  const subtotal = invoice.lines.reduce((acc, line) => {
    return acc + line.quantity * line.price * (1 - line.discount / 100);
  }, 0);

  const taxBreakdown = invoice.lines.reduce(
    (acc, line) => {
      const lineSubtotal = line.quantity * line.price * (1 - line.discount / 100);
      const taxAmount = lineSubtotal * (line.taxRate / 100);
      const existing = acc.find((t) => t.rate === line.taxRate);
      if (existing) {
        existing.base += lineSubtotal;
        existing.amount += taxAmount;
      } else {
        acc.push({ rate: line.taxRate, base: lineSubtotal, amount: taxAmount });
      }
      return acc;
    },
    [] as Array<{ rate: number; base: number; amount: number }>,
  );

  const totalTax = taxBreakdown.reduce((acc, t) => acc + t.amount, 0);
  const total = subtotal + totalTax;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // TODO: Call API
      console.log('Delete invoice:', params.id);
      // await apiClient.delete(`/invoices/${params.id}`);
      // toast.success('Factura eliminada correctamente');
      router.push('/dashboard/facturas');
    } catch (error) {
      console.error(error);
      // toast.error('Error al eliminar la factura');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/facturas">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{invoice.number}</h1>
            <p className="text-muted-foreground">
              Emitida el {new Date(invoice.issueDate).toLocaleDateString('es-ES')}
            </p>
          </div>
        </div>
        <Badge
          variant={statusColors[invoice.status as keyof typeof statusColors]}
          className="text-base px-4 py-2"
        >
          {statusLabels[invoice.status as keyof typeof statusLabels]}
        </Badge>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Descargar PDF
        </Button>
        <Button variant="outline">
          <Send className="mr-2 h-4 w-4" />
          Enviar por email
        </Button>
        {invoice.status === 'DRAFT' && (
          <>
            <Link href={`/dashboard/facturas/${params.id}/editar`}>
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Button>
            </Link>
            <Button variant="outline">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Confirmar factura
            </Button>
          </>
        )}
        {invoice.status === 'PENDING' && (
          <Button variant="outline">
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Marcar como pagada
          </Button>
        )}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar factura?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. La factura se eliminará permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Invoice Content */}
      <Card>
        <CardContent className="p-6 md:p-10">
          {/* Customer Info */}
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-muted-foreground mb-2">CLIENTE</h2>
            <p className="font-semibold text-lg">{invoice.customer.name}</p>
            <p className="text-sm text-muted-foreground">{invoice.customer.nif}</p>
            <p className="text-sm text-muted-foreground">{invoice.customer.address}</p>
            <p className="text-sm text-muted-foreground">
              {invoice.customer.postalCode} {invoice.customer.city}, {invoice.customer.province}
            </p>
          </div>

          <Separator className="my-6" />

          {/* Lines */}
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-muted-foreground mb-4">DETALLE</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr className="text-sm text-muted-foreground">
                    <th className="pb-3 text-left font-medium">Descripción</th>
                    <th className="pb-3 text-right font-medium">Cant.</th>
                    <th className="pb-3 text-right font-medium">Precio</th>
                    <th className="pb-3 text-right font-medium">Dto.</th>
                    <th className="pb-3 text-right font-medium">IVA</th>
                    <th className="pb-3 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {invoice.lines.map((line) => {
                    const lineSubtotal = line.quantity * line.price * (1 - line.discount / 100);
                    return (
                      <tr key={line.id}>
                        <td className="py-3">{line.description}</td>
                        <td className="py-3 text-right">{line.quantity}</td>
                        <td className="py-3 text-right">
                          {line.price.toLocaleString('es-ES', {
                            style: 'currency',
                            currency: 'EUR',
                          })}
                        </td>
                        <td className="py-3 text-right">
                          {line.discount > 0 ? `${line.discount}%` : '-'}
                        </td>
                        <td className="py-3 text-right">{line.taxRate}%</td>
                        <td className="py-3 text-right font-medium">
                          {lineSubtotal.toLocaleString('es-ES', {
                            style: 'currency',
                            currency: 'EUR',
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-full md:w-96 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Base imponible:</span>
                <span className="font-medium">
                  {subtotal.toLocaleString('es-ES', {
                    style: 'currency',
                    currency: 'EUR',
                  })}
                </span>
              </div>

              {taxBreakdown.map((tax) => (
                <div key={tax.rate} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    IVA {tax.rate}% sobre{' '}
                    {tax.base.toLocaleString('es-ES', {
                      style: 'currency',
                      currency: 'EUR',
                    })}
                    :
                  </span>
                  <span className="font-medium">
                    {tax.amount.toLocaleString('es-ES', {
                      style: 'currency',
                      currency: 'EUR',
                    })}
                  </span>
                </div>
              ))}

              <Separator className="my-3" />

              <div className="flex justify-between">
                <span className="font-bold text-lg">TOTAL:</span>
                <span className="font-bold text-2xl">
                  {total.toLocaleString('es-ES', {
                    style: 'currency',
                    currency: 'EUR',
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <>
              <Separator className="my-6" />
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground mb-2">NOTAS</h2>
                <p className="text-sm">{invoice.notes}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
