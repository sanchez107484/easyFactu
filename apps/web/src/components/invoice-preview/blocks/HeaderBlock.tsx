import { InvoiceLayout, Invoice, Tenant } from '@easyfactura/shared-types';

interface HeaderBlockProps {
  layout: InvoiceLayout;
  invoice: Invoice;
  tenant: Tenant;
}

function SenderInfo({ tenant, layout }: { tenant: Tenant; layout: InvoiceLayout }) {
  return (
    <div className="flex flex-col gap-0.5 text-[10px]">
      <span className="font-bold text-sm">{tenant.businessName}</span>
      {tenant.legalName && tenant.legalName !== tenant.businessName && (
        <span>{tenant.legalName}</span>
      )}
      <span>{tenant.nif}</span>
      <span>{tenant.address}</span>
      <span>
        {tenant.postalCode} {tenant.city}, {tenant.province}
      </span>
      <span>{tenant.email}</span>
      {layout.header.showPhone && tenant.phone && <span>{tenant.phone}</span>}
      {layout.header.showIban && tenant.iban && <span>IBAN: {tenant.iban}</span>}
    </div>
  );
}

function CustomerInfo({ invoice }: { invoice: Invoice }) {
  const customer = invoice.customer;
  if (!customer) return null;
  return (
    <div className="flex flex-col gap-0.5 text-[10px]">
      <span className="text-[9px] uppercase tracking-wide text-neutral-500 font-medium mb-0.5">
        Facturar a
      </span>
      <span className="font-bold text-sm">{customer.name}</span>
      {customer.legalName && customer.legalName !== customer.name && (
        <span>{customer.legalName}</span>
      )}
      <span>{customer.nif}</span>
      <span>{customer.address}</span>
      <span>
        {customer.postalCode} {customer.city}, {customer.province}
      </span>
      {customer.email && <span>{customer.email}</span>}
    </div>
  );
}

// Traduce layout.logo.position a justify-content de flexbox
function logoJustify(position: InvoiceLayout['logo']['position']): string {
  switch (position) {
    case 'top-center':
      return 'center';
    case 'top-right':
      return 'flex-end';
    default:
      return 'flex-start'; // top-left
  }
}

export function HeaderBlock({ layout, invoice, tenant }: HeaderBlockProps) {
  const isLeftSender = layout.header.senderSide === 'left';
  const showLogo = layout.logo.visible && !!tenant.logoUrl;
  // 595px = A4 at 72 DPI → 2.83 px/mm (matches the margin conversion used in the preview)
  const logoWidthPx = layout.logo.widthMm * 2.83;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
      {/* ── Logo: fila propia, posicionada independientemente ── */}
      {showLogo && (
        <div
          style={{
            display: 'flex',
            width: '100%',
            justifyContent: logoJustify(layout.logo.position),
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={tenant.logoUrl!}
            alt={tenant.businessName}
            style={{
              width: `${logoWidthPx}px`,
              maxHeight: `${logoWidthPx * 0.6}px`, // ratio 5:3 máximo
              objectFit: 'contain',
              display: 'block',
              flexShrink: 0,
            }}
          />
        </div>
      )}

      {/* ── Emisor / Cliente: dos columnas ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', width: '100%' }}>
        {isLeftSender ? (
          <>
            <SenderInfo tenant={tenant} layout={layout} />
            <CustomerInfo invoice={invoice} />
          </>
        ) : (
          <>
            <CustomerInfo invoice={invoice} />
            <SenderInfo tenant={tenant} layout={layout} />
          </>
        )}
      </div>
    </div>
  );
}
