import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@easyfactura/shared-types',
    '@easyfactura/shared-validators',
    '@easyfactura/shared-constants',
    '@easyfactura/brand-config',
  ],
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
  async rewrites() {
    return [
      {
        source: '/api/invoices/:id/pdf',
        destination: 'http://localhost:3001/api/v1/invoices/:id/pdf',
      },
    ];
  },
};

export default nextConfig;
