import type { Metadata } from 'next';
import { novafacturaFuncionalidadesMetadata, NovafacturaFuncionalidadesPage } from '@/landing/novafactura/funcionalidades-page';
import { nafacturaFuncionalidadesMetadata, NafacturaFuncionalidadesPage } from '@/landing/nafactura/funcionalidades-page';

const BRAND = process.env.NEXT_PUBLIC_BRAND ?? 'novafactura';

export const metadata: Metadata =
  BRAND === 'nafactura' ? nafacturaFuncionalidadesMetadata : novafacturaFuncionalidadesMetadata;

export default function FuncionalidadesPage() {
  return BRAND === 'nafactura' ? <NafacturaFuncionalidadesPage /> : <NovafacturaFuncionalidadesPage />;
}
