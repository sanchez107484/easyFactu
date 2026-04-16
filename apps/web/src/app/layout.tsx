// app/layout.tsx
import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import Script from 'next/script';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { QueryProvider } from '@/components/providers/query-provider';
import { Toaster } from 'sonner';
import { brandConfig, themeConfig } from '@easyfactura/brand-config';
import Analytics from '@/components/analytics/Analytics';
import CookieBanner from '@/components/analytics/CookieBanner';
import './globals.css';

const GTM_ID = 'GTM-T8W799T4';

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: brandConfig.app.name,
  url: brandConfig.app.url,
  logo: `${brandConfig.app.url}${brandConfig.logos.main}`,
  description: brandConfig.app.description,
  contactPoint: {
    '@type': 'ContactPoint',
    email: brandConfig.app.supportEmail,
    contactType: 'customer support',
    availableLanguage: 'Spanish',
  },
  sameAs: [],
};

// Consent Mode v2: set defaults synchronously before GTM loads.
// For returning visitors, read localStorage so GA4 fires immediately.
const CONSENT_INIT_SCRIPT = `
  window.dataLayer=window.dataLayer||[];
  function gtag(){dataLayer.push(arguments);}
  var _c='denied';
  try{_c=localStorage.getItem('ef_consent')==='yes'?'granted':'denied';}catch(e){}
  gtag('consent','default',{
    analytics_storage:_c,
    ad_storage:'denied',
    ad_user_data:'denied',
    ad_personalization:'denied',
    wait_for_update:_c==='denied'?500:0
  });
`;

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
    default: `${brandConfig.app.name} | Factura sin preocuparte de Verifactu | Gratis tus primeros 6 meses`,
    template: `%s | ${brandConfig.app.name}`,
  },
  description: `Tú haces tu factura, nosotros nos encargamos de Verifactu. Software de facturación para autónomos y pymes. 100% Gratis tus primeros 6 meses. Sin tarjeta. Sin complicaciones.`,
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
    description: `Tú haces tu factura, nosotros nos encargamos de Hacienda. Gratis tus primeros 6 meses. Sin tarjeta. Para autónomos y pymes.`,
    siteName: brandConfig.app.name,
    images: [
      {
        url: `${brandConfig.app.url}/og-image.jpg`, // Crea esta imagen: mockup + texto "Gratis tus primeros 6 meses"
        width: 1200,
        height: 630,
        alt: `${brandConfig.app.name} - Software de facturación Verifactu`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${brandConfig.app.name} | Factura sin preocuparte de Verifactu`,
    description: `Gratis tus primeros 6 meses. Sin tarjeta. Cumplimiento automático con Hacienda.`,
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
        {/* Preconnect to external origins for faster resource loading */}
        <link rel="preconnect" href="https://cdn.sanity.io" />
        <link rel="dns-prefetch" href="https://cdn.sanity.io" />
        {/* Organization structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        {/* Consent Mode v2 defaults — must run before GTM */}
        <script dangerouslySetInnerHTML={{ __html: CONSENT_INIT_SCRIPT }} />
        {/* Theme CSS variables — generated from theme.config.ts at build time */}
        <style dangerouslySetInnerHTML={{ __html: themeCss }} />
      </head>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        {/* GTM noscript fallback */}
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            {children}
            <Analytics />
            <CookieBanner />
            <Toaster richColors position="top-right" />
          </QueryProvider>
        </ThemeProvider>
        {/* GTM script — loads after hydration, Consent Mode v2 controls firing */}
        <Script id="gtm" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`}
        </Script>
      </body>
    </html>
  );
}
