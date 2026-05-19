import type { Metadata } from 'next';
import {
  NovafacturaVerifactuCuandoPage,
  novafacturaVerifactuCuandoMetadata,
} from '@/landing/novafactura/verifactu-cuando-page';

export const metadata: Metadata = novafacturaVerifactuCuandoMetadata;

export default function VerifactuCuandoPage() {
  return <NovafacturaVerifactuCuandoPage />;
}
