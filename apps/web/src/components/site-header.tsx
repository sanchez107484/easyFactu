'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { brandConfig } from '@easyfactura/brand-config';
import { useAuthStore } from '@/store/auth-store';
import {
  AlertTriangle,
  BookOpen,
  ChevronDown,
  Clock,
  FileCheck,
  FileText,
  Globe,
  Menu,
  Percent,
  Receipt,
  RotateCcw,
  Shield,
  Sparkles,
  X,
} from 'lucide-react';

const verifactuItems = [
  {
    href: '/verifactu',
    label: '¿Qué es VeriFactu?',
    description: 'La normativa AEAT explicada',
    icon: Shield,
  },
  {
    href: '/verifactu/cuando-es-obligatorio',
    label: '¿Cuándo es obligatorio?',
    description: 'Fechas y plazos por perfil',
    icon: Clock,
  },
  {
    href: '/verifactu/software-garante',
    label: 'Software garante AEAT',
    description: 'Requisitos y certificación',
    icon: FileCheck,
  },
  {
    href: '/verifactu/sanciones',
    label: 'Sanciones por incumplimiento',
    description: 'Multas de hasta 50.000€',
    icon: AlertTriangle,
  },
];

const recursosItems = [
  {
    href: '/factura-electronica',
    label: 'Factura electrónica',
    description: 'Qué es y cómo emitirla',
    icon: FileText,
  },
  {
    href: '/facturas/como-hacer-una-factura',
    label: 'Cómo hacer una factura',
    description: 'Guía paso a paso',
    icon: BookOpen,
  },
  {
    href: '/facturas/con-irpf',
    label: 'Factura con IRPF',
    description: 'Retenciones para autónomos',
    icon: Percent,
  },
  {
    href: '/facturas/rectificativa',
    label: 'Factura rectificativa',
    description: 'Cómo corregir una factura',
    icon: RotateCcw,
  },
  {
    href: '/facturas/proforma',
    label: 'Factura proforma',
    description: 'Presupuesto previo a la venta',
    icon: Receipt,
  },
  {
    href: '/facturas/simplificada',
    label: 'Factura simplificada',
    description: 'Sin datos del destinatario',
    icon: FileCheck,
  },
  {
    href: '/facturas/intracomunitaria',
    label: 'Factura intracomunitaria',
    description: 'Operaciones dentro de la UE',
    icon: Globe,
  },
];

const BRAND = process.env.NEXT_PUBLIC_BRAND ?? 'novafactura';

// Links after the Recursos dropdown — NovaFactura only
const navLinks = [
  { href: '/precios', label: 'Precios' },
  { href: '/blog', label: 'Blog' },
];

// Flat nav for NaFactura — no dropdown, no blog
const nafacturaNavLinks = [
  { href: '/funcionalidades', label: 'Funcionalidades' },
  { href: '/verifactu', label: 'VeriFactu' },
  { href: '/asesoria', label: 'Asesorías', highlight: true },
  { href: '/precios', label: 'Precios' },
  { href: '/blog', label: 'Blog' },
];

