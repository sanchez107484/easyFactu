import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  nafacturaMejorSoftwareMetadata,
  NafacturaMejorSoftwarePage,
} from '@/landing/nafactura/mejor-software-navarra-page';

const BRAND = process.env.NEXT_PUBLIC_BRAND ?? 'novafactura';

export const metadata: Metadata = BRAND === 'nafactura' ? nafacturaMejorSoftwareMetadata : {};

export default function MejorSoftwareFacturacionNavarraPage() {
  if (BRAND !== 'nafactura') {
    notFound();
  }
  return <NafacturaMejorSoftwarePage />;
}
