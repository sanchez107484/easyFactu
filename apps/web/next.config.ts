import type { NextConfig } from 'next';

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Prevent trailing-slash 308 redirects reported by Search Console
  trailingSlash: false,
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
    // Route all next/image calls through our custom Sanity loader so that
    // Sanity CDN images are transformed by Sanity's own free CDN instead of
    // going through Vercel's paid /_next/image optimizer (which returns 402
    // once the monthly free quota is exceeded).
    loaderFile: './src/lib/sanity-image-loader.ts',
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
      },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  async redirects() {
    return [
      // Redirect non-www to www to consolidate authority into a single canonical domain.
      // Without this, both novafactura.es and www.novafactura.es would be indexed separately.
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'novafactura.es' }],
        destination: 'https://www.novafactura.es/:path*',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
