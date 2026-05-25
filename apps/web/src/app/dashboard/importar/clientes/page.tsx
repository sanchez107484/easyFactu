'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { ImportWizard } from '@/components/importar/import-wizard';
import { importApi } from '@/lib/api/import-api';

const COLUMNS = [
  { key: 'name', header: 'Nombre' },
  { key: 'nif', header: 'NIF / CIF' },
  {
    key: 'type',
    header: 'Tipo',
    render: (value: unknown) => {
      const labels: Record<string, string> = {
        COMPANY: 'Empresa',
        SELF_EMPLOYED: 'Autónomo',
        INDIVIDUAL: 'Particular',
        PUBLIC_ENTITY: 'Entidad Pública',
        INTRACOMMUNITY: 'Intracomunitario',
      };
      return labels[String(value ?? '')] ?? String(value ?? '—');
    },
  },
  { key: 'email', header: 'Email' },
  { key: 'phone', header: 'Teléfono' },
  { key: 'address', header: 'Dirección' },
  { key: 'city', header: 'Ciudad' },
];

export default function ImportarClientesPage() {
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
        <h1 className="text-2xl font-bold tracking-tight">Importar clientes</h1>
        <p className="text-muted-foreground mt-1">
          Sube un Excel con tus clientes para importarlos automáticamente a tu cuenta.
        </p>
      </div>

      <ImportWizard
        entityName="clientes"
        entityNameSingular="cliente"
        columns={COLUMNS}
        onPreview={importApi.previewCustomers}
        onConfirm={importApi.confirmCustomers}
        onDownloadTemplate={importApi.downloadCustomerTemplate}
        templateFileName="plantilla-clientes.xlsx"
        listHref="/dashboard/clientes"
        maxRows={200}
      />
    </div>
  );
}
