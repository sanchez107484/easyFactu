import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Pencil,
  ArrowRightLeft,
  FileText,
  CheckCircle2,
  Send,
  Undo2,
  Banknote,
  Hash,
  Calendar,
  Layers,
  Building2,
} from 'lucide-react';
import { DownloadInvoiceButton } from '@/components/ui/download-invoice-button';
import { InvoicePaymentSection } from '@/components/facturas/InvoicePaymentSection';
import type { Invoice, InvoiceAgencyCreator, InvoiceSeries } from '@easyfactura/shared-types';
import { INVOICE_STATUS_CONFIG } from '@/components/common/invoice-status-badge';
import { cn, formatCurrency, parseNum, formatDateShort } from '@/lib/utils';

type StatusConfig = (typeof INVOICE_STATUS_CONFIG)[keyof typeof INVOICE_STATUS_CONFIG];

interface InvoiceStatusHeroProps {
  invoice: Invoice;
  id: string;
  isProforma: boolean;
  isDraft: boolean;
  isConfirmed: boolean;
  isSent: boolean;
  isPaid: boolean;
  pdfFileName: string;
  statusCfg: StatusConfig;
  series: InvoiceSeries | undefined;
  createdByAgency?: InvoiceAgencyCreator | null;
  confirmPending: boolean;
  convertPending: boolean;
  convertToProformaPending: boolean;
  markSentPending: boolean;
  unmarkSentPending: boolean;
  unmarkPaidPending: boolean;
  onConfirm: () => void;
  onShowConvertModal: () => void;
  onShowConvertToProformaModal: () => void;
  onMarkSent: () => void;
  onUnmarkSent: () => void;
  onUnmarkPaid: () => void;
  onShowPaymentDialog: () => void;
}

export function InvoiceStatusHero({
  invoice,
  id,
  isProforma,
  isDraft,
  isConfirmed,
  isSent,
  isPaid,
  pdfFileName,
  statusCfg,
  series,
  createdByAgency,
  confirmPending,
  convertPending,
  convertToProformaPending,
  markSentPending,
  unmarkSentPending,
  unmarkPaidPending,
  onConfirm,
  onShowConvertModal,
  onShowConvertToProformaModal,
  onMarkSent,
  onUnmarkSent,
  onUnmarkPaid,
  onShowPaymentDialog,
}: InvoiceStatusHeroProps) {
  const router = useRouter();

  return (
    <div className={cn('rounded-xl border p-5', statusCfg.bg, statusCfg.border)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={cn('h-2 w-2 rounded-full', statusCfg.dot)} />
            <span
              className={cn('text-xs font-semibold uppercase tracking-widest', statusCfg.color)}
            >
              {statusCfg.label}
            </span>
          </div>
          <p className="text-3xl font-bold tracking-tight tabular-nums">
            {formatCurrency(invoice.total)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Base: {formatCurrency(invoice.subtotal)} ·{' '}
            {invoice.compensacionPercent != null ? (
              <>
                Comp. agraria ({invoice.compensacionPercent}%):{' '}
                +{formatCurrency(invoice.compensacionAmount ?? 0)}
              </>
            ) : (
              <>
                {(() => {
                  const rates = [...new Set((invoice.lines ?? []).map((l) => l.taxRate))];
                  return rates.length === 1 ? `IVA (${rates[0]}%)` : 'IVA';
                })()}
                : {formatCurrency(invoice.taxTotal)}
              </>
            )}
            {parseNum(invoice.irpfPercent) > 0 && (
              <> · IRPF: −{formatCurrency(invoice.irpfTotal)}</>
            )}
          </p>
        </div>
        <div className="flex flex-col gap-2 items-end shrink-0">
          {isDraft && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push(`/dashboard/facturas/nueva?edit=${id}`)}
              className="min-w-[160px]"
            >
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              {isProforma ? 'Editar proforma' : 'Editar borrador'}
            </Button>
          )}
          {isDraft && isProforma && (
            <Button
              size="sm"
              onClick={onShowConvertModal}
              disabled={convertPending}
              className="min-w-[160px]"
            >
              <ArrowRightLeft className="mr-1.5 h-3.5 w-3.5" />
              {convertPending ? 'Convirtiendo...' : 'Convertir a oficial'}
            </Button>
          )}
          {isDraft && !isProforma && (
            <Button
              size="sm"
              variant="outline"
              onClick={onShowConvertToProformaModal}
              disabled={convertToProformaPending}
              className="min-w-[160px] text-proforma-50 bg-proforma-500 border-proforma-300 hover:bg-proforma-300 hover:text-proforma-800"
            >
              <FileText className="mr-1.5 h-3.5 w-3.5" />
              {convertToProformaPending ? 'Convirtiendo...' : 'Guardar como proforma'}
            </Button>
          )}
          {isDraft && !isProforma && (
            <Button
              size="sm"
              onClick={onConfirm}
              disabled={confirmPending}
              className="min-w-[160px]"
            >
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
              {confirmPending ? 'Confirmando...' : 'Confirmar factura'}
            </Button>
          )}
          {isConfirmed && (
            <Button
              size="sm"
              variant="outline"
              onClick={onMarkSent}
              disabled={markSentPending}
              className="min-w-[140px]"
            >
              <Send className="mr-1.5 h-3.5 w-3.5" />
              {markSentPending ? 'Procesando...' : 'Marcar como enviada'}
            </Button>
          )}
          {isSent && (
            <Button
              size="sm"
              variant="outline"
              onClick={onUnmarkSent}
              disabled={unmarkSentPending}
              className="min-w-[140px] text-muted-foreground"
            >
              <Undo2 className="mr-1.5 h-3.5 w-3.5" />
              {unmarkSentPending ? 'Procesando...' : 'Deshacer envío'}
            </Button>
          )}
          {isPaid && (
            <Button
              size="sm"
              variant="outline"
              onClick={onUnmarkPaid}
              disabled={unmarkPaidPending}
              className="min-w-[140px] text-muted-foreground"
            >
              <Undo2 className="mr-1.5 h-3.5 w-3.5" />
              {unmarkPaidPending ? 'Procesando...' : 'Deshacer pago'}
            </Button>
          )}
          {!isDraft && parseNum(invoice.amountPaid) < parseNum(invoice.total) && (
            <Button size="sm" onClick={onShowPaymentDialog} className="min-w-[140px]">
              <Banknote className="mr-1.5 h-3.5 w-3.5" />
              Registrar cobro
            </Button>
          )}
          {(!isDraft || isProforma) && (
            <DownloadInvoiceButton
              invoiceId={id}
              fileName={pdfFileName}
              variant="outline"
              size="sm"
            />
          )}
        </div>
      </div>
      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-current/10">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Hash className="h-3 w-3" />
          <span>{invoice.number}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>Emitida {formatDateShort(invoice.issueDate)}</span>
        </div>
        {invoice.dueDate && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>Vence {formatDateShort(invoice.dueDate)}</span>
          </div>
        )}
        {createdByAgency && (
          <span
            className="inline-flex items-center gap-1 text-[10px] font-medium text-agency-700 bg-agency-100 dark:text-agency-300 dark:bg-agency-900/40 rounded px-1.5 py-0.5"
            title={`${createdByAgency.agencyName} · ${createdByAgency.userName}`}
          >
            <Building2 className="h-2.5 w-2.5" />
            asesoría
          </span>
        )}
        {!isDraft && (
          <InvoicePaymentSection invoice={invoice} onRegisterPayment={onShowPaymentDialog} />
        )}
      </div>
    </div>
  );
}
