'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { brandConfig } from '@easyfactura/brand-config';
import { useAuthStore } from '@/store/auth-store';
import { Menu, X, Sparkles } from 'lucide-react';

const navLinks = [
  { href: '/funcionalidades', label: 'Funcionalidades' },
  { href: '/precios', label: 'Precios' },
  { href: '/blog', label: 'Blog' },
  { href: '/contacto', label: 'Contacto' },
];

export default function SiteHeader() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex-shrink-0" onClick={() => setMobileOpen(false)}>
          <Image
            src={brandConfig.logos.main}
            alt={brandConfig.app.name}
            width={160}
            height={40}
            className="object-contain"
            style={{ width: 'auto', height: '32px' }}
            priority
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                pathname === link.href
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop auth */}
        <div className="hidden items-center gap-2 md:flex">
          {isAuthenticated ? (
            <Link href="/dashboard">
              <Button size="sm">Acceder</Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-slate-600">
                  Iniciar sesión
                </Button>
              </Link>
              <Link href="/registro">
                <Button size="sm" className="gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Reservar plaza
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="flex items-center justify-center rounded-lg p-2 text-slate-600 hover:bg-slate-50 md:hidden"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label="Abrir menú"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-slate-100 bg-white px-4 pb-4 pt-2 md:hidden">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3">
            {isAuthenticated ? (
              <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                <Button className="w-full" size="sm">
                  Acceder al panel
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login" onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" size="sm" className="w-full">
                    Iniciar sesión
                  </Button>
                </Link>
                <Link href="/registro" onClick={() => setMobileOpen(false)}>
                  <Button size="sm" className="w-full gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    Reservar plaza gratis
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
