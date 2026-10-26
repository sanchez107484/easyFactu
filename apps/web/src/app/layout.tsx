// app/layout.tsx
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Inter, JetBrains_Mono } from 'next/font/google';
import Script from 'next/script';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { QueryProvider } from '@/components/providers/query-provider';
import { Toaster } from 'sonner';
import { brandConfig, themeConfig } from '@easyfactura/brand-config';
import Analytics from '@/components/analytics/Analytics';
import CookieBanner from '@/components/analytics/CookieBanner';
import { SignupAttributionTracker } from '@/components/analytics/signup-attribution-tracker';
import { NavigationProgress } from '@/components/navigation-progress';
import { organizationJsonLd } from '@/lib/structured-data';
import './globals.css';

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID ?? 'GTM-T8W799T4';

// WebSite schema signals the canonical home URL and site name to the Knowledge Graph.
// SpeakableSpecification tells LLMs which content is most important to cite.
const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: brandConfig.app.name,
  url: brandConfig.app.url,
  description: brandConfig.app.description,
  inLanguage: 'es',
  publisher: { '@id': organizationJsonLd['@id'] },
  speakable: {
    '@type': 'SpeakableSpecification',
    cssSelector: ['h1', '[data-speakable]'],
    xpath: ['/html/head/title', '/html/head/meta[@name="description"]/@content'],
  },
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
  // Only used in blog code blocks and the dashboard — don't preload it on every page.
  preload: false,
});

export const metadata: Metadata = {
  title: {
    default: `${brandConfig.app.name} | Factura sin preocuparte de VeriFactu | Gratis hasta 2027`,
    // %s is the page title — brand suffix is already included in each page’s metadata.title string.
    // Using bare "%s" prevents the double-brand duplication: "Page | Brand | Brand".
    template: `%s`,
  },
  description: `Tú haces tu factura, nosotros nos encargamos de VeriFactu. Software de facturación para autónomos y pymes. 100% Gratis hasta 2027. Sin tarjeta. Sin complicaciones.`,
  authors: [{ name: brandConfig.app.legalEntity }],
  creator: brandConfig.app.legalEntity,
  publisher: brandConfig.app.legalEntity,
  applicationName: brandConfig.app.name,
  metadataBase: new URL(brandConfig.app.url),
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: brandConfig.app.url,
    title: `${brandConfig.app.name} | Factura sin preocuparte de VeriFactu`,
    description: `Tú haces tu factura, nosotros nos encargamos de Hacienda. Gratis hasta 2027. Sin tarjeta. Para autónomos y pymes.`,
    siteName: brandConfig.app.name,
    images: [
      {
        url: `${brandConfig.app.url}${brandConfig.app.ogImage}`, // Crea esta imagen: mockup + texto "Gratis hasta 2027"
        width: 1200,
        height: 630,
        alt: `${brandConfig.app.name} - Software de facturación VeriFactu`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${brandConfig.app.name} | Factura sin preocuparte de VeriFactu`,
    description: `Gratis hasta 2027. Sin tarjeta. Cumplimiento automático con Hacienda.`,
    images: [`${brandConfig.app.url}${brandConfig.app.ogImage}`],
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
    <html
      lang="es"
      data-brand={process.env.NEXT_PUBLIC_BRAND ?? 'novafactura'}
      suppressHydrationWarning
    >
      <head>
        {/* Preconnect to external origins for faster resource loading */}
        <link rel="preconnect" href="https://cdn.sanity.io" />
        <link rel="dns-prefetch" href="https://cdn.sanity.io" />
        {/* RSS feed auto-discovery — helps LLMs and feed readers find blog content */}
        <link
          rel="alternate"
          type="application/rss+xml"
          title={`${brandConfig.app.name} — Blog`}
          href={`${brandConfig.app.url}/feed.xml`}
        />
        {/* Organization structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        {/* WebSite structured data — entity resolution for the site name */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        {/* SoftwareApplication is emitted only on product pages (Home, /precios, /software-para-asesorias). */}
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
            <Suspense fallback={null}>
              <NavigationProgress />
            </Suspense>
            {children}
            <Analytics />
            <CookieBanner />
            <SignupAttributionTracker />
            <Toaster richColors position="top-right" />
          </QueryProvider>
        </ThemeProvider>
        {/* GTM loads when the browser is idle after onload so it never competes with
            LCP/INP. Consent Mode v2 defaults above still apply before it runs. */}
        <Script id="gtm" strategy="lazyOnload">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`}
        </Script>
      </body>
    </html>
  );
}
