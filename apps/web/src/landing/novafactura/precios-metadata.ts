import type { Metadata } from 'next';
import { brandConfig, PRICING, formatPrice } from '@easyfactura/brand-config';

export const novafacturaPreciosMetadata: Metadata = {
  title: `Precio programa VeriFactu: 0 € hasta junio 2027 | ${brandConfig.app.name}`,
  description: `¿Cuánto cuesta un programa VeriFactu? ${brandConfig.app.name}: gratis hasta el 30 de junio de 2027 y después desde ${formatPrice(PRICING.starter.annualMonthly)}€/mes, con facturas ilimitadas y VeriFactu incluido. Sin tarjeta.`,
  alternates: { canonical: `${brandConfig.app.url}/precios` },
  openGraph: {
    title: `Precio programa VeriFactu: 0 € hasta junio 2027 | ${brandConfig.app.name}`,
    description: `Gratis hasta el 30 de junio de 2027. Plan Starter desde ${formatPrice(PRICING.starter.monthly)}€/mes o Plan PRO desde ${formatPrice(PRICING.pro.monthly)}€/mes. VeriFactu incluido en todos los planes. Regístrate gratis hasta el 30 de junio de 2027 sin tarjeta.`,

    url: `${brandConfig.app.url}/precios`,
    type: 'website',
    siteName: brandConfig.app.name,
    locale: 'es_ES',
    images: [{ url: `${brandConfig.app.url}${brandConfig.app.ogImage}`, width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Precios | ${brandConfig.app.name}`,
    description: `Software VeriFactu gratis hasta el 30 de junio de 2027. Desde ${formatPrice(PRICING.starter.monthly)}€/mes.`,
    images: [`${brandConfig.app.url}${brandConfig.app.ogImage}`],
  },
  robots: { index: true, follow: true },
};
