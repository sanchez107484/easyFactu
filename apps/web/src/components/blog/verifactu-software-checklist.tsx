import Link from 'next/link';
import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import { brandConfig } from '@easyfactura/brand-config';
import { VerifactuDeadlines } from '@/components/verifactu-deadlines';
import {
  VERIFACTU_ANNOUNCED_DEADLINE,
  VERIFACTU_CALENDAR_UPDATED_AT,
} from '@/lib/verifactu-deadlines';

/**
 * Sanity slug of the post "¿Cómo saber si tu software cumple con VeriFactu?".
 * /verifactu/software-garante redirects here (see next.config.ts).
 */
export const VERIFACTU_SOFTWARE_POST_SLUG = 'como-saber-si-tu-software-cumple-con-verifactu';

const CHECKLIST = [
  'El fabricante ha publicado su declaración responsable de cumplimiento del Reglamento VeriFactu (RD 1007/2023). Pídesela o búscala en su web.',
  'Cada factura genera un registro de facturación con una huella (hash) encadenada a la factura anterior.',
  'El PDF o la factura impresa lleva un código QR que, al escanearlo, abre la sede electrónica de la AEAT.',
  'No te deja borrar ni modificar una factura emitida: se corrige con una rectificativa o una anulación.',
  'Puede enviar los registros a la AEAT (modalidad VERI*FACTU) o, si no, los guarda firmados con un registro de eventos.',
  `El proveedor se compromete a mantenerlo actualizado hasta la fecha de obligación: ${VERIFACTU_ANNOUNCED_DEADLINE.label}.`,
];

/** Up-to-date checklist + free-trial CTA appended to the VeriFactu software post. */
export function VerifactuSoftwareChecklist() {
  return (
    <section className="mt-14 space-y-8" aria-labelledby="checklist-verifactu">
      <div>
        <h2 id="checklist-verifactu" className="text-2xl font-bold text-foreground">
          Checklist: ¿tu programa cumple VeriFactu?
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Actualizada el{' '}
          <time dateTime={VERIFACTU_CALENDAR_UPDATED_AT.iso}>
            {VERIFACTU_CALENDAR_UPDATED_AT.label}
          </time>
          . {VERIFACTU_ANNOUNCED_DEADLINE.summary}.
        </p>
        <ul className="mt-5 space-y-3">
          {CHECKLIST.map((item) => (
            <li key={item} className="flex items-start gap-3 text-foreground">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="mb-3 text-lg font-semibold text-foreground">Calendario de VeriFactu</h3>
        <VerifactuDeadlines />
      </div>

      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-8">
        <h2 className="text-2xl font-bold text-foreground">Prueba un software VeriFactu gratis</h2>
        <p className="mt-3 text-muted-foreground">
          {brandConfig.app.name} cumple todos los puntos de la checklist: hash encadenado, QR de la
          AEAT, envío de registros y facturas inalterables. Pruébalo gratis hasta 2027, sin tarjeta,
          y comprueba tú mismo el QR de tu primera factura.
        </p>
        <Link
          href="/registro"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground transition hover:opacity-90"
        >
          <Sparkles className="h-5 w-5" />
          Probar gratis
          <ArrowRight className="h-5 w-5" />
        </Link>
      </div>
    </section>
  );
}
