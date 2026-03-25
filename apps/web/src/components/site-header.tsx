'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { brandConfig } from '@easyfactura/brand-config';
import { useAuthStore } from '@/store/auth-store';
import { BadgeCheck, Sparkles } from 'lucide-react';

export default function SiteHeader() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Image
              src={brandConfig.logos.main}
              alt={`${brandConfig.app.name} - Software de facturación VeriFactu`}
              width={160}
              height={40}
              className="object-contain"
              style={{ width: 'auto', height: '34px' }}
              priority
            />
          </Link>
          <Badge
            variant="outline"
            className="hidden border-primary/30 bg-primary/5 text-primary sm:inline-flex"
          >
            <BadgeCheck className="mr-1 h-3 w-3" />
            Certificado VeriFactu
          </Badge>
        </div>

        <nav className="flex items-center gap-3">
          {isAuthenticated ? (
            <Link href="/dashboard">
              <Button>Acceder</Button>
            </Link>
          ) : (
            <>
              <Link href="/login" className="hidden sm:inline-flex">
                <Button variant="ghost" size="sm">
                  Iniciar sesión
                </Button>
              </Link>
              <Link href="/registro">
                <Button size="sm">
                  <Sparkles className="mr-1.5 h-4 w-4" />
                  Reservar plaza
                </Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
