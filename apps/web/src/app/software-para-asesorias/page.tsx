import type { Metadata } from 'next';
import {
  novafacturaSoftwareParaAsesoriasMetadata,
  NovafacturaSoftwareParaAsesoriasPage,
} from '@/landing/novafactura/software-para-asesorias-page';
import {
  nafacturaSoftwareParaAsesoriasMetadata,
  NafacturaSoftwareParaAsesoriasPage,
} from '@/landing/nafactura/software-para-asesorias-page';

const BRAND = process.env.NEXT_PUBLIC_BRAND ?? 'novafactura';

export const metadata: Metadata =
  BRAND === 'nafactura'
    ? nafacturaSoftwareParaAsesoriasMetadata
    : novafacturaSoftwareParaAsesoriasMetadata;

export default function SoftwareParaAsesoriasPage() {
  return BRAND === 'nafactura' ? (
    <NafacturaSoftwareParaAsesoriasPage />
  ) : (
    <NovafacturaSoftwareParaAsesoriasPage />
  );
}