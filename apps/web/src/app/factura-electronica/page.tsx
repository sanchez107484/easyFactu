import type { Metadata } from 'next';
import {
  NovafacturaFacturaElectronicaPage,
  novafacturaFacturaElectronicaMetadata,
} from '@/landing/novafactura/factura-electronica-page';

export const metadata: Metadata = novafacturaFacturaElectronicaMetadata;

export default function FacturaElectronicaPage() {
  return <NovafacturaFacturaElectronicaPage />;
}
