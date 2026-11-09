import {
  InvoiceRecordType,
  resolveInvoiceRecordType,
} from '../../src/modules/verifactu/xml/invoice-record-type';
import {
  buildCancellationRecordXml,
  buildInvoiceRecordXml,
  InvoiceRecordXmlData,
} from '../../src/modules/verifactu/xml/verifactu-record.xml';

const ISSUER = { nif: 'B12345674', name: 'Óptica Ejemplo S.L.' };

function record(overrides: Partial<InvoiceRecordXmlData> = {}): InvoiceRecordXmlData {
  return {
    issuer: ISSUER,
    number: 'T-2026-000318',
    issueDate: new Date('2026-11-09T00:00:00Z'),
    operationDate: null,
    recordType: 'F1',
    rectification: null,
    replacedInvoices: [],
    recipient: { name: 'Laura Gómez Ruiz', nif: '12345678Z' },
    total: 121,
    discountAmount: null,
    irpfTotal: null,
    compensacionPercent: null,
    compensacionAmount: null,
    lines: [
      {
        subtotal: 100,
        taxRate: 21,
        taxAmount: 21,
        irpfAmount: null,
        surchargeRate: null,
        surchargeAmount: null,
      },
    ],
    hash: 'HASH-ACTUAL',
    prevHash: 'HASH-ANTERIOR',
    ...overrides,
  };
}

/** Text content of the first element with that tag, or null when absent. */
function tag(xml: string, name: string): string | null {
  const match = new RegExp(`<${name}>([\\s\\S]*?)</${name}>`).exec(xml);
  return match?.[1]?.trim() ?? null;
}

function indexOfTag(xml: string, name: string): number {
  return xml.indexOf(`<${name}>`);
}

describe('VeriFactu · record type (TipoFactura)', () => {
  const base = {
    invoiceType: 'standard',
    isRectificative: false,
    rectifiedInvoice: null,
    exchangedInvoiceCount: 0,
  };
  const cases: Array<[string, Parameters<typeof resolveInvoiceRecordType>[0], InvoiceRecordType]> =
    [
      ['complete invoice', base, 'F1'],
      ['simplified invoice', { ...base, invoiceType: 'simplified' }, 'F2'],
      ['exchange of simplified invoices', { ...base, exchangedInvoiceCount: 2 }, 'F3'],
      [
        'rectificative of a complete invoice',
        { ...base, isRectificative: true, rectifiedInvoice: { invoiceType: 'standard' } },
        'R4',
      ],
      [
        'rectificative of a simplified invoice',
        { ...base, isRectificative: true, rectifiedInvoice: { invoiceType: 'simplified' } },
        'R5',
      ],
      [
        'rectificative typed simplified (original not loaded)',
        { ...base, isRectificative: true, invoiceType: 'simplified' },
        'R5',
      ],
    ];

  it.each(cases)('%s → %s', (_label, source, expected) => {
    expect(resolveInvoiceRecordType(source)).toBe(expected);
  });
});

