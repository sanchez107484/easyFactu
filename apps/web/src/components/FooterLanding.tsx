import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import { brandConfig } from '@easyfactura/brand-config';
import { Badge } from '@/components/ui/badge';
import { BadgeCheck } from 'lucide-react';

export default function FooterLanding(): JSX.Element {
  return (
    <footer className="border-t bg-muted/20 py-12">
      <div className="container px-4">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-3">
              <Image
                src={brandConfig.logos.main}
                alt={brandConfig.app.name}
                width={140}
                height={36}
                className="object-contain"
                style={{ width: 'auto', height: '30px' }}
              />
              <Badge variant="outline" className="text-xs">
                <BadgeCheck className="mr-1 h-3 w-3" />
                VeriFactu
              </Badge>
            </div>

            <nav className="flex flex-wrap justify-center gap-6 text-sm">
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
            </nav>
          </div>

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
