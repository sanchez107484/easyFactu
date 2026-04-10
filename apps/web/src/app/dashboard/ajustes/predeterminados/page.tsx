'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SlidersHorizontal, FileText, LayoutTemplate, ExternalLink } from 'lucide-react';
import { InvoiceDefaultsForm } from '@/components/ajustes/InvoiceDefaultsForm';

export default function PredeterminadosPage() {
  return (
    <div className="space-y-6">
      {/* Cabecera descriptiva */}
      <div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        <p>
          Estos valores se aplican automáticamente al crear una nueva factura, ahorrándote tiempo de
          introducción de datos. Puedes modificarlos en cualquier factura concreta sin que afecte a
          estas preferencias.
        </p>
      </div>

      {/* Formulario principal de predeterminados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5" />
            Valores predeterminados
          </CardTitle>
          <CardDescription>
            Configura los valores que se pre-rellenarán en cada nueva factura
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InvoiceDefaultsForm />
        </CardContent>
      </Card>

      {/* Accesos rápidos a otras secciones relacionadas */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              Series de numeración
            </CardTitle>
            <CardDescription className="text-xs">
              Configura los prefijos y la numeración de tus facturas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild className="w-full gap-2">
              <Link href="/dashboard/ajustes/facturacion">
                <ExternalLink className="h-4 w-4" />
                Gestionar series
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <LayoutTemplate className="h-4 w-4" />
              Diseño del PDF
            </CardTitle>
            <CardDescription className="text-xs">
              Personaliza colores, tipografía y estructura de tus facturas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild className="w-full gap-2">
              <Link href="/dashboard/ajustes/plantilla">
                <ExternalLink className="h-4 w-4" />
                Editar plantilla
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
