import type { Metadata } from 'next';
import {
  NovafacturaFacturaElectronicaEjemplosPage,
  novafacturaFacturaElectronicaEjemplosMetadata,
} from '@/landing/novafactura/factura-electronica-ejemplos-page';

export const metadata: Metadata = novafacturaFacturaElectronicaEjemplosMetadata;

export default function FacturaElectronicaEjemplosPage() {
  return <NovafacturaFacturaElectronicaEjemplosPage />;
}
