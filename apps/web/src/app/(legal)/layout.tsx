import type { Metadata } from 'next';
import FooterLanding from '@/components/FooterLanding';
import SiteHeader from '@/components/site-header';
import { brandConfig } from '@easyfactura/brand-config';

export const metadata: Metadata = {
  title: {
    template: `%s · ${brandConfig.app.name}`,
    default: `Información legal · ${brandConfig.app.name}`,
  },
};

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      {children}
      <FooterLanding />
    </>
  );
}
