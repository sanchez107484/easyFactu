import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { QueryProvider } from '@/components/providers/query-provider';
import { Toaster } from 'sonner';
import { brandConfig, themeConfig } from '@easyfactura/brand-config';
import './globals.css';

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
    default: 'Software de Facturación VeriFactu | Gratis hasta 2027',
    template: `%s | ${brandConfig.app.name}`,
  },
  description:
    '¿Buscas un programa de facturación VeriFactu? Evita multas de la Ley Antifraude con EasyFactura. Gratis para autónomos y Pymes hasta 2027. ¡Regístrate!',
  keywords: [
    'facturación verifactu',
    'software verifactu',
    'programa facturación autónomos',
    'ley antifraude',
    'facturación electrónica obligatoria',
    'software garante',
    'aeat',
    'reglamento facturación',
    'hash encadenado',
    'código qr facturas',
    'firma electrónica',
    'certificación aeat',
    'sistemas informáticos facturación',
    'ley 11/2021',
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
    title: 'Software de Facturación VeriFactu para Autónomos y Pymes',
    description:
      'Cumple con la Ley Antifraude 11/2021. Software de facturación VeriFactu 100% gratis hasta 2027. Hash encadenado, QR y envío a AEAT automático.',
    siteName: brandConfig.app.name,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Software de Facturación VeriFactu | Gratis hasta 2027',
    description:
      'Evita multas de la Ley Antifraude. Sistema VeriFactu con hash encadenado y envío a AEAT automático.',
  },
  icons: {
    icon: [
      { url: brandConfig.logos.favicon, sizes: 'any' },
      { url: brandConfig.logos.icon, type: 'image/png' },
    ],
    apple: { url: brandConfig.logos.icon, type: 'image/png' },
    shortcut: brandConfig.logos.favicon,
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: brandConfig.app.url,
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
            <Toaster richColors position="top-right" />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
