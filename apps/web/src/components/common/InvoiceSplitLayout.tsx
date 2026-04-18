'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { LiveInvoicePreview } from '@/components/facturas/LiveInvoicePreview';
import type { PaymentDetails } from '@/components/facturas/LiveInvoicePreview';
import type { Invoice, InvoiceTemplate, Tenant } from '@easyfactura/shared-types';

interface InvoiceSplitLayoutProps {
  // Header
  backHref: string;
  /** Left side of the header: title, breadcrumb, badges */
  headerLeft: React.ReactNode;
  /** Right side of the header: action buttons */
  headerRight: React.ReactNode;

  // Left panel content — form or info cards
  children: React.ReactNode;

  // Right panel — live invoice preview
  invoice: Invoice;
  template: InvoiceTemplate | null;
  tenant: Tenant | null;
  paymentDetails?: PaymentDetails;
  activeFieldSection?: string | null;
  onSectionClick?: (fieldId: string) => void;
  invoiceType?: string | null;
}

export function InvoiceSplitLayout({
  backHref,
  headerLeft,
  headerRight,
  children,
  invoice,
  template,
  tenant,
  paymentDetails,
  activeFieldSection = null,
  onSectionClick = () => {},
  invoiceType,
}: InvoiceSplitLayoutProps) {
  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-6 py-3 border-b bg-background shrink-0">
        <div className="flex items-center gap-3">
          <Link href={backHref}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          {headerLeft}
        </div>
        <div className="flex items-center gap-2">{headerRight}</div>
      </div>

      {/* ── Split panel ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT 60% */}
        <div className="w-[60%] overflow-y-auto border-r">{children}</div>

        {/* RIGHT 40% */}
        <div className="w-[40%] flex flex-col overflow-hidden">
          <LiveInvoicePreview
            invoice={invoice}
            template={template}
            tenant={tenant}
            activeFieldSection={activeFieldSection}
            onSectionClick={onSectionClick}
            paymentDetails={paymentDetails}
            invoiceType={invoiceType}
          />
        </div>
      </div>
    </div>
  );
}
