import type { Metadata } from 'next';
import {
  NovafacturaFacturaProformaPage,
  novafacturaFacturaProformaMetadata,
} from '@/landing/novafactura/factura-proforma-page';

export const metadata: Metadata = novafacturaFacturaProformaMetadata;

export default function FacturaProformaPage() {
  return <NovafacturaFacturaProformaPage />;
}
