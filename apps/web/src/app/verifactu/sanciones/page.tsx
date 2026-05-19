import type { Metadata } from 'next';
import {
  NovafacturaVerifactuSancionesPage,
  novafacturaVerifactuSancionesMetadata,
} from '@/landing/novafactura/verifactu-sanciones-page';

export const metadata: Metadata = novafacturaVerifactuSancionesMetadata;

export default function VerifactuSancionesPage() {
  return <NovafacturaVerifactuSancionesPage />;
}
