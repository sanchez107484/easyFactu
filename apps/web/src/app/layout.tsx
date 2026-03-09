// app/layout.tsx
import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { QueryProvider } from '@/components/providers/query-provider';
import { Toaster } from 'sonner';
import { brandConfig, themeConfig } from '@easyfactura/brand-config';
import './globals.css';
import dynamic from 'next/dynamic';

const Analytics = dynamic(() => import('@/components/analytics/Analytics'), { ssr: false });

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: `${brandConfig.app.name} | Factura sin preocuparte de Verifactu | Gratis hasta 2027`,
    template: `%s | ${brandConfig.app.name}`,
  },
  description: `Tú haces tu factura, nosotros nos encargamos de Verifactu. Software de facturación para autónomos y pymes. 100% gratis hasta 2027. Sin tarjeta. Sin complicaciones.`,
  keywords: [
    // Keywords de alta conversión (lo que REALMENTE buscan)
    'programa facturación autónomos',
    'software facturación gratis',
    'facturación electrónica autónomos',
    'programa hacer facturas',
    'verifactu software',
    'programa facturación verifactu gratis',
    'facturación electrónica obligatoria 2025',
    'evitar multas verifactu',
    'facturar sin saber contabilidad',
    'alternativa holded',
    'software facturación sin tarjeta',
    // Keywords técnicas (para SEO de autoridad)
    'verifactu',
    'ley antifraude',
    'aeat',
    'facturación electrónica',
    'sistema garante',
  ],
  authors: [{ name: brandConfig.app.legalEntity }],
  creator: brandConfig.app.legalEntity,
  publisher: brandConfig.app.legalEntity,
  applicationName: brandConfig.app.name,
  metadataBase: new URL(brandConfig.app.url),
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: brandConfig.app.url,
    title: `${brandConfig.app.name} | Factura sin preocuparte de Verifactu`,
    description: `Tú haces tu factura, nosotros nos encargamos de Hacienda. Gratis hasta 2027. Sin tarjeta. Para autónomos y pymes.`,
    siteName: brandConfig.app.name,
    images: [
      {
        url: `${brandConfig.app.url}/og-image.jpg`, // Crea esta imagen: mockup + texto "Gratis hasta 2027"
        width: 1200,
        height: 630,
        alt: `${brandConfig.app.name} - Software de facturación Verifactu`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${brandConfig.app.name} | Factura sin preocuparte de Verifactu`,
    description: `Gratis hasta 2027. Sin tarjeta. Cumplimiento automático con Hacienda.`,
    images: [`${brandConfig.app.url}/og-image.jpg`],
  },
  icons: {
    icon: [
      { url: brandConfig.logos.favicon, sizes: 'any' },
      { url: brandConfig.logos.icon, type: 'image/png' },
    ],
    apple: { url: brandConfig.logos.icon, sizes: '180x180', type: 'image/png' },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: brandConfig.app.url,
  },
  verification: {
    google: 'TU_CODIGO_GOOGLE_SEARCH_CONSOLE', // Añade esto cuando tengas GSC
  },
};

/** Builds the CSS custom properties block from a themeConfig cssVars object */
function buildThemeCss(
  lightVars: Record<string, string>,
  darkVars: Record<string, string>,
): string {
  const toBlock = (vars: Record<string, string>) =>
    Object.entries(vars)
      .map(([k, v]) => `  --${k}: ${v};`)
      .join('\n');

  return `:root {\n${toBlock(lightVars)}\n}\n.dark {\n${toBlock(darkVars)}\n}`;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const themeCss = buildThemeCss(themeConfig.cssVars.light, themeConfig.cssVars.dark);

  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Theme CSS variables — generated from theme.config.ts at build time */}
        <style dangerouslySetInnerHTML={{ __html: themeCss }} />
      </head>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            {children}
            <Analytics />
            <Toaster richColors position="top-right" />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
