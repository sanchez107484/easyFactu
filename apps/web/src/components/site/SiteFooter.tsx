import Link from 'next/link';
import { Linkedin, Instagram } from 'lucide-react';
import { brandConfig } from '@easyfactura/brand-config';

export default function SiteFooter(): JSX.Element {
  return (
    <footer className="w-full border-t bg-neutral-50">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 flex flex-col gap-6 sm:flex-row sm:justify-between">
          {/* Company Info */}
          <div className="flex-1">
            <h3 className="mb-2 font-semibold text-neutral-900">{brandConfig.app.name}</h3>
            <p className="mb-4 text-sm text-neutral-600">{brandConfig.app.tagline}</p>

            {/* Social Links */}
            <div className="flex gap-3">
              <a
                href="https://www.linkedin.com/company/novafactura"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 transition-colors hover:border-neutral-300 hover:text-neutral-900"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-4 w-4" />
              </a>
              <a
                href="https://www.instagram.com/nova.factura"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 transition-colors hover:border-neutral-300 hover:text-neutral-900"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Legal Links */}
          <div className="flex flex-col gap-2 text-sm sm:text-right">
            <Link href="/politica-privacidad" className="text-neutral-600 hover:text-neutral-900">
              Política de privacidad
            </Link>
            <Link href="/terminos-uso" className="text-neutral-600 hover:text-neutral-900">
              Términos de uso
            </Link>
            <Link href="/aviso-legal" className="text-neutral-600 hover:text-neutral-900">
              Aviso legal
            </Link>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-neutral-200 pt-6 text-center text-sm text-neutral-600 sm:text-left">
          © {new Date().getFullYear()} {brandConfig.app.legalEntity}. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}
