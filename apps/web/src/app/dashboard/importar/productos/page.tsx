'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { ImportWizard } from '@/components/importar/import-wizard';
import { importApi } from '@/lib/api/import-api';

const COLUMNS = [
  { key: 'name', header: 'Nombre' },
  {
    key: 'unitPrice',
    header: 'Precio',
    render: (value: unknown) => {
      const num = Number(value);
      if (isNaN(num)) return '—';
      return num.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
    },
  },
  {
    key: 'taxRate',
    header: 'IVA',
    render: (value: unknown) => (value != null ? `${value}%` : '—'),
  },
  {
    key: 'irpfRate',
    header: 'IRPF',
    render: (value: unknown) => (value != null && Number(value) > 0 ? `${value}%` : '—'),
  },
  { key: 'unit', header: 'Unidad' },
  { key: 'reference', header: 'Referencia' },
  {
    key: 'type',
    header: 'Tipo',
    render: (value: unknown) => {
      const labels: Record<string, string> = {
        PRODUCT: 'Producto',
        SERVICE: 'Servicio',
      };
      return labels[String(value ?? '')] ?? String(value ?? '—');
    },
  },
];

export default function ImportarProductosPage() {
  return (
    <div className="space-y-6 pb-6">
      {/* Back link */}
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard/importar"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Volver a Importar
        </Link>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Importar productos y servicios</h1>
        <p className="text-muted-foreground mt-1">
          Sube un Excel con tu catálogo para importarlo automáticamente a tu cuenta.
        </p>
      </div>

      <ImportWizard
        entityName="productos"
        entityNameSingular="producto"
        columns={COLUMNS}
        onPreview={importApi.previewProducts}
        onConfirm={importApi.confirmProducts}
        onDownloadTemplate={importApi.downloadProductTemplate}
        templateFileName="plantilla-productos.xlsx"
        listHref="/dashboard/productos"
        maxRows={200}
      />
    </div>
  );
}