describe('VeriFactu · invoice record XML by record type', () => {
  it('F1 identifies the recipient with name and NIF', () => {
    const xml = buildInvoiceRecordXml(record());
    expect(tag(xml, 'TipoFactura')).toBe('F1');
    expect(tag(xml, 'Destinatarios')).toContain('<NIF>12345678Z</NIF>');
    expect(tag(xml, 'FechaExpedicionFactura')).toBe('09-11-2026');
    expect(tag(xml, 'ImporteTotal')).toBe('121.00');
    expect(tag(xml, 'Hash')).toBe('HASH-ACTUAL');
    expect(tag(xml, 'HashAnterior')).toBe('HASH-ANTERIOR');
    expect(xml).not.toContain('<TipoRectificativa>');
    expect(xml).not.toContain('<FacturasSustituidas>');
  });

  it('F2 never carries Destinatarios, with or without payer NIF', () => {
    const withNif = buildInvoiceRecordXml(record({ recordType: 'F2' }));
    const withoutNif = buildInvoiceRecordXml(
      record({ recordType: 'F2', recipient: { name: 'Consumidor final', nif: null } })
    );
    for (const xml of [withNif, withoutNif]) {
      expect(tag(xml, 'TipoFactura')).toBe('F2');
      expect(xml).not.toContain('<Destinatarios>');
      expect(xml).not.toContain('12345678Z');
    }
  });

  it('F3 lists the replaced simplified invoices (FacturasSustituidas) and the recipient', () => {
    const xml = buildInvoiceRecordXml(
      record({
        recordType: 'F3',
        replacedInvoices: [
          { issuerNif: ISSUER.nif, number: 'T-2026-000310', issueDate: new Date('2026-11-02') },
          { issuerNif: ISSUER.nif, number: 'T-2026-000311', issueDate: new Date('2026-11-03') },
        ],
      })
    );
    expect(tag(xml, 'TipoFactura')).toBe('F3');
    const replaced = tag(xml, 'FacturasSustituidas') ?? '';
    expect(replaced.match(/<IDFacturaSustituida>/g)).toHaveLength(2);
    expect(replaced).toContain('<NumSerieFactura>T-2026-000310</NumSerieFactura>');
    expect(replaced).toContain('<FechaExpedicionFactura>03-11-2026</FechaExpedicionFactura>');
    expect(xml).toContain('<Destinatarios>');
    expect(indexOfTag(xml, 'FacturasSustituidas')).toBeLessThan(indexOfTag(xml, 'Destinatarios'));
  });

  it('R4 (complete invoice return) references the rectified invoice and states the amount', () => {
    const xml = buildInvoiceRecordXml(
      record({
        recordType: 'R4',
        total: -60.5,
        lines: [
          {
            subtotal: -50,
            taxRate: 21,
            taxAmount: -10.5,
            irpfAmount: null,
            surchargeRate: null,
            surchargeAmount: null,
          },
        ],
        rectification: {
          type: 'S',
          rectified: {
            issuerNif: ISSUER.nif,
            number: 'F-2026-000020',
            issueDate: new Date('2026-11-01'),
          },
        },
      })
    );
    expect(tag(xml, 'TipoFactura')).toBe('R4');
    expect(tag(xml, 'TipoRectificativa')).toBe('S');
    expect(tag(xml, 'FacturasRectificadas')).toContain(
      '<NumSerieFactura>F-2026-000020</NumSerieFactura>'
    );
    expect(tag(xml, 'ImporteRectificacion')).toBe('60.50');
    expect(tag(xml, 'BaseImponible')).toBe('-50.00');
    expect(tag(xml, 'ImporteTotal')).toBe('-60.50');
    expect(xml).toContain('<Destinatarios>');
  });

  it('R5 (simplified invoice return) has no Destinatarios', () => {
    const xml = buildInvoiceRecordXml(
      record({
        recordType: 'R5',
        total: -12.1,
        recipient: { name: 'Consumidor final', nif: null },
        rectification: {
          type: 'S',
          rectified: {
            issuerNif: ISSUER.nif,
            number: 'T-2026-000318',
            issueDate: new Date('2026-11-08'),
          },
        },
      })
    );
    expect(tag(xml, 'TipoFactura')).toBe('R5');
    expect(tag(xml, 'TipoRectificativa')).toBe('S');
    expect(xml).toContain('<FacturasRectificadas>');
    expect(xml).not.toContain('<Destinatarios>');
  });

  it('substitution rectificatives use TipoRectificativa I and no ImporteRectificacion', () => {
    const xml = buildInvoiceRecordXml(
      record({ recordType: 'R4', rectification: { type: 'I', rectified: null } })
    );
    expect(tag(xml, 'TipoRectificativa')).toBe('I');
    expect(xml).not.toContain('<ImporteRectificacion>');
  });

  it('adds FechaOperacion only when it differs from the issue date, before Destinatarios', () => {
    const different = buildInvoiceRecordXml(
      record({ operationDate: new Date('2026-11-02T00:00:00Z') })
    );
    expect(tag(different, 'FechaOperacion')).toBe('02-11-2026');
    expect(indexOfTag(different, 'TipoFactura')).toBeLessThan(
      indexOfTag(different, 'FechaOperacion')
    );
    expect(indexOfTag(different, 'FechaOperacion')).toBeLessThan(
      indexOfTag(different, 'Destinatarios')
    );

    const same = buildInvoiceRecordXml(record({ operationDate: new Date('2026-11-09T00:00:00Z') }));
    expect(same).not.toContain('<FechaOperacion>');
  });

  it('groups the breakdown by VAT rate', () => {
    const line = { irpfAmount: null, surchargeRate: null, surchargeAmount: null };
    const xml = buildInvoiceRecordXml(
      record({
        lines: [
          { ...line, subtotal: 320, taxRate: 10, taxAmount: 32 },
          { ...line, subtotal: 89, taxRate: 21, taxAmount: 18.69 },
          { ...line, subtotal: 10, taxRate: 10, taxAmount: 1 },
        ],
      })
    );
    expect(xml.match(/<DetalleDesglose>/g)).toHaveLength(2);
    expect(xml).toContain('<BaseImponible>330.00</BaseImponible>');
    expect(xml).toContain('<CuotaImpuesto>33.00</CuotaImpuesto>');
  });

  it('escapes XML special characters in names and numbers', () => {
    const xml = buildInvoiceRecordXml(
      record({ recipient: { name: 'Gómez & Hijos <S.L.>', nif: 'B00000000' } })
    );
    expect(xml).toContain('Gómez &amp; Hijos &lt;S.L.&gt;');
  });
});

describe('VeriFactu · cancellation record XML (RegistroAnulacion)', () => {
  it('identifies the annulled invoice and is chained', () => {
    const xml = buildCancellationRecordXml({
      issuer: ISSUER,
      annulled: {
        issuerNif: ISSUER.nif,
        number: 'T-2026-000318',
        issueDate: new Date('2026-11-08'),
      },
      hash: 'HASH-ANULACION',
      prevHash: 'HASH-ANTERIOR',
    });
    expect(xml).toContain('<RegistroAnulacion>');
    expect(xml).not.toContain('<RegistroFactura>');
    expect(tag(xml, 'IDEmisorFacturaAnulada')).toBe(ISSUER.nif);
    expect(tag(xml, 'NumSerieFacturaAnulada')).toBe('T-2026-000318');
    expect(tag(xml, 'FechaExpedicionFacturaAnulada')).toBe('08-11-2026');
    expect(tag(xml, 'Hash')).toBe('HASH-ANULACION');
    expect(tag(xml, 'HashAnterior')).toBe('HASH-ANTERIOR');
    expect(xml).not.toContain('<Desglose>');
  });

  it('omits HashAnterior for the first record of the chain', () => {
    const xml = buildCancellationRecordXml({
      issuer: ISSUER,
      annulled: { issuerNif: ISSUER.nif, number: 'T-1', issueDate: new Date('2026-11-08') },
      hash: 'H',
      prevHash: null,
    });
    expect(xml).not.toContain('<HashAnterior>');
  });
});
