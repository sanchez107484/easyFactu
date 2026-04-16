import type { Metadata } from 'next';
import { brandConfig, PRICING } from '@easyfactura/brand-config';

export const metadata: Metadata = {
  title: `Precios — Software de facturación desde ${PRICING.starter.monthly}€/mes | ${PRICING.freePeriodMonths} meses gratis`,
  description: `Consulta los precios de ${brandConfig.app.name}. ${PRICING.freePeriodMonths} meses 100% gratis sin tarjeta. Plan Starter desde ${PRICING.starter.monthly}€/mes y Plan PRO con VeriFactu desde ${PRICING.pro.monthly}€/mes. Sin permanencia. Para autónomos y pymes.`,
  keywords: [
    'precio software facturación autónomos',
    'programa facturación gratis',
    'software facturación barato',
    'precio verifactu software',
    'programa facturación sin permanencia',
    'facturación electrónica precio',
    'comparativa precios software facturación',
    'alternativa holded precio',
    'software facturación pymes precio',
    'programa facturación 6 meses gratis',
    'facturación verifactu gratis',
    'mejor precio programa facturación',
  ],
  alternates: {
    canonical: `${brandConfig.app.url}/precios`,
  },
  openGraph: {
    title: `Precios de ${brandConfig.app.name} — ${PRICING.freePeriodMonths} meses gratis, después desde ${PRICING.starter.monthly}€/mes`,
    description: `${PRICING.freePeriodMonths} meses gratis para las primeras ${PRICING.freePeriodSlots.toLocaleString('es-ES')} plazas. Plan Starter ${PRICING.starter.monthly}€/mes. Plan PRO con VeriFactu ${PRICING.pro.monthly}€/mes. Sin tarjeta. Sin permanencia.`,
    url: `${brandConfig.app.url}/precios`,
    type: 'website',
    siteName: brandConfig.app.name,
    locale: 'es_ES',
    images: [
      {
        url: `${brandConfig.app.url}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: `${brandConfig.app.name} — Precios del software de facturación`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Precios de ${brandConfig.app.name} — ${PRICING.freePeriodMonths} meses gratis`,
    description: `Desde ${PRICING.starter.monthly}€/mes. ${PRICING.freePeriodMonths} meses gratis. Sin tarjeta. Sin permanencia. Plan PRO con VeriFactu desde ${PRICING.pro.monthly}€/mes.`,
    images: [`${brandConfig.app.url}/og-image.jpg`],
  },
};

export default function PreciosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
