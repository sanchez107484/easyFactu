import { InvoiceLayout, Invoice, Tenant } from '@easyfactura/shared-types';

interface HeaderBlockProps {
  layout: InvoiceLayout;
  invoice: Invoice;
  tenant: Tenant;
}

function SenderInfo({
  invoice,
  tenant,
  layout,
}: {
  invoice: Invoice;
  tenant: Tenant;
  layout: InvoiceLayout;
}) {
  // Prefer snapshot fields (captured exclusively at confirmation time) over live tenant data.
  // Falls back to live data for invoices created before the snapshot feature was added.
  const name = invoice.issuerSnapshotName ?? tenant.businessName;
  const legalName =
    invoice.issuerSnapshotName != null ? invoice.issuerSnapshotLegalName : tenant.legalName;
  const nif = invoice.issuerSnapshotNif ?? tenant.nif;
  const address = invoice.issuerSnapshotAddress ?? tenant.address;
  const postalCode = invoice.issuerSnapshotPostalCode ?? tenant.postalCode;
  const city = invoice.issuerSnapshotCity ?? tenant.city;
  const province = invoice.issuerSnapshotProvince ?? tenant.province;
  const email = invoice.issuerSnapshotEmail ?? tenant.email;
  const phone = invoice.issuerSnapshotPhone ?? tenant.phone;

  return (
    <div className="flex flex-col gap-0.5 text-[10px]">
      <span className="font-bold text-sm">{name}</span>
      {legalName && legalName !== name && <span>{legalName}</span>}
      <span>{nif}</span>
      <span>{address}</span>
      <span>
        {postalCode} {city}, {province}
      </span>
      <span>{email}</span>
      {layout.header.showPhone && phone && <span>{phone}</span>}
      {/* IBAN is intentionally read from live tenant data — not the snapshot.
          The IBAN is not a fiscally required field (AEAT/VeriFactu) and showing the
          current account is preferable: a customer opening a historical invoice to pay
          today should see the active IBAN, not a possibly defunct one. */}
      {layout.header.showIban && tenant.iban && <span>IBAN: {tenant.iban}</span>}
    </div>
  );
}

function CustomerInfo({ invoice }: { invoice: Invoice }) {
  // Prefer snapshot fields (captured at creation/confirmation) over live customer relation.
  // Falls back to live data for invoices created before the snapshot feature was added.
  const hasSnapshot = invoice.customerSnapshotNif != null;
  const name = hasSnapshot ? (invoice.customerSnapshotName ?? '') : (invoice.customer?.name ?? '');
  const legalName = hasSnapshot ? invoice.customerSnapshotLegalName : invoice.customer?.legalName;
  const nif = hasSnapshot ? (invoice.customerSnapshotNif ?? '') : (invoice.customer?.nif ?? '');
  const address = hasSnapshot ? invoice.customerSnapshotAddress : invoice.customer?.address;
  const postalCode = hasSnapshot
    ? invoice.customerSnapshotPostalCode
    : invoice.customer?.postalCode;
  const city = hasSnapshot ? invoice.customerSnapshotCity : invoice.customer?.city;
  const province = hasSnapshot ? invoice.customerSnapshotProvince : invoice.customer?.province;
  const email = hasSnapshot ? invoice.customerSnapshotEmail : invoice.customer?.email;

  if (!name && !nif) return null;
  return (
    <div className="flex flex-col gap-0.5 text-[10px]">
      <span className="text-[9px] uppercase tracking-wide text-neutral-500 font-medium mb-0.5">
        Facturar a
      </span>
      <span className="font-bold text-sm">{name}</span>
      {legalName && legalName !== name && <span>{legalName}</span>}
      <span>{nif}</span>
      {address && <span>{address}</span>}
      {(postalCode || city || province) && (
        <span>
          {postalCode} {city}, {province}
        </span>
      )}
      {email && <span>{email}</span>}
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
            <SenderInfo invoice={invoice} tenant={tenant} layout={layout} />
            <CustomerInfo invoice={invoice} />
          </>
        ) : (
          <>
            <CustomerInfo invoice={invoice} />
            <SenderInfo invoice={invoice} tenant={tenant} layout={layout} />
          </>
        )}
      </div>
    </div>
  );
}
