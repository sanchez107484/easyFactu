import Link from 'next/link';
import { ArrowRight, Building2, CheckCircle2 } from 'lucide-react';

const agencyBenefits = [
  'Un panel para facturar en nombre de cada cliente, bajo su propio NIF',
  'Tus clientes autónomos dejan de mandarte facturas en Excel',
  'Gratis para la asesoría',
];

export function AgencyCallout() {
  return (
    <section className="bg-gradient-to-r from-indigo-600 to-indigo-800 py-14 md:py-16">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-8 px-4 text-center md:flex-row md:text-left">
        <div className="flex-shrink-0 rounded-2xl bg-white/10 p-4">
          <Building2 className="h-10 w-10 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-300">
            Para asesorías y gestorías
          </p>
          <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
            ¿Llevas la facturación de varios autónomos?
          </h2>
          <ul className="mt-4 space-y-2 text-sm text-indigo-100">
            {agencyBenefits.map((benefit) => (
              <li key={benefit} className="flex items-start justify-center gap-2 md:justify-start">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-indigo-300" />
                {benefit}
              </li>
            ))}
          </ul>
        </div>
        <Link
          href="/software-para-asesorias"
          className="inline-flex flex-shrink-0 items-center gap-2 rounded-xl bg-white px-6 py-3 text-base font-bold text-indigo-700 shadow-lg transition-all hover:bg-indigo-50 hover:shadow-xl"
        >
          Software para asesorías
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
