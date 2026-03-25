import React from 'react';
import FooterSimple from './FooterSimple';

interface PreAuthLayoutProps {
  children: React.ReactNode;
}

export default function PreAuthLayout({ children }: PreAuthLayoutProps) {
  return (
    <div className="flex min-h-screen">
      <main className="flex-1 flex flex-col">{children}</main>
      <FooterSimple />
    </div>
  );
}
