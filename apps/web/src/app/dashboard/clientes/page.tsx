'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, Search, MoreVertical, Edit, Trash2, UserPlus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Datos de ejemplo (TODO: fetch from backend)
const customers: any[] = [];

export default function ClientesPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const isEmpty = customers.length === 0;

  if (isEmpty) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
            <p className="text-muted-foreground">Gestiona tu cartera de clientes</p>
          </div>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <UserPlus className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-2xl font-semibold mb-2">Añade tu primer cliente</h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              Los clientes son esenciales para facturar. Crea tu primer cliente para empezar.
            </p>
            <Link href="/dashboard/clientes/nuevo">
              <Button size="lg">
                <Plus className="mr-2 h-5 w-5" />
                Crear primer cliente
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
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">{customers.length} clientes en total</p>
        </div>
        <Link href="/dashboard/clientes/nuevo">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo cliente
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, NIF o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
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
                  <th className="p-4 text-left text-sm font-medium">Nombre</th>
                  <th className="p-4 text-left text-sm font-medium">NIF</th>
                  <th className="p-4 text-left text-sm font-medium">Email</th>
                  <th className="p-4 text-left text-sm font-medium">Ciudad</th>
                  <th className="p-4 text-left text-sm font-medium">Tipo</th>
                  <th className="p-4 text-left text-sm font-medium">Estado</th>
                  <th className="p-4 text-right text-sm font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {customers.map((customer: any) => (
                  <tr key={customer.id} className="hover:bg-muted/50 cursor-pointer">
                    <td className="p-4">
                      <Link
                        href={`/dashboard/clientes/${customer.id}`}
                        className="font-medium hover:underline"
                      >
                        {customer.name}
                      </Link>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{customer.nif}</td>
                    <td className="p-4 text-sm">{customer.email}</td>
                    <td className="p-4 text-sm">{customer.city}</td>
                    <td className="p-4">
                      <Badge variant="outline">{customer.type}</Badge>
                    </td>
                    <td className="p-4">
                      <Badge variant={customer.active ? 'default' : 'secondary'}>
                        {customer.active ? 'Activo' : 'Inactivo'}
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
                              href={`/dashboard/clientes/${customer.id}`}
                              className="flex items-center"
                            >
                              <FileText className="mr-2 h-4 w-4" />
                              Ver detalle
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Link
                              href={`/dashboard/clientes/${customer.id}/editar`}
                              className="flex items-center"
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
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
