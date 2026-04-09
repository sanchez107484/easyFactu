import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@easyfactura/shared-types',
    '@easyfactura/shared-validators',
    '@easyfactura/shared-constants',
    '@easyfactura/brand-config',
  ],
  // Exclude Node.js-only packages with native binaries from webpack bundling.
  // These are used only in API routes at runtime, never in client-side code.
  serverExternalPackages: ['playwright', 'playwright-core', '@sparticuz/chromium'],
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/uploads/**',
      },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
