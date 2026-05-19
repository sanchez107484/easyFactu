import type { Metadata } from 'next';
import {
  NovafacturaFacturaSimplificadaPage,
  novafacturaFacturaSimplificadaMetadata,
} from '@/landing/novafactura/factura-simplificada-page';

export const metadata: Metadata = novafacturaFacturaSimplificadaMetadata;

export default function FacturaSimplificadaPage() {
  return <NovafacturaFacturaSimplificadaPage />;
}
