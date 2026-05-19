import type { Metadata } from 'next';
import {
  NovafacturaFacturaIntracomunitariaPage,
  novafacturaFacturaIntracomunitariaMetadata,
} from '@/landing/novafactura/factura-intracomunitaria-page';

export const metadata: Metadata = novafacturaFacturaIntracomunitariaMetadata;

export default function FacturaIntracomunitariaPage() {
  return <NovafacturaFacturaIntracomunitariaPage />;
}
