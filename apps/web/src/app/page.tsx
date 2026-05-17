import type { Metadata } from 'next';
import { novafacturaHomeMetadata, NovafacturaHomePage } from '@/landing/novafactura/home-page';
import { nafacturaHomeMetadata, NafacturaHomePage } from '@/landing/nafactura/home-page';

const BRAND = process.env.NEXT_PUBLIC_BRAND ?? 'novafactura';

export const metadata: Metadata =
  BRAND === 'nafactura' ? nafacturaHomeMetadata : novafacturaHomeMetadata;

export default function HomePage() {
  return BRAND === 'nafactura' ? <NafacturaHomePage /> : <NovafacturaHomePage />;
}
