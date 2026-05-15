import type { Metadata } from 'next';
import { brandConfig } from '@easyfactura/brand-config';

export const metadata: Metadata = {
  title: `Crear cuenta gratis | ${brandConfig.app.name}`,
  description: `Regístrate gratis en ${brandConfig.app.name}. Gratis hasta 2027, sin tarjeta de crédito. Software de facturación VeriFactu para autónomos y pymes.`,
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: `${brandConfig.app.url}/registro`,
  },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
