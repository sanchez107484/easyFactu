import type { Metadata } from 'next';
import { novafacturaVerifactuMetadata, NovafacturaVerifactuPage } from '@/landing/novafactura/verifactu-page';
import { nafacturaVerifactuMetadata, NafacturaVerifactuPage } from '@/landing/nafactura/verifactu-page';

const BRAND = process.env.NEXT_PUBLIC_BRAND ?? 'novafactura';

export const metadata: Metadata =
  BRAND === 'nafactura' ? nafacturaVerifactuMetadata : novafacturaVerifactuMetadata;

export default function VerifactuPage() {
  return BRAND === 'nafactura' ? <NafacturaVerifactuPage /> : <NovafacturaVerifactuPage />;
}
