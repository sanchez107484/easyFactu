import type { Metadata } from 'next';
import { brandConfig } from '@easyfactura/brand-config';

export const metadata: Metadata = {
  title: {
    default: `Acceder | ${brandConfig.app.name}`,
    template: `%s | ${brandConfig.app.name}`,
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-background">{children}</div>;
}
