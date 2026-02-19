'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, MoreVertical, Edit, Trash2, Package } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Mock data (TODO: fetch from backend)
const products: any[] = [];

export default function ProductosPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const isEmpty = products.length === 0;

  if (isEmpty) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Productos y servicios</h1>
            <p className="text-muted-foreground">Gestiona tu catálogo de productos</p>
          </div>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Package className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-2xl font-semibold mb-2">Añade tu primer producto</h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              Los productos te permiten facturar más rápido. Define una vez, úsalo muchas veces.
            </p>
            <Link href="/dashboard/productos/nuevo">
              <Button size="lg">
                <Plus className="mr-2 h-5 w-5" />
                Crear primer producto
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
          <h1 className="text-3xl font-bold tracking-tight">Productos y servicios</h1>
          <p className="text-muted-foreground">{products.length} productos en total</p>
        </div>
        <Link href="/dashboard/productos/nuevo">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo producto
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
                placeholder="Buscar por nombre, referencia o código..."
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
                  <th className="p-4 text-left text-sm font-medium">Referencia</th>
                  <th className="p-4 text-left text-sm font-medium">Tipo</th>
                  <th className="p-4 text-right text-sm font-medium">Precio</th>
                  <th className="p-4 text-right text-sm font-medium">IVA</th>
                  <th className="p-4 text-right text-sm font-medium">PVP</th>
                  <th className="p-4 text-right text-sm font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {products.map((product: any) => (
                  <tr key={product.id} className="hover:bg-muted/50">
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{product.name}</p>
                        {product.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {product.description}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{product.reference}</td>
                    <td className="p-4">
                      <Badge variant="outline">
                        {product.type === 'PRODUCT' ? 'Producto' : 'Servicio'}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      {product.price.toLocaleString('es-ES', {
                        style: 'currency',
                        currency: 'EUR',
                      })}
                    </td>
                    <td className="p-4 text-right">{product.taxRate}%</td>
                    <td className="p-4 text-right font-medium">
                      {(product.price * (1 + product.taxRate / 100)).toLocaleString('es-ES', {
                        style: 'currency',
                        currency: 'EUR',
                      })}
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
                              href={`/dashboard/productos/${product.id}/editar`}
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
