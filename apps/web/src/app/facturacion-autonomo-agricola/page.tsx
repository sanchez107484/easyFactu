import type { Metadata } from 'next';
import {
  novafacturaReagypMetadata,
  NovafacturaReagypPage,
} from '@/landing/novafactura/reagyp-page';
import { nafacturaReagypMetadata, NafacturaReagypPage } from '@/landing/nafactura/reagyp-page';

const BRAND = process.env.NEXT_PUBLIC_BRAND ?? 'novafactura';

export const metadata: Metadata =
  BRAND === 'nafactura' ? nafacturaReagypMetadata : novafacturaReagypMetadata;

export default function FacturacionAutonomoAgricolaPage() {
  if (BRAND === 'nafactura') {
    return <NafacturaReagypPage />;
  }
  return <NovafacturaReagypPage />;
}
