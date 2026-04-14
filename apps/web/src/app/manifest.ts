import type { MetadataRoute } from 'next';
import { brandConfig, themeConfig } from '@easyfactura/brand-config';

export default function manifest(): MetadataRoute.Manifest {
  const primaryColor = `hsl(${themeConfig.cssVars.light['primary']})`;

  return {
    name: brandConfig.app.name,
    short_name: brandConfig.app.shortName,
    description: brandConfig.app.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: primaryColor,
    lang: 'es',
    icons: [
      {
        src: brandConfig.logos.pwa.icon192,
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: brandConfig.logos.pwa.icon512,
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: brandConfig.logos.pwa.maskable,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
