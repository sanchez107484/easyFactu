import type { Metadata } from 'next';
import {
  novafacturaAsesoriaMetadata,
  NovafacturaAsesoriaPage,
} from '@/landing/novafactura/asesoria-page';
import {
  nafacturaAsesoriaMetadata,
  NafacturaAsesoriaPage,
} from '@/landing/nafactura/asesoria-page';

const BRAND = process.env.NEXT_PUBLIC_BRAND ?? 'novafactura';

export const metadata: Metadata =
  BRAND === 'nafactura' ? nafacturaAsesoriaMetadata : novafacturaAsesoriaMetadata;

export default function AsesoriaPage() {
  return BRAND === 'nafactura' ? <NafacturaAsesoriaPage /> : <NovafacturaAsesoriaPage />;
}
