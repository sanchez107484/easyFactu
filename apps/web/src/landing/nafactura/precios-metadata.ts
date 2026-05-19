import type { Metadata } from 'next';
import { brandConfig, PRICING } from '@easyfactura/brand-config';

export const nafacturaPreciosMetadata: Metadata = {
  title: `Precios — Software de facturación para autónomos navarros | ${brandConfig.app.name}`,
  description: `Gratis hasta 2027 para los primeros ${PRICING.freePeriodSlots.toLocaleString('es-ES')} inscritos. Plan Starter desde ${PRICING.starter.monthly}€/mes o Plan PRO desde ${PRICING.pro.monthly}€/mes. Adaptado para Hacienda Foral de Navarra.`,
  keywords: [
    'software facturación navarra',
    'precio facturación autónomos navarra',
    'hacienda navarra autónomos precio',
    'programa facturación navarra precio',
    'verifactu navarra precio',
    `${brandConfig.app.name} precio`,
    'factura navarra gratis',
  ],
  alternates: { canonical: `${brandConfig.app.url}/precios` },
  openGraph: {
    title: `Precios | ${brandConfig.app.name} — Para autónomos navarros`,
    description: `Gratis hasta 2027. Luego desde ${PRICING.starter.monthly}€/mes. Adaptado para Hacienda Foral de Navarra.`,
    url: `${brandConfig.app.url}/precios`,
    type: 'website',
    siteName: brandConfig.app.name,
    locale: 'es_ES',
    images: [{ url: `${brandConfig.app.url}${brandConfig.app.ogImage}`, width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Precios | ${brandConfig.app.name}`,
    description: `Facturación para autónomos navarros, gratis hasta 2027. Desde ${PRICING.starter.monthly}€/mes.`,
    images: [`${brandConfig.app.url}${brandConfig.app.ogImage}`],
  },
};
