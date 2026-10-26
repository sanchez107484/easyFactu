import Link from 'next/link';
import { Tag } from 'lucide-react';
import { brandConfig, PRICING, formatPrice } from '@easyfactura/brand-config';

/**
 * Internal link from every guide to /precios with the anchor text
 * "precio del programa" (SEO: /precios targets "precio programa VeriFactu").
 */
export function PricingGuideLink() {
  return (
    <aside className="border-t border-slate-100 bg-white py-8">
      <div className="mx-auto flex max-w-4xl items-start gap-3 px-6">
        <Tag className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />
        <p className="text-sm leading-relaxed text-slate-600">
          ¿Buscas un programa VeriFactu? Consulta el{' '}
          <Link
            href="/precios"
            className="font-semibold text-blue-600 underline underline-offset-2 hover:no-underline"
          >
            precio del programa
          </Link>
          : {brandConfig.app.name} es gratis hasta 2027 y después cuesta desde{' '}
          {formatPrice(PRICING.starter.annualMonthly)} €/mes con pago anual.
        </p>
      </div>
    </aside>
  );
}
