'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { VERIFACTU_ANNOUNCED_DEADLINE } from '@/lib/verifactu-deadlines';

type Customers = 'business' | 'consumers' | 'public';
type Revenue = 'upTo8M' | 'over8M';

interface QuizResult {
  heading: string;
  detail: string;
}

const CUSTOMER_OPTIONS: { value: Customers; label: string }[] = [
  { value: 'business', label: 'Empresas o autónomos' },
  { value: 'consumers', label: 'Solo particulares' },
  { value: 'public', label: 'Administración pública' },
];

const REVENUE_OPTIONS: { value: Revenue; label: string }[] = [
  { value: 'upTo8M', label: 'Hasta 8 millones de euros' },
  { value: 'over8M', label: 'Más de 8 millones de euros' },
];

// The e-invoice obligation for businesses up to 8 M€ was announced together
// with the VeriFactu postponement, so both share the same canonical date.
function getResult(customers: Customers, revenue: Revenue): QuizResult {
  if (customers === 'public') {
    return {
      heading: 'Ya te afecta',
      detail:
        'Las facturas a la Administración son electrónicas desde 2015: formato Facturae y envío por FACe o el punto de entrada de cada administración.',
    };
  }
  if (customers === 'consumers') {
    return {
      heading: 'La factura electrónica B2B no te afecta',
      detail: `Si solo facturas a particulares, no tendrás que enviar factura electrónica. Sí tendrás que usar un programa adaptado a VeriFactu: ${VERIFACTU_ANNOUNCED_DEADLINE.summary}.`,
    };
  }
  if (revenue === 'over8M') {
    return {
      heading: 'Te afectará antes que al resto',
      detail:
        'Las empresas que facturan más de 8 millones de euros serán las primeras en estar obligadas, según el calendario del reglamento de factura electrónica.',
    };
  }
  return {
    heading: `Te afectará en ${VERIFACTU_ANNOUNCED_DEADLINE.label}`,
    detail:
      'Es la fecha anunciada por Hacienda para empresas y autónomos que facturan hasta 8 millones de euros, la misma que VeriFactu (pendiente de BOE).',
  };
}

function OptionGroup<T extends string>({
  legend,
  name,
  options,
  value,
  onChange,
}: {
  legend: string;
  name: string;
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold text-slate-800">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label
            key={option.value}
            className={`cursor-pointer rounded-xl border-2 px-4 py-2 text-sm transition-colors ${value === option.value ? 'border-emerald-500 bg-emerald-50 font-semibold text-emerald-800' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** "¿Te afecta y cuándo?" — two questions that map to the announced calendar. */
export function EInvoiceImpactQuiz() {
  const [customers, setCustomers] = useState<Customers | null>(null);
  const [revenue, setRevenue] = useState<Revenue | null>(null);

  const needsRevenue = customers === 'business';
  const isAnswered = customers !== null && (!needsRevenue || revenue !== null);
  const result = isAnswered ? getResult(customers, revenue ?? 'upTo8M') : null;

  return (
    <div className="space-y-5 rounded-2xl border-2 border-emerald-200 bg-white p-6 shadow-sm">
      <OptionGroup
        legend="1. ¿A quién facturas?"
        name="einvoice-customers"
        options={CUSTOMER_OPTIONS}
        value={customers}
        onChange={setCustomers}
      />
      {needsRevenue && (
        <OptionGroup
          legend="2. ¿Cuánto factura tu negocio al año?"
          name="einvoice-revenue"
          options={REVENUE_OPTIONS}
          value={revenue}
          onChange={setRevenue}
        />
      )}
      <div aria-live="polite">
        {result && (
          <div className="rounded-xl bg-emerald-50 p-5">
            <p className="text-lg font-bold text-emerald-900">{result.heading}</p>
            <p className="mt-1 text-sm leading-relaxed text-emerald-800">{result.detail}</p>
            <Link
              href="/registro"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              <Sparkles className="h-4 w-4" />
              Empieza ya gratis
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
