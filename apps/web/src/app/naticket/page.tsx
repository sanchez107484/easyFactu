import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  nafacturaNavicketMetadata,
  NafacturaNavicketPage,
} from '@/landing/nafactura/naticket-page';

const BRAND = process.env.NEXT_PUBLIC_BRAND ?? 'novafactura';

export const metadata: Metadata = BRAND === 'nafactura' ? nafacturaNavicketMetadata : {};

export default function NavicketPage() {
  if (BRAND !== 'nafactura') {
    notFound();
  }
  return <NafacturaNavicketPage />;
}
