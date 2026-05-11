'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { brandConfig, PLAZAS_CONFIG } from '@easyfactura/brand-config';

// ─────────────────────────────────────────────────────────────────────────────
// HomeStickyCtaBanner — appears after 500px scroll on mobile
// ─────────────────────────────────────────────────────────────────────────────
export function HomeStickyCtaBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShow(window.scrollY > 500);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur sm:hidden">
      <Link
        href="/registro"
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-base font-bold text-white transition-all hover:bg-blue-700"
      >
        Empezar gratis ahora
        <ArrowRight className="h-4 w-4" />
      </Link>
      <p className="mt-2 text-center text-xs text-slate-400">
        <span className="font-bold text-amber-600">
          {PLAZAS_CONFIG.disponibles.toLocaleString('es-ES')} plazas restantes
        </span>
        {' · '}6 meses gratis · Sin tarjeta al registrarte
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HomeAnimatedStats — Section 2: animated counters on IntersectionObserver
// ─────────────────────────────────────────────────────────────────────────────
export function HomeAnimatedStats() {
  // Initialize with real values so the server-rendered HTML (and bots) see the
  // correct numbers. The client-side animation starts from 0 on scroll.
  const [counters, setCounters] = useState({
    facturas: 10420,
    usuarios: PLAZAS_CONFIG.ocupadas,
    ahorro: 50000,
  });

  const statsRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const duration = 2000;
          const targets = { facturas: 10420, usuarios: PLAZAS_CONFIG.ocupadas, ahorro: 50000 };
          const start = Date.now();
          const tick = () => {
            const elapsed = Date.now() - start;
            const progress = Math.min(elapsed / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3);
            setCounters({
              facturas: Math.floor(ease * targets.facturas),
              usuarios: Math.floor(ease * targets.usuarios),
              ahorro: Math.floor(ease * targets.ahorro),
            });
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 },
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={statsRef} className="border-y border-slate-100 bg-slate-50 py-12">
      <div className="mx-auto max-w-4xl px-4">
        <div className="grid gap-8 sm:grid-cols-3">
          {[
            {
              value: `${counters.facturas.toLocaleString('es-ES')}+`,
              label: 'Facturas procesadas',
            },
            {
              value: `${counters.usuarios.toLocaleString('es-ES')}+`,
              label: 'Profesionales inscritos',
            },
            {
              value: `${counters.ahorro.toLocaleString('es-ES')}€`,
              label: 'En sanciones evitadas',
            },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <div className="text-4xl font-extrabold tabular-nums text-slate-900">{value}</div>
              <p className="mt-1 text-sm text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HomeFaqAccordion — Section 10: accordion items with open/close state
// ─────────────────────────────────────────────────────────────────────────────
interface FaqItem {
  q: string;
  a: string;
}

function AccordionItem({ q, a }: FaqItem) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`rounded-xl border-2 bg-white px-4 transition-colors ${
        open ? 'border-blue-200' : 'border-slate-200'
      }`}
    >
      <button
        className="flex w-full items-center justify-between py-4 text-left text-base font-semibold text-slate-900 transition-colors hover:text-blue-600"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span>{q}</span>
        <span
          className={`ml-4 shrink-0 transition-transform duration-200 ${open ? 'rotate-45' : ''}`}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M10 4v12M4 10h12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </span>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-48 pb-4' : 'max-h-0'}`}
      >
        <p className="text-sm leading-relaxed text-slate-500">{a}</p>
      </div>
    </div>
  );
}

export function HomeFaqAccordion({ faqs }: { faqs: FaqItem[] }) {
  return (
    <div className="space-y-2">
      {faqs.map((faq, i) => (
        <AccordionItem key={i} q={faq.q} a={faq.a} />
      ))}
    </div>
  );
}

// Re-export brandConfig.app.url so HomeStickyCtaBanner links are consistent
export { brandConfig };
