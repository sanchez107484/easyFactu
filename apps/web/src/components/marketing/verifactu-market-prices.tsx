import { brandConfig, PRICING, formatPrice } from '@easyfactura/brand-config';
import { VERIFACTU_MARKET_PRICES } from '@/lib/verifactu-market-prices';

/** "¿Cuánto cuesta un programa VeriFactu?" — dated, sourced market ranges for /precios. */
export function VerifactuMarketPrices() {
  const { ranges, overallRange, checkedAt, note, source } = VERIFACTU_MARKET_PRICES;

  return (
    <section className="py-16 md:py-24" aria-labelledby="cuanto-cuesta-verifactu">
      <div className="mx-auto max-w-4xl px-4">
        <h2
          id="cuanto-cuesta-verifactu"
          className="mb-4 text-center text-3xl font-extrabold text-slate-900 sm:text-4xl"
        >
          ¿Cuánto cuesta un programa VeriFactu?
        </h2>
        <p data-speakable className="mx-auto mb-10 max-w-2xl text-center text-slate-600">
          Un programa de facturación adaptado a VeriFactu cuesta {overallRange} en pago anual, según
          el plan (datos de <time dateTime={checkedAt.iso}>{checkedAt.label}</time>).{' '}
          {brandConfig.app.name} es gratis hasta 2027 y después cuesta{' '}
          {formatPrice(PRICING.starter.annualMonthly)} €/mes en el Plan Básico o{' '}
          {formatPrice(PRICING.pro.annualMonthly)} €/mes en el PRO, con VeriFactu incluido en los
          dos.
        </p>
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">
              Precio de mercado de los programas VeriFactu en {checkedAt.label}
            </caption>
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th scope="col" className="px-5 py-3 font-semibold">
                  Tipo de plan
                </th>
                <th scope="col" className="px-5 py-3 font-semibold">
                  Precio de mercado
                </th>
                <th scope="col" className="hidden px-5 py-3 font-semibold sm:table-cell">
                  Qué incluye
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ranges.map((row) => (
                <tr key={row.tier}>
                  <th scope="row" className="px-5 py-4 font-semibold text-slate-900">
                    {row.tier}
                  </th>
                  <td className="whitespace-nowrap px-5 py-4 text-slate-700">{row.range}</td>
                  <td className="hidden px-5 py-4 text-slate-500 sm:table-cell">
                    {row.description}
                  </td>
                </tr>
              ))}
              <tr className="bg-blue-50/60">
                <th scope="row" className="px-5 py-4 font-semibold text-blue-700">
                  {brandConfig.app.name}
                </th>
                <td className="whitespace-nowrap px-5 py-4 font-semibold text-blue-700">
                  0 € hasta 2027
                </td>
                <td className="hidden px-5 py-4 text-slate-600 sm:table-cell">
                  Después, {formatPrice(PRICING.starter.annualMonthly)} €/mes (Básico) o{' '}
                  {formatPrice(PRICING.pro.annualMonthly)} €/mes (PRO) en pago anual. Facturas
                  ilimitadas y VeriFactu en los dos.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-slate-500">
          {note} Fuente:{' '}
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-slate-800"
          >
            {source.name}
          </a>
          . Revisado en <time dateTime={checkedAt.iso}>{checkedAt.label}</time>.
        </p>
      </div>
    </section>
  );
}
