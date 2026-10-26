import { brandConfig } from '@easyfactura/brand-config';

interface ExcelComparisonRow {
  feature: string;
  excel: string;
  app: string;
}

// VeriFactu stays in the last row on purpose: the table sells speed and
// day-to-day comfort first, compliance is the closing argument.
export const EXCEL_COMPARISON_ROWS: ExcelComparisonRow[] = [
  {
    feature: 'Tiempo por factura',
    excel: '5–10 minutos copiando la plantilla',
    app: 'Menos de 60 segundos',
  },
  {
    feature: 'Cálculo de IVA e IRPF',
    excel: 'Fórmulas a mano que se rompen',
    app: 'Automático (21 %, 10 %, 4 %, retención 7 % o 15 %)',
  },
  {
    feature: 'Numeración',
    excel: 'Manual: saltos y números repetidos',
    app: 'Correlativa y por series, sin revisar',
  },
  {
    feature: 'Datos de clientes y productos',
    excel: 'Copiar y pegar en cada factura',
    app: 'Se rellenan solos al elegirlos',
  },
  {
    feature: 'Cobros',
    excel: 'Otra hoja para saber quién te debe',
    app: 'Pendientes, cobradas y vencidas de un vistazo',
  },
  {
    feature: 'Presupuestos y facturas recurrentes',
    excel: 'Duplicar archivos cada mes',
    app: 'Presupuesto a factura en un clic y recurrentes automáticas',
  },
  {
    feature: 'VeriFactu',
    excel: 'No genera hash ni QR',
    app: 'Hash, QR y registro en la AEAT incluidos',
  },
];

export const excelComparisonTableJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Table',
  name: `${brandConfig.app.name} frente a Excel para hacer facturas`,
  about:
    'Comparativa entre facturar con Excel y con un programa de facturación gratis: tiempo por factura, cálculo de IVA e IRPF, numeración, cobros y VeriFactu.',
  description: EXCEL_COMPARISON_ROWS.map(
    (row) => `${row.feature}: Excel — ${row.excel}; ${brandConfig.app.name} — ${row.app}.`,
  ).join(' '),
};

export function ExcelComparison() {
  return (
    <section id="frente-a-excel" className="border-y border-slate-100 bg-slate-50 py-16 md:py-24">
      <div className="mx-auto max-w-4xl px-4">
        <div className="mb-4 text-center">
          <span className="mb-4 inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
            Comparativa
          </span>
          <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
            {brandConfig.app.name} frente a Excel
          </h2>
        </div>
        <p className="mx-auto mb-10 max-w-xl text-center text-slate-500">
          Si hoy facturas con una plantilla de Excel o Word, esto es lo que cambia.
        </p>
        <div className="overflow-x-auto rounded-xl border-2 border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th scope="col" className="px-4 py-4 text-left font-bold text-slate-700">
                  Tarea
                </th>
                <th scope="col" className="px-4 py-4 text-left font-bold text-slate-400">
                  Excel
                </th>
                <th scope="col" className="px-4 py-4 text-left font-bold text-blue-600">
                  {brandConfig.app.name}
                </th>
              </tr>
            </thead>
            <tbody>
              {EXCEL_COMPARISON_ROWS.map((row, i) => (
                <tr
                  key={row.feature}
                  className={`border-b border-slate-100 last:border-0 ${i % 2 === 0 ? '' : 'bg-slate-50/50'}`}
                >
                  <th scope="row" className="px-4 py-3 text-left font-medium text-slate-700">
                    {row.feature}
                  </th>
                  <td className="px-4 py-3 text-slate-500">{row.excel}</td>
                  <td className="bg-blue-50/30 px-4 py-3 font-medium text-slate-800">{row.app}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mx-auto mt-6 max-w-2xl text-center text-sm leading-relaxed text-slate-500">
          En resumen: con {brandConfig.app.name} una factura tarda menos de un minuto, los impuestos
          y la numeración no fallan y sabes en todo momento quién te debe dinero. Y cuando VeriFactu
          sea obligatorio, ya estarás preparado.
        </p>
      </div>
    </section>
  );
}
