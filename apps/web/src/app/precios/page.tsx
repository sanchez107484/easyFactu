import type { Metadata } from 'next';
import { novafacturaPreciosMetadata } from '@/landing/novafactura/precios-metadata';
import { nafacturaPreciosMetadata } from '@/landing/nafactura/precios-metadata';
import { NovafacturaPreciosPage } from '@/landing/novafactura/precios-page';
import { NafacturaPreciosPage } from '@/landing/nafactura/precios-page';
import { getSignupSlots } from '@/lib/signup-slots';

const BRAND = process.env.NEXT_PUBLIC_BRAND ?? 'novafactura';

export const metadata: Metadata =
  BRAND === 'nafactura' ? nafacturaPreciosMetadata : novafacturaPreciosMetadata;

export default async function PreciosPage() {
  if (BRAND === 'nafactura') return <NafacturaPreciosPage />;
  return <NovafacturaPreciosPage slots={await getSignupSlots()} />;
}
