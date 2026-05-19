import type { Metadata } from 'next';
import {
  NovafacturaFacturasIndexPage,
  novafacturaFacturasIndexMetadata,
} from '@/landing/novafactura/facturas-index-page';

export const metadata: Metadata = novafacturaFacturasIndexMetadata;

export default function FacturasPage() {
  return <NovafacturaFacturasIndexPage />;
}
