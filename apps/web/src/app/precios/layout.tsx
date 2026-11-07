import type { Metadata } from 'next';
import { brandConfig, PRICING, formatPrice } from '@easyfactura/brand-config';

export const metadata: Metadata = {
  title: `Precios de ${brandConfig.app.name}: gratis hasta junio de 2027`,
  description: `Consulta los precios de ${brandConfig.app.name}. Gratis hasta el 30 de junio de 2027 sin tarjeta. Plan Starter con VeriFactu incluido desde ${formatPrice(PRICING.starter.monthly)}€/mes. Plan PRO con facturas ilimitadas desde ${formatPrice(PRICING.pro.monthly)}€/mes. Sin permanencia. Para autónomos y pymes.`,
  alternates: {
    canonical: `${brandConfig.app.url}/precios`,
  },
  openGraph: {
    title: `Precios de ${brandConfig.app.name}: gratis hasta junio de 2027`,
    description: `Gratis hasta el 30 de junio de 2027 para las primeras ${PRICING.freePeriodSlots.toLocaleString('es-ES')} plazas. Plan Starter con VeriFactu ${formatPrice(PRICING.starter.monthly)}€/mes. Plan PRO con facturas ilimitadas ${formatPrice(PRICING.pro.monthly)}€/mes. Sin tarjeta. Sin permanencia.`,
    url: `${brandConfig.app.url}/precios`,
    type: 'website',
    siteName: brandConfig.app.name,
    locale: 'es_ES',
    images: [
      {
        url: `${brandConfig.app.url}${brandConfig.app.ogImage}`,
        width: 1200,
        height: 630,
        alt: `${brandConfig.app.name} — Precios del software de facturación`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Precios de ${brandConfig.app.name}: gratis hasta junio de 2027`,
    description: `Desde ${formatPrice(PRICING.starter.monthly)}€/mes. Gratis hasta el 30 de junio de 2027. Sin tarjeta. Sin permanencia. Plan PRO con facturas ilimitadas desde ${formatPrice(PRICING.pro.monthly)}€/mes. VeriFactu incluido en ambos planes.`,
    images: [`${brandConfig.app.url}${brandConfig.app.ogImage}`],
  },
};

export default function PreciosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
