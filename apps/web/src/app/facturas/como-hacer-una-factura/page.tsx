import type { Metadata } from 'next';
import {
  NovafacturaComoHacerFacturaPage,
  novafacturaComoHacerFacturaMetadata,
} from '@/landing/novafactura/como-hacer-factura-page';

export const metadata: Metadata = novafacturaComoHacerFacturaMetadata;

export default function ComoHacerFacturaPage() {
  return <NovafacturaComoHacerFacturaPage />;
}
