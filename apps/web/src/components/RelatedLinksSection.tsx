import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export interface RelatedLink {
  href: string;
  label: string;
  description?: string;
}

interface RelatedLinksSectionProps {
  title?: string;
  links: RelatedLink[];
}

export default function RelatedLinksSection({
  title = 'Guías relacionadas',
  links,
}: RelatedLinksSectionProps) {
  const colsClass = links.length >= 5 ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2';

  return (
    <section className="border-t border-slate-100 bg-slate-50/60 py-14">
      <div className="mx-auto max-w-4xl px-6">
        <h2 className="mb-6 text-base font-semibold text-slate-700">{title}</h2>
        <div className={`grid gap-3 ${colsClass}`}>
          {links.map(({ href, label, description }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition-all duration-200 hover:-translate-y-px hover:border-blue-300 hover:shadow-md"
            >
              <ArrowRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-400 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-blue-500" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium leading-snug text-slate-800 transition-colors group-hover:text-blue-600">
                  {label}
                </span>
                {description && (
                  <span className="mt-1 block text-xs leading-relaxed text-slate-500">
                    {description}
                  </span>
                )}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
