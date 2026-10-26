import Link from 'next/link';
import { formatCount } from '@/lib/signup-slots';

export function FreeOfferEndedNotice({ total }: { total: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
      <p className="text-sm font-bold text-slate-900">La oferta gratuita ha terminado</p>
      <p className="mt-1 text-xs text-slate-500">
        Se han ocupado las {formatCount(total)} plazas gratuitas. Consulta los{' '}
        <Link href="/precios" className="font-semibold text-blue-600 underline">
          planes actuales
        </Link>
        .
      </p>
    </div>
  );
}
