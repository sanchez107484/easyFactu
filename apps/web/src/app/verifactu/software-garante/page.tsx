import type { Metadata } from 'next';
import {
  NovafacturaVerifactuSoftwarePage,
  novafacturaVerifactuSoftwareMetadata,
} from '@/landing/novafactura/verifactu-software-garante-page';

export const metadata: Metadata = novafacturaVerifactuSoftwareMetadata;

export default function VerifactuSoftwareGarantePage() {
  return <NovafacturaVerifactuSoftwarePage />;
}
