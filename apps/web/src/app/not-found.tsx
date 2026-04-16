import Link from 'next/link';
import type { Metadata } from 'next';
import { brandConfig } from '@easyfactura/brand-config';
import { FileQuestion, Home, ArrowRight, Search } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Página no encontrada',
  description: `La página que buscas no existe en ${brandConfig.app.name}. Vuelve al inicio o explora nuestras funcionalidades de facturación.`,
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-2xl bg-muted p-4">
            <FileQuestion className="h-12 w-12 text-muted-foreground" />
          </div>
        </div>

        <h1 className="mb-2 text-4xl font-bold tracking-tight">404</h1>
        <p className="mb-1 text-lg font-medium text-foreground">Página no encontrada</p>
        <p className="mb-8 text-sm text-muted-foreground">
          La página que buscas no existe o ha sido movida. Prueba con alguno de estos enlaces:
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Home className="h-4 w-4" />
            Ir al inicio
          </Link>
          <Link
            href="/funcionalidades"
            className="inline-flex items-center justify-center gap-2 rounded-lg border bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <Search className="h-4 w-4" />
            Ver funcionalidades
          </Link>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
          <Link href="/precios" className="hover:text-foreground">
            Precios
          </Link>
          <span>·</span>
          <Link href="/blog" className="hover:text-foreground">
            Blog
          </Link>
          <span>·</span>
          <Link href="/contacto" className="hover:text-foreground">
            Contacto
          </Link>
          <span>·</span>
          <Link href="/registro" className="flex items-center gap-1 hover:text-foreground">
            Crear cuenta gratis
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
