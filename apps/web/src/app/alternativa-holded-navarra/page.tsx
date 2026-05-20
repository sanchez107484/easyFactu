import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  nafacturaHoldedMetadata,
  NafacturaHoldedPage,
} from '@/landing/nafactura/alternativa-holded-page';

const BRAND = process.env.NEXT_PUBLIC_BRAND ?? 'novafactura';

export const metadata: Metadata = BRAND === 'nafactura' ? nafacturaHoldedMetadata : {};

export default function AlternativaHoldedNavarraPage() {
  if (BRAND !== 'nafactura') {
    notFound();
  }
  return <NafacturaHoldedPage />;
}
