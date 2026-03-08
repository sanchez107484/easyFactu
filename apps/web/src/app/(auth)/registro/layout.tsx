import type { Metadata } from 'next';
import { brandConfig } from '@easyfactura/brand-config';

export const metadata: Metadata = {
  title: `Crear cuenta gratis | ${brandConfig.app.name}`,
  description: `Regístrate gratis en ${brandConfig.app.name}. 6 meses sin coste, sin tarjeta de crédito. Software de facturación VeriFactu para autónomos y pymes.`,
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
