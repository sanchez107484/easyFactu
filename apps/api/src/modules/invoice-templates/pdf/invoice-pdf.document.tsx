/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck — @react-pdf/renderer components are incompatible with React 18 types (missing `refs`)
// NOTE: @react-pdf/renderer is NOT imported at the top level because it is ESM-only.
// The `renderer` object is injected at runtime via the `createInvoicePdfElement` factory.
import { Invoice, InvoiceLayout, InvoiceTemplate, Tenant } from '@easyfactura/shared-types';
import { formatIban } from '@easyfactura/shared-validators';
import { formatCurrency } from '../../../common/utils/format';

interface InvoicePdfDocumentProps {
  invoice: Invoice;
  template: InvoiceTemplate;
  tenant: Tenant;
  logoAbsolutePath?: string;
}

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})`
    : hex;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatPercent(value: number): string {
  return `${value}%`;
}

function buildStyles(StyleSheet: any, layout: InvoiceLayout) {
  const { typography, colors, page } = layout;
  const base = typography.baseFontSize;

  return StyleSheet.create({
    page: {
      fontFamily:
        typography.fontFamily === 'times-roman'
          ? 'Times-Roman'
          : typography.fontFamily === 'courier'
            ? 'Courier'
            : 'Helvetica',
      fontSize: base,
      color: colors.textPrimary,
      paddingTop: page.marginTop,
      paddingRight: page.marginRight,
      paddingBottom: page.marginBottom,
      paddingLeft: page.marginLeft,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    senderBlock: {
      maxWidth: '48%',
    },
    customerBlock: {
      maxWidth: '48%',
    },
    logo: {
      width: layout.logo.widthMm,
      marginBottom: 6,
    },
    businessName: {
      fontSize: base + 2,
      fontFamily:
        typography.fontFamily === 'times-roman'
          ? 'Times-Bold'
          : typography.fontFamily === 'courier'
            ? 'Courier-Bold'
            : 'Helvetica-Bold',
      marginBottom: 2,
    },
    labelText: {
      color: colors.textSecondary,
      fontSize: base - 1,
    },
    valueText: {
      color: colors.textPrimary,
      fontSize: base,
      marginBottom: 2,
    },
    sectionLabel: {
      fontSize: base - 1,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    divider: {
      borderBottomWidth: 1,
      borderBottomColor: colors.tableHeader,
      marginVertical: 10,
    },
    metaRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    metaItem: {
      flexDirection: 'column',
    },
    metaLabel: {
      fontSize: base - 1,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    metaValue: {
      fontSize: base,
      fontFamily:
        typography.fontFamily === 'times-roman'
          ? 'Times-Bold'
          : typography.fontFamily === 'courier'
            ? 'Courier-Bold'
            : 'Helvetica-Bold',
    },
    invoiceTitle: {
      fontSize: base + 6,
      fontFamily:
        typography.fontFamily === 'times-roman'
          ? 'Times-Bold'
          : typography.fontFamily === 'courier'
            ? 'Courier-Bold'
            : 'Helvetica-Bold',
      color: colors.primary,
      marginBottom: 8,
    },
    tableHeader: {
      flexDirection: 'row',
      backgroundColor: colors.tableHeader,
      paddingVertical: 5,
      paddingHorizontal: 4,
      marginBottom: 2,
    },
    tableRow: {
      flexDirection: 'row',
      paddingVertical: 5,
      paddingHorizontal: 4,
      borderBottomWidth:
        layout.itemsTable.style === 'grid' ? 1 : layout.itemsTable.style === 'lines' ? 1 : 0,
      borderBottomColor: colors.tableHeader,
    },
    colDescription: { flex: 3 },
    colQty: { flex: 1, textAlign: 'right' },
    colPrice: { flex: 1.5, textAlign: 'right' },
    colTax: { flex: 1, textAlign: 'right' },
    colDiscount: { flex: 1, textAlign: 'right' },
    colTotal: { flex: 1.5, textAlign: 'right' },
    colRef: { flex: 1 },
    headerCell: {
      fontSize: base - 1,
      fontFamily:
        typography.fontFamily === 'times-roman'
          ? 'Times-Bold'
          : typography.fontFamily === 'courier'
            ? 'Courier-Bold'
            : 'Helvetica-Bold',
      color: colors.textPrimary,
    },
    cell: {
      fontSize: base,
      color: colors.textPrimary,
    },
    totalsContainer: {
      alignItems: 'flex-end',
      marginTop: 12,
    },
    totalsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: 200,
      paddingVertical: 2,
    },
    totalsLabel: {
      fontSize: base,
      color: colors.textSecondary,
    },
    totalsValue: {
      fontSize: base,
      color: colors.textPrimary,
    },
    totalFinalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: 200,
      paddingVertical: 4,
      borderTopWidth: 1,
      borderTopColor: colors.primary,
      marginTop: 4,
    },
    totalFinalLabel: {
      fontSize: base + 1,
      fontFamily:
        typography.fontFamily === 'times-roman'
          ? 'Times-Bold'
          : typography.fontFamily === 'courier'
            ? 'Courier-Bold'
            : 'Helvetica-Bold',
      color: colors.primary,
    },
    totalFinalValue: {
      fontSize: base + 1,
      fontFamily:
        typography.fontFamily === 'times-roman'
          ? 'Times-Bold'
          : typography.fontFamily === 'courier'
            ? 'Courier-Bold'
            : 'Helvetica-Bold',
      color: colors.primary,
    },
    footer: {
      position: 'absolute',
      bottom: page.marginBottom,
      left: page.marginLeft,
      right: page.marginRight,
      borderTopWidth: 1,
      borderTopColor: colors.tableHeader,
      paddingTop: 6,
    },
    footerText: {
      fontSize: base - 1,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    paymentInfoRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 4,
    },
    paymentText: {
      fontSize: base - 1,
      color: colors.textSecondary,
    },
  });
}

export function createInvoicePdfElement(
  renderer: any,
  { invoice, template, tenant, logoAbsolutePath }: InvoicePdfDocumentProps
): any {
  const { Document, Page, Text, View, Image, StyleSheet } = renderer;
  const layout = template.layout as InvoiceLayout;
  const styles = buildStyles(StyleSheet, layout);
  const lines = invoice.lines ?? [];

  const showUnitPrice = layout.itemsTable.showUnitPrice ?? true;
  const showTaxColumn = layout.itemsTable.showTaxColumn ?? true;
  const showLineTotal = layout.itemsTable.showLineTotal ?? true;

  // Prefer immutable snapshot fields; fall back to live tenant relation for backwards compat.
  const senderName = invoice.issuerSnapshotName ?? tenant.businessName;
  const senderLegalName =
    invoice.issuerSnapshotName != null ? invoice.issuerSnapshotLegalName : tenant.legalName;
  const senderNif = invoice.issuerSnapshotNif ?? tenant.nif;
  const senderAddress = invoice.issuerSnapshotAddress ?? tenant.address;
  const senderPostalCode = invoice.issuerSnapshotPostalCode ?? tenant.postalCode;
  const senderCity = invoice.issuerSnapshotCity ?? tenant.city;
  const senderProvince = invoice.issuerSnapshotProvince ?? tenant.province;
  const senderEmail = invoice.issuerSnapshotEmail ?? tenant.email;
  const senderPhone = invoice.issuerSnapshotPhone ?? tenant.phone;

  const senderBlock = (
    <View style={styles.senderBlock}>
      {layout.logo.visible && logoAbsolutePath && (
        <Image style={styles.logo} src={logoAbsolutePath} />
      )}
      <Text style={styles.businessName}>{senderName}</Text>
      {senderLegalName && senderLegalName !== senderName && (
        <Text style={styles.valueText}>{senderLegalName}</Text>
      )}
      <Text style={styles.valueText}>{senderNif}</Text>
      <Text style={styles.valueText}>{senderAddress}</Text>
      <Text style={styles.valueText}>
        {senderPostalCode} {senderCity}, {senderProvince}
      </Text>
      <Text style={styles.valueText}>{senderEmail}</Text>
      {layout.header.showPhone && senderPhone && (
        <Text style={styles.valueText}>{senderPhone}</Text>
      )}
      {/* IBAN is intentionally read from live tenant data — not the snapshot.
          The IBAN is not a fiscally required field (AEAT/VeriFactu) and showing the
          current account is preferable: a customer opening a historical invoice to pay
          today should see the active IBAN, not a possibly defunct one. */}
      {layout.header.showIban && tenant.iban && (
        <Text style={styles.valueText}>IBAN: {formatIban(tenant.iban)}</Text>
      )}
    </View>
  );

  // Prefer immutable snapshot fields; fall back to live customer relation.
  const hasCustomerSnapshot = invoice.customerSnapshotNif != null;
  const custName = hasCustomerSnapshot
    ? (invoice.customerSnapshotName ?? '')
    : (invoice.customer?.name ?? '');
  const custLegalName = hasCustomerSnapshot
    ? invoice.customerSnapshotLegalName
    : invoice.customer?.legalName;
  const custNif = hasCustomerSnapshot
    ? (invoice.customerSnapshotNif ?? '')
    : (invoice.customer?.nif ?? '');
  const custAddress = hasCustomerSnapshot
    ? invoice.customerSnapshotAddress
    : invoice.customer?.address;
  const custPostalCode = hasCustomerSnapshot
    ? invoice.customerSnapshotPostalCode
    : invoice.customer?.postalCode;
  const custCity = hasCustomerSnapshot ? invoice.customerSnapshotCity : invoice.customer?.city;
  const custProvince = hasCustomerSnapshot
    ? invoice.customerSnapshotProvince
    : invoice.customer?.province;
  const custEmail = hasCustomerSnapshot ? invoice.customerSnapshotEmail : invoice.customer?.email;

  const customerBlock =
    custName || custNif ? (
      <View style={styles.customerBlock}>
        <Text style={styles.sectionLabel}>Facturar a</Text>
        <Text style={styles.businessName}>{custName}</Text>
        {custLegalName && custLegalName !== custName && (
          <Text style={styles.valueText}>{custLegalName}</Text>
        )}
        <Text style={styles.valueText}>{custNif}</Text>
        {custAddress && <Text style={styles.valueText}>{custAddress}</Text>}
        {(custPostalCode || custCity || custProvince) && (
          <Text style={styles.valueText}>
            {custPostalCode} {custCity}, {custProvince}
          </Text>
        )}
        {custEmail && <Text style={styles.valueText}>{custEmail}</Text>}
      </View>
    ) : null;

  const isLeftSender = layout.header.senderSide === 'left';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerRow}>
          {isLeftSender ? senderBlock : customerBlock}
          {isLeftSender ? customerBlock : senderBlock}
        </View>

        <View style={styles.divider} />

        {/* Invoice meta */}
        <Text style={styles.invoiceTitle}>
          {invoice.isRectificative ? 'FACTURA RECTIFICATIVA' : 'FACTURA'}
        </Text>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Número</Text>
            <Text style={styles.metaValue}>{invoice.number}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Fecha de emisión</Text>
            <Text style={styles.metaValue}>{formatDate(invoice.issueDate)}</Text>
          </View>
          {invoice.dueDate && (
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Fecha de vencimiento</Text>
              <Text style={styles.metaValue}>{formatDate(invoice.dueDate)}</Text>
            </View>
          )}
        </View>

        {/* Lines table */}
        <View>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, styles.colDescription]}>Descripción</Text>
            {layout.itemsTable.showReference && (
              <Text style={[styles.headerCell, styles.colRef]}>Ref.</Text>
            )}
            <Text style={[styles.headerCell, styles.colQty]}>Cant.</Text>
            {showUnitPrice && <Text style={[styles.headerCell, styles.colPrice]}>Precio</Text>}
            {showTaxColumn && <Text style={[styles.headerCell, styles.colTax]}>IVA</Text>}
            {layout.itemsTable.showDiscount && (
              <Text style={[styles.headerCell, styles.colDiscount]}>Dto.</Text>
            )}
            {showLineTotal && <Text style={[styles.headerCell, styles.colTotal]}>Total</Text>}
          </View>

          {lines.map((line) => (
            <View key={line.id} style={styles.tableRow}>
              <Text style={[styles.cell, styles.colDescription]}>{line.description}</Text>
              <Text style={[styles.cell, styles.colQty]}>{line.quantity}</Text>
              {showUnitPrice && (
                <Text style={[styles.cell, styles.colPrice]}>{formatCurrency(line.unitPrice)}</Text>
              )}
              {showTaxColumn && (
                <Text style={[styles.cell, styles.colTax]}>{formatPercent(line.taxRate)}</Text>
              )}
              {layout.itemsTable.showDiscount && (
                <Text style={[styles.cell, styles.colDiscount]}>—</Text>
              )}
              {showLineTotal && (
                <Text style={[styles.cell, styles.colTotal]}>{formatCurrency(line.lineTotal)}</Text>
              )}
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsContainer}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Base imponible</Text>
            <Text style={styles.totalsValue}>{formatCurrency(invoice.subtotal)}</Text>
          </View>

          {(invoice.discountAmount ?? 0) > 0 && (
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>
                Descuento ({formatPercent(invoice.discountPercent ?? 0)})
              </Text>
              <Text style={styles.totalsValue}>-{formatCurrency(invoice.discountAmount ?? 0)}</Text>
            </View>
          )}

          {layout.totals.showTaxBreakdown &&
            (() => {
              const lines = invoice.lines ?? [];
              const taxRates = [...new Set(lines.map((l) => l.taxRate))];
              const ivaLabel =
                taxRates.length === 1 ? `IVA (${formatPercent(taxRates[0])})` : 'IVA';
              return (
                <View style={styles.totalsRow}>
                  <Text style={styles.totalsLabel}>{ivaLabel}</Text>
                  <Text style={styles.totalsValue}>{formatCurrency(invoice.taxTotal)}</Text>
                </View>
              );
            })()}

          {(invoice.irpfTotal ?? 0) > 0 && (
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>
                IRPF ({formatPercent(invoice.irpfPercent ?? 0)})
              </Text>
              <Text style={styles.totalsValue}>-{formatCurrency(invoice.irpfTotal ?? 0)}</Text>
            </View>
          )}

          <View style={styles.totalFinalRow}>
            <Text style={styles.totalFinalLabel}>TOTAL</Text>
            <Text style={styles.totalFinalValue}>{formatCurrency(invoice.total)}</Text>
          </View>
        </View>

        {/* Notes */}
        {invoice.notes && (
          <View style={{ marginTop: 20 }}>
            <Text style={styles.sectionLabel}>Notas</Text>
            <Text style={[styles.valueText, { fontSize: layout.typography.baseFontSize - 1 }]}>
              {invoice.notes}
            </Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          {/* IBAN intentionally live — see header block comment above. */}
          {layout.footer.showPaymentInfo && invoice.customer && tenant.iban && (
            <View style={styles.paymentInfoRow}>
              <Text style={styles.paymentText}>
                Transfiere a: {formatIban(tenant.iban)}
                {tenant.bankAccountHolder ? ` · ${tenant.bankAccountHolder}` : ''}
              </Text>
            </View>
          )}
          {layout.footer.text && <Text style={styles.footerText}>{layout.footer.text}</Text>}
          {/* {layout.footer.showVerifactuQr && invoice.verifactuQr && (
            <Text style={[styles.footerText, { marginTop: 4 }]}>
              Verificación VeriFactu: {invoice.verifactuQr}
            </Text>
          )} */}
        </View>
      </Page>
    </Document>
  );
}