export default function SiteHeader() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileVerifactuOpen, setMobileVerifactuOpen] = useState(false);
  const [mobileRecursosOpen, setMobileRecursosOpen] = useState(false);
  const [verifactuOpen, setVerifactuOpen] = useState(false);
  const [recursosOpen, setRecursosOpen] = useState(false);
  const pathname = usePathname();
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recursosLeaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isVerifactuActive = pathname.startsWith('/verifactu');
  const isRecursosActive = pathname.startsWith('/facturas') || pathname === '/factura-electronica';

  const handleVerifactuEnter = () => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    setVerifactuOpen(true);
    setRecursosOpen(false);
  };

  const handleVerifactuLeave = () => {
    leaveTimer.current = setTimeout(() => setVerifactuOpen(false), 150);
  };

  const handleRecursosEnter = () => {
    if (recursosLeaveTimer.current) clearTimeout(recursosLeaveTimer.current);
    setRecursosOpen(true);
    setVerifactuOpen(false);
  };

  const handleRecursosLeave = () => {
    recursosLeaveTimer.current = setTimeout(() => setRecursosOpen(false), 150);
  };

  return (
    <header
      className="sticky top-0 z-50 border-b border-neutral-100 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80"
      style={
        {
          '--brand-highlight': brandConfig.colors.highlight,
          '--brand-highlight-bg': brandConfig.colors.highlightBg,
        } as React.CSSProperties
      }
    >
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
          {BRAND === 'nafactura' ? (
            nafacturaNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  link.highlight
                    ? pathname === link.href
                      ? 'bg-[var(--brand-highlight-bg)] text-[var(--brand-highlight)]'
                      : 'text-[var(--brand-highlight)] hover:bg-[var(--brand-highlight-bg)]'
                    : pathname === link.href
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                }`}
              >
                {link.label}
              </Link>
            ))
          ) : (
            <>
              <Link
                href="/funcionalidades"
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  pathname === '/funcionalidades'
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                }`}
              >
                Funcionalidades
              </Link>

              {/* VeriFactu dropdown — NovaFactura only */}
              <div
                className="relative"
                onMouseEnter={handleVerifactuEnter}
                onMouseLeave={handleVerifactuLeave}
              >
                <button
                  className={`flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isVerifactuActive
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                  }`}
                  aria-expanded={verifactuOpen}
                  onClick={() => setVerifactuOpen((o) => !o)}
                >
                  VeriFactu
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform ${verifactuOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {verifactuOpen && (
                  <div className="absolute left-1/2 top-full -translate-x-1/2 pt-2">
                    <div className="w-72 overflow-hidden rounded-xl border border-neutral-100 bg-white shadow-lg">
                      {verifactuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setVerifactuOpen(false)}
                            className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-neutral-50 ${
                              pathname === item.href ? 'bg-blue-50' : ''
                            }`}
                          >
                            <div className="mt-0.5 flex-shrink-0 rounded-md bg-blue-50 p-1.5">
                              <Icon className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-neutral-900">{item.label}</p>
                              <p className="text-xs text-neutral-500">{item.description}</p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Asesorías link — NovaFactura only */}
              <Link
                href="/asesoria"
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  pathname === '/asesoria'
                    ? 'bg-[var(--brand-highlight-bg)] text-[var(--brand-highlight)]'
                    : 'text-[var(--brand-highlight)] hover:bg-[var(--brand-highlight-bg)]'
                }`}
              >
                Asesorías
              </Link>

              {/* Recursos dropdown — NovaFactura only */}
              <div
                className="relative"
                onMouseEnter={handleRecursosEnter}
                onMouseLeave={handleRecursosLeave}
              >
                <button
                  className={`flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isRecursosActive
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                  }`}
                  aria-expanded={recursosOpen}
                  onClick={() => setRecursosOpen((o) => !o)}
                >
                  Recursos
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform ${recursosOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {recursosOpen && (
                  <div className="absolute left-1/2 top-full -translate-x-1/2 pt-2">
                    <div className="w-72 overflow-hidden rounded-xl border border-neutral-100 bg-white shadow-lg">
                      {recursosItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setRecursosOpen(false)}
                            className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-neutral-50 ${
                              pathname === item.href ? 'bg-emerald-50' : ''
                            }`}
                          >
                            <div className="mt-0.5 flex-shrink-0 rounded-md bg-emerald-50 p-1.5">
                              <Icon className="h-4 w-4 text-emerald-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-neutral-900">{item.label}</p>
                              <p className="text-xs text-neutral-500">{item.description}</p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    pathname === link.href
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </>
          )}
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
                <Button variant="ghost" size="sm" className="text-neutral-600">
                  Iniciar sesión
                </Button>
              </Link>
              <Link href="/registro">
                <Button size="sm" className="gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Empezar gratis ahora
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="flex items-center justify-center rounded-lg p-2 text-neutral-600 hover:bg-neutral-50 md:hidden"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label="Abrir menú"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-neutral-100 bg-white px-4 pb-4 pt-2 md:hidden">
          <nav className="flex flex-col gap-1">
            {BRAND === 'nafactura' ? (
              nafacturaNavLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    link.highlight
                      ? 'text-[var(--brand-highlight)] hover:bg-[var(--brand-highlight-bg)]'
                      : pathname === link.href
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-neutral-700 hover:bg-neutral-50'
                  }`}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))
            ) : (
              <>
                <Link
                  href="/funcionalidades"
                  className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    pathname === '/funcionalidades'
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-neutral-700 hover:bg-neutral-50'
                  }`}
                  onClick={() => setMobileOpen(false)}
                >
                  Funcionalidades
                </Link>

                {/* VeriFactu collapsible — NovaFactura only */}
                <div>
                  <button
                    onClick={() => setMobileVerifactuOpen((o) => !o)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      isVerifactuActive
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    VeriFactu
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${mobileVerifactuOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {mobileVerifactuOpen && (
                    <div className="ml-3 mt-1 flex flex-col gap-0.5 border-l border-neutral-100 pl-3">
                      {verifactuItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className="rounded-lg px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* Asesorías link — NovaFactura only */}
                <Link
                  href="/asesoria"
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--brand-highlight)] transition-colors hover:bg-[var(--brand-highlight-bg)]"
                  onClick={() => setMobileOpen(false)}
                >
                  Asesorías
                </Link>

                {/* Recursos collapsible — NovaFactura only */}
                <div>
                  <button
                    onClick={() => setMobileRecursosOpen((o) => !o)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      isRecursosActive
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    Recursos
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${mobileRecursosOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {mobileRecursosOpen && (
                    <div className="ml-3 mt-1 flex flex-col gap-0.5 border-l border-neutral-100 pl-3">
                      {recursosItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className="rounded-lg px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      pathname === link.href
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-neutral-700 hover:bg-neutral-50'
                    }`}
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </>
            )}
          </nav>
          <div className="mt-3 flex flex-col gap-2 border-t border-neutral-100 pt-3">
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
                    Empezar gratis ahora
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
