import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import { brandConfig } from '@easyfactura/brand-config';
import { Badge } from '@/components/ui/badge';
import { BadgeCheck } from 'lucide-react';

const BRAND = process.env.NEXT_PUBLIC_BRAND ?? 'novafactura';

const novafacturaFooterColumns = [
  {
    title: 'Producto',
    links: [
      { href: '/facturacion-online', label: 'Software de facturación' },
      { href: '/funcionalidades', label: 'Funcionalidades' },
      { href: '/verifactu', label: 'VeriFactu' },
      { href: '/asesoria', label: 'Para asesorías' },
      { href: '/precios', label: 'Precios' },
      { href: '/blog', label: 'Blog' },
      { href: '/contacto', label: 'Contacto' },
    ],
  },
  {
    title: 'Aprende',
    links: [
      { href: '/factura-electronica', label: 'Factura electrónica' },
      { href: '/facturas/como-hacer-una-factura', label: 'Cómo hacer una factura' },
      { href: '/facturas/con-irpf', label: 'Factura con IRPF' },
      { href: '/facturas/rectificativa', label: 'Factura rectificativa' },
      { href: '/facturas/proforma', label: 'Factura proforma' },
      { href: '/facturas/simplificada', label: 'Factura simplificada' },
      { href: '/facturas/intracomunitaria', label: 'Factura intracomunitaria' },
      { href: '/facturacion-autonomo-agricola', label: 'Autónomos agrícolas (REAGYP)' },
    ],
  },
];

const nafacturaFooterColumns = [
  {
    title: 'Producto',
    links: [
      { href: '/funcionalidades', label: 'Funcionalidades' },
      { href: '/verifactu', label: 'VeriFactu' },
      { href: '/asesoria', label: 'Para asesorías' },
      { href: '/precios', label: 'Precios' },
      { href: '/blog', label: 'Blog' },
    ],
  },
  {
    title: 'Navarra',
    links: [
      { href: '/naticket', label: 'NaTicket Navarra' },
      { href: '/alternativa-holded-navarra', label: 'Alternativa a Holded' },
      { href: '/mejor-software-facturacion-navarra', label: 'Mejor software Navarra' },
      { href: '/software-facturacion-pamplona', label: 'Software Pamplona' },
      { href: '/facturacion-autonomo-agricola', label: 'Autónomos agrícolas' },
    ],
  },
];

const footerColumns = BRAND === 'nafactura' ? nafacturaFooterColumns : novafacturaFooterColumns;

export default function FooterLanding(): JSX.Element {
  return (
    <footer className="border-t bg-muted/20 py-12">
      <div className="container px-4">
        <div className="mx-auto max-w-6xl">
          {/* Top: logo + columns */}
          <div
            className={`mb-10 grid grid-cols-2 gap-8 ${
              BRAND === 'nafactura'
                ? 'sm:grid-cols-3 lg:grid-cols-3'
                : 'sm:grid-cols-3 lg:grid-cols-4'
            }`}
          >
            {/* Brand column */}
            <div
              className={
                BRAND === 'nafactura'
                  ? 'col-span-2 sm:col-span-1'
                  : 'col-span-2 sm:col-span-3 lg:col-span-1'
              }
            >
              <div className="flex items-center gap-2 mb-4">
                <Image
                  src={brandConfig.logos.main}
                  alt={brandConfig.app.name}
                  width={140}
                  height={36}
                  className="object-contain"
                  style={{ width: 'auto', height: '28px' }}
                />
              </div>
              <Badge variant="outline" className="text-xs mb-3">
                <BadgeCheck className="mr-1 h-3 w-3" />
                VeriFactu certificado
              </Badge>
              <p className="text-xs text-muted-foreground leading-relaxed mt-2">
                Software de facturación con VeriFactu automático para autónomos y pymes. Gratis
                hasta 2027.
              </p>
            </div>

            {/* Nav columns */}
            {footerColumns.map((col) => (
              <div key={col.title}>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-900">
                  {col.title}
                </h3>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom: legal + copyright */}
          <div className="flex flex-col items-center justify-between gap-4 border-t pt-8 sm:flex-row">
            <nav className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
              <Link href="/politica-privacidad" className="hover:text-foreground">
                Privacidad
              </Link>
              <Link href="/terminos-uso" className="hover:text-foreground">
                Términos de uso
              </Link>
              <Link href="/aviso-legal" className="hover:text-foreground">
                Aviso legal
              </Link>
              <Link href="/cookies" className="hover:text-foreground">
                Cookies
              </Link>
              <Link href="/tratamiento-datos" className="hover:text-foreground">
                Tratamiento de datos
              </Link>
            </nav>

            <p className="text-center text-xs text-muted-foreground">
              © {new Date().getFullYear()} {brandConfig.app.legalEntity}. Todos los derechos
              reservados.
            </p>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Software de facturación certificado según la Ley Antifraude 11/2021 · Compatible con
            VeriFactu AEAT · Cumplimiento RGPD · Servidores en la Unión Europea
          </p>
        </div>
      </div>
    </footer>
  );
}
