import type { Metadata } from 'next';
import {
  novafacturaAsesoriaFacturasMetadata,
  NovafacturaAsesoriaFacturasPage,
} from '@/landing/novafactura/asesoria-facturas-clientes-page';
import {
  nafacturaAsesoriaFacturasMetadata,
  NafacturaAsesoriaFacturasPage,
} from '@/landing/nafactura/asesoria-facturas-clientes-page';

const BRAND = process.env.NEXT_PUBLIC_BRAND ?? 'novafactura';

export const metadata: Metadata =
  BRAND === 'nafactura'
    ? nafacturaAsesoriaFacturasMetadata
    : novafacturaAsesoriaFacturasMetadata;

export default function AsesoriaFacturasClientesPage() {
  return BRAND === 'nafactura' ? (
    <NafacturaAsesoriaFacturasPage />
  ) : (
    <NovafacturaAsesoriaFacturasPage />
  );
}
