import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  nafacturaPamplonaMetadata,
  NafacturaPamplonaPage,
} from '@/landing/nafactura/software-pamplona-page';

const BRAND = process.env.NEXT_PUBLIC_BRAND ?? 'novafactura';

export const metadata: Metadata = BRAND === 'nafactura' ? nafacturaPamplonaMetadata : {};

export default function SoftwareFacturacionPamplonaPage() {
  if (BRAND !== 'nafactura') {
    notFound();
  }
  return <NafacturaPamplonaPage />;
}
