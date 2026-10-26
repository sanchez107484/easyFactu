import type { Metadata } from 'next';
import {
  NovafacturaFacturaePage,
  novafacturaFacturaeMetadata,
} from '@/landing/novafactura/facturae-page';

export const metadata: Metadata = novafacturaFacturaeMetadata;

export default function FacturaePage() {
  return <NovafacturaFacturaePage />;
}
