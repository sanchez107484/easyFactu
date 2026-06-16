import type { Metadata } from 'next';
import { brandConfig, PRICING } from '@easyfactura/brand-config';

export const novafacturaPreciosMetadata: Metadata = {
  title: `Precios — Software de facturación VeriFactu | ${brandConfig.app.name}`,
  description: `Gratis hasta 2027 para los primeros ${PRICING.freePeriodSlots.toLocaleString('es-ES')} inscritos. Plan Starter desde ${PRICING.starter.monthly}€/mes o Plan PRO desde ${PRICING.pro.monthly}€/mes con VeriFactu automático incluido.`,
  keywords: [
    'precio software facturación',
    'verifactu precio',
    'programa facturación autónomos precio',
    'software facturación pymes precio',
    'factura electrónica precio',
    'verifactu gratis',
    `${brandConfig.app.name} precio`,
  ],
  alternates: { canonical: `${brandConfig.app.url}/precios` },
  openGraph: {
    title: `Precios | ${brandConfig.app.name}`,
    description: `Gratis hasta 2027. Luego desde ${PRICING.starter.monthly}€/mes.`,
    url: `${brandConfig.app.url}/precios`,
    type: 'website',
    siteName: brandConfig.app.name,
    locale: 'es_ES',
    images: [{ url: `${brandConfig.app.url}${brandConfig.app.ogImage}`, width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Precios | ${brandConfig.app.name}`,
    description: `Software VeriFactu gratis hasta 2027. Desde ${PRICING.starter.monthly}€/mes.`,
    images: [`${brandConfig.app.url}${brandConfig.app.ogImage}`],
  },
  robots: { index: true, follow: true },
};
