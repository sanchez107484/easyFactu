import Link from 'next/link';
import { brandConfig } from '@easyfactura/brand-config';

export default function SiteFooter(): JSX.Element {
  return (
    <footer className="w-full border-t bg-neutral-50">
      <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-neutral-600">
        <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
          <div>
            © {new Date().getFullYear()} {brandConfig.app.legalEntity}. Todos los derechos
            reservados.
          </div>
          <div className="flex gap-4">
            <Link href="/politica-privacidad" className="hover:text-neutral-900">
              Política de privacidad
            </Link>
            <Link href="/terminos-uso" className="hover:text-neutral-900">
              Términos de uso
            </Link>
            <Link href="/aviso-legal" className="hover:text-neutral-900">
              Aviso legal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
