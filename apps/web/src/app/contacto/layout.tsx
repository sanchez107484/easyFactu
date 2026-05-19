import type { Metadata } from 'next';
import { brandConfig } from '@easyfactura/brand-config';

export const metadata: Metadata = {
  title: `Contacto — Habla con nuestro equipo de soporte`,
  description: `¿Tienes dudas sobre ${brandConfig.app.name}? Contacta con nuestro equipo de soporte en español. Tiempo de respuesta inferior a 2 horas. Ayuda con VeriFactu, migraciones, planes y facturación electrónica.`,
  keywords: [
    'contacto software facturación',
    'soporte facturación electrónica',
    'ayuda verifactu',
    'soporte novafactura',
    'consulta facturación autónomos',
    'migración software facturación',
    'soporte español facturación',
  ],
  alternates: {
    canonical: `${brandConfig.app.url}/contacto`,
  },
  openGraph: {
    title: `Contacto — ${brandConfig.app.name}`,
    description: `Contacta con el equipo de ${brandConfig.app.name}. Soporte en español con respuesta en menos de 2 horas. Te ayudamos con VeriFactu, migraciones y cualquier duda.`,
    url: `${brandConfig.app.url}/contacto`,
    type: 'website',
    siteName: brandConfig.app.name,
    locale: 'es_ES',
    images: [
      {
        url: `${brandConfig.app.url}${brandConfig.app.ogImage}`,
        width: 1200,
        height: 630,
        alt: `${brandConfig.app.name} — Contacto`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Contacto — ${brandConfig.app.name}`,
    description: `¿Dudas sobre facturación o VeriFactu? Nuestro equipo responde en menos de 2 horas. Soporte en español.`,
    images: [`${brandConfig.app.url}${brandConfig.app.ogImage}`],
  },
};

export default function ContactoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
