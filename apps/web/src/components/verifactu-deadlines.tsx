import { VERIFACTU_DEADLINES, VERIFACTU_LEGISLATION } from '@/lib/verifactu-deadlines';

/**
 * Canonical VeriFactu deadline table with BOE source links.
 *
 * Single visible source of truth for legal deadlines (YMYL). Render this on
 * any page that mentions VeriFactu dates so the message can never diverge
 * between pages. Data lives in `@/lib/verifactu-deadlines`.
 */
export function VerifactuDeadlines() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <dl className="divide-y divide-slate-100 dark:divide-gray-800">
        {VERIFACTU_DEADLINES.map((deadline) => (
          <div
            key={deadline.iso}
            className="grid gap-1 py-3 first:pt-0 last:pb-0 sm:grid-cols-[220px_1fr] sm:gap-4"
          >
            <dt className="text-sm font-semibold text-slate-900 dark:text-white">
              <time dateTime={deadline.iso}>{deadline.label}</time>
              <span className="block text-xs font-normal text-slate-500 dark:text-gray-400">
                {deadline.audience}
              </span>
            </dt>
            <dd className="self-center text-sm text-slate-600 dark:text-gray-400">
              {deadline.description}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 border-t border-slate-100 pt-4 text-xs leading-relaxed text-slate-500 dark:border-gray-800 dark:text-gray-400">
        Fuentes oficiales (BOE):{' '}
        {VERIFACTU_LEGISLATION.map((law, index) => (
          <span key={law.url}>
            {index > 0 && ' · '}
            <a
              href={law.url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-slate-300 underline-offset-2 transition-colors hover:text-slate-800 dark:decoration-gray-600 dark:hover:text-gray-200"
            >
              {law.name}
            </a>
          </span>
        ))}
      </p>
    </div>
  );
}
