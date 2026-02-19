'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Trash2, FileText, Mail, Phone, MapPin } from 'lucide-react';
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
const customer = {
  id: '1',
  name: 'Juan Pérez García',
  nif: '12345678Z',
  email: 'juan@ejemplo.com',
  phone: '666 123 456',
  address: 'Calle Principal, 123',
  postalCode: '28001',
  city: 'Madrid',
  province: 'Madrid',
  country: 'ES',
  type: 'INDIVIDUAL',
  active: true,
  notes: 'Cliente preferente',
  createdAt: '2024-01-15',
};

const invoices = [
  {
    id: '1',
    number: 'F-2025-0001',
    issueDate: '2025-01-15',
    total: 1210.0,
    status: 'PAID',
  },
  {
    id: '2',
    number: 'F-2025-0005',
    issueDate: '2025-01-20',
    total: 605.0,
    status: 'PENDING',
  },
];

const typeLabels = {
  INDIVIDUAL: 'Particular',
  SELF_EMPLOYED: 'Autónomo',
  COMPANY: 'Empresa',
};

const statusLabels = {
  DRAFT: 'Borrador',
  CONFIRMED: 'Confirmada',
  PENDING: 'Pendiente',
  PAID: 'Pagada',
  CANCELLED: 'Anulada',
};

export default function ClienteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // TODO: Call API
      console.log('Delete customer:', params.id);
      // await apiClient.delete(`/customers/${params.id}`);
      // toast.success('Cliente eliminado correctamente');
      router.push('/dashboard/clientes');
    } catch (error) {
      console.error(error);
      // toast.error('Error al eliminar el cliente');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/clientes">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{customer.name}</h1>
            <p className="text-muted-foreground">{customer.nif}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/clientes/${params.id}/editar`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
          </Link>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. Se eliminará el cliente permanentemente, pero
                  sus facturas se conservarán.
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Tipo</p>
                <Badge variant="outline">
                  {typeLabels[customer.type as keyof typeof typeLabels]}
                </Badge>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Estado</p>
                <Badge variant={customer.active ? 'default' : 'secondary'}>
                  {customer.active ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>

              {customer.email && (
                <div className="flex items-start gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <a href={`mailto:${customer.email}`} className="text-sm hover:underline">
                      {customer.email}
                    </a>
                  </div>
                </div>
              )}

              {customer.phone && (
                <div className="flex items-start gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Teléfono</p>
                    <a href={`tel:${customer.phone}`} className="text-sm hover:underline">
                      {customer.phone}
                    </a>
                  </div>
                </div>
              )}

              {customer.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Dirección</p>
                    <p className="text-sm">{customer.address}</p>
                    <p className="text-sm">
                      {customer.postalCode} {customer.city}
                    </p>
                    <p className="text-sm">{customer.province}</p>
                  </div>
                </div>
              )}

              {customer.notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Notas</p>
                  <p className="text-sm">{customer.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Invoices */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Facturas</CardTitle>
                  <CardDescription>{invoices.length} facturas emitidas</CardDescription>
                </div>
                <Link href={`/dashboard/facturas/nueva?customerId=${customer.id}`}>
                  <Button>
                    <FileText className="mr-2 h-4 w-4" />
                    Nueva factura
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr className="text-sm text-muted-foreground">
                      <th className="pb-3 text-left font-medium">Número</th>
                      <th className="pb-3 text-left font-medium">Fecha</th>
                      <th className="pb-3 text-right font-medium">Total</th>
                      <th className="pb-3 text-left font-medium">Estado</th>
                      <th className="pb-3 text-right font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {invoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-muted/50">
                        <td className="py-3">
                          <Link
                            href={`/dashboard/facturas/${invoice.id}`}
                            className="font-medium hover:underline"
                          >
                            {invoice.number}
                          </Link>
                        </td>
                        <td className="py-3 text-sm">
                          {new Date(invoice.issueDate).toLocaleDateString('es-ES')}
                        </td>
                        <td className="py-3 text-right font-medium">
                          {invoice.total.toLocaleString('es-ES', {
                            style: 'currency',
                            currency: 'EUR',
                          })}
                        </td>
                        <td className="py-3">
                          <Badge variant={invoice.status === 'PAID' ? 'default' : 'secondary'}>
                            {statusLabels[invoice.status as keyof typeof statusLabels]}
                          </Badge>
                        </td>
                        <td className="py-3 text-right">
                          <Link href={`/dashboard/facturas/${invoice.id}`}>
                            <Button variant="ghost" size="sm">
                              Ver
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
