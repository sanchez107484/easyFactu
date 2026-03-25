'use client';

import Link from 'next/link';
import { brandConfig } from '@easyfactura/brand-config';

export default function SiteHeader(): JSX.Element {
  return (
    <header className="w-full border-b bg-white">
      <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-lg font-semibold">
          {brandConfig.app.name}
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          <Link href="/funcionalidades" className="text-muted-foreground hover:text-foreground">
            Funcionalidades
          </Link>
          <Link href="/precios" className="text-muted-foreground hover:text-foreground">
            Precios
          </Link>
          <Link href="/blog" className="text-muted-foreground hover:text-foreground">
            Blog
          </Link>
          <Link href="/contacto" className="text-muted-foreground hover:text-foreground">
            Contacto
          </Link>
          <Link href="/politica-privacidad" className="text-muted-foreground hover:text-foreground">
            Política
          </Link>
          <Link href="/terminos-uso" className="text-muted-foreground hover:text-foreground">
            Términos
          </Link>
          <Link href="/aviso-legal" className="text-muted-foreground hover:text-foreground">
            Aviso
          </Link>
        </nav>
      </div>
    </header>
  );
}
