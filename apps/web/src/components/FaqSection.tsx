'use client';

import { useState } from 'react';

export interface FaqItem {
  q: string;
  a: string;
}

interface FaqSectionProps {
  faqs: FaqItem[];
  title?: string;
  subtitle?: string;
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
        className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-[500px] pb-4' : 'max-h-0'}`}
      >
        <p className="text-sm leading-relaxed text-slate-500">{a}</p>
      </div>
    </div>
  );
}

function FaqJsonLd({ faqs }: { faqs: FaqItem[] }) {
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
    />
  );
}

export default function FaqSection({
  faqs,
  title = 'Preguntas frecuentes',
  subtitle,
}: FaqSectionProps) {
  return (
    <section className="border-t border-slate-100 bg-slate-50 py-16 md:py-20">
      <FaqJsonLd faqs={faqs} />
      <div className="mx-auto max-w-3xl px-4">
        <div className="mb-8 text-center">
          <span className="mb-4 inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
            Preguntas frecuentes
          </span>
          <h2 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">{title}</h2>
          {subtitle && <p className="mt-3 text-slate-500">{subtitle}</p>}
        </div>
        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} q={faq.q} a={faq.a} />
          ))}
        </div>
      </div>
    </section>
  );
}
