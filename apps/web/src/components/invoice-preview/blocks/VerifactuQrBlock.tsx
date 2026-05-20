'use client';

import { QRCodeSVG } from 'qrcode.react';
import { InvoiceStatus } from '@easyfactura/shared-types';

interface VerifactuQrBlockProps {
  verifactuQr: string | null | undefined;
  status: InvoiceStatus;
  showVerifactuQr: boolean;
  /** Display mode: 'footer' for invoice preview/PDF footer, 'detail' for the full detail card */
  mode?: 'footer' | 'detail';
  /** When true, shows a placeholder even for DRAFT status so the user can see where the QR will appear */
  isPreview?: boolean;
}

const VERIFIED_STATUSES: InvoiceStatus[] = [
  InvoiceStatus.CONFIRMED,
  InvoiceStatus.SENT,
  InvoiceStatus.PAID,
];

export function VerifactuQrBlock({
  verifactuQr,
  status,
  showVerifactuQr,
  mode = 'footer',
  isPreview = false,
}: VerifactuQrBlockProps) {
  const canShowQr = showVerifactuQr && VERIFIED_STATUSES.includes(status);

  if (!showVerifactuQr) return null;

  // In live preview for a draft invoice: show a placeholder so the user knows where the QR will appear
  if (!canShowQr && isPreview) {
    return (
      <div className="flex flex-col items-center gap-1">
        <div className="w-10 h-10 bg-neutral-100 border border-dashed border-neutral-300 rounded flex items-center justify-center">
          <span className="text-[7px] text-neutral-400 text-center leading-tight px-0.5">QR</span>
        </div>
        <span className="text-[7px] text-neutral-400 text-center leading-tight">al confirmar</span>
      </div>
    );
  }

  if (!canShowQr) return null;

  if (!verifactuQr) {
    // QR not yet generated (e.g. processInvoice still running async)
    return (
      <div className="flex flex-col items-center gap-1">
        <div className="w-10 h-10 bg-neutral-100 border border-dashed border-neutral-300 rounded flex items-center justify-center">
          <span className="text-[7px] text-neutral-400 text-center leading-tight">QR</span>
        </div>
        {mode === 'detail' && <span className="text-[10px] text-neutral-400">Generando QR…</span>}
      </div>
    );
  }

  const size = mode === 'detail' ? 96 : 40;

  return (
    <div className="flex flex-col items-center gap-1">
      <a
        href={verifactuQr}
        target="_blank"
        rel="noopener noreferrer"
        title="Verificar factura"
        className="block"
      >
        <QRCodeSVG value={verifactuQr} size={size} level="M" marginSize={1} />
      </a>
      <span
        className={
          mode === 'detail'
            ? 'text-[11px] text-neutral-500'
            : 'text-[7px] text-neutral-400 text-center leading-tight'
        }
      >
        Verifica esta factura
      </span>
    </div>
  );
}
