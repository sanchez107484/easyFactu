import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

interface CtaDarkSectionProps {
  title: string;
  description: string;
  ctaText?: string;
  ctaHref?: string;
  showArrow?: boolean;
}

export default function CtaDarkSection({
  title,
  description,
  ctaText = 'Empezar gratis',
  ctaHref = '/registro',
  showArrow = false,
}: CtaDarkSectionProps) {
  return (
    <section className="border-t bg-slate-900 py-12">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="mb-3 text-2xl font-bold text-white">{title}</h2>
        <p className="mb-7 text-slate-400">{description}</p>
        <Link
          href={ctaHref}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-7 py-3.5 text-base font-semibold text-white shadow transition hover:bg-blue-400"
        >
          <Sparkles className="h-5 w-5" />
          {ctaText}
          {showArrow && <ArrowRight className="h-5 w-5" />}
        </Link>
      </div>
    </section>
  );
}
