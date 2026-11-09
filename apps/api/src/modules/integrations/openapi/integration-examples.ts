/** Request examples published in the OpenAPI for the ERP (same data as the integration plan). */
export const ISSUE_INVOICE_EXAMPLES = {
  simplificada: {
    summary: 'Ticket (simplificada) con dos tipos de IVA',
    value: {
      externalRef: 'VENTA-2026-001234',
      invoiceType: 'simplified',
      operationDate: '2026-11-08',
      paymentMethod: 'CARD',
      customer: { externalId: 'PAG-000981', name: 'Laura Gómez Ruiz', nif: '12345678Z' },
      lines: [
        {
          description: 'Gafas graduadas progresivas',
          quantity: '1',
          unitPriceWithTax: '352.00',
          taxRate: '10',
        },
        {
          description: 'Gafas de sol',
          quantity: '1',
          unitPriceWithTax: '107.69',
          taxRate: '21',
          discountPercent: '0',
        },
      ],
      regimeData: null,
    },
  },
  simplificadaSinPagador: {
    summary: 'Ticket sin pagador (se emite a "Consumidor final")',
    value: {
      externalRef: 'VENTA-2026-001240',
      invoiceType: 'simplified',
      paymentMethod: 'CASH',
      lines: [
        {
          description: 'Líquido de lentes de contacto',
          quantity: '2',
          unitPriceWithTax: '9.90',
          taxRate: '21',
        },
      ],
    },
  },
  simplificadaPagadorSinNif: {
    summary: 'Ticket con pagador sin NIF y fecha de operación anterior',
    value: {
      externalRef: 'VENTA-2026-001241',
      invoiceType: 'simplified',
      operationDate: '2026-11-02',
      paymentMethod: 'CARD',
      customer: { externalId: 'PAG-000990', name: 'Carmen Ruiz' },
      lines: [
        {
          description: 'Revisión y ajuste de montura',
          quantity: '1',
          unitPriceWithTax: '15.00',
          taxRate: '21',
        },
      ],
    },
  },
  completa: {
    summary: 'Factura completa con domicilio del pagador',
    value: {
      externalRef: 'VENTA-2026-001235-1',
      invoiceType: 'standard',
      paymentMethod: 'BANK_TRANSFER',
      customer: {
        externalId: 'PAG-000982',
        name: 'Seguros Ejemplo S.A.',
        nif: 'A58818501',
        email: 'facturas@segurosejemplo.es',
        address: {
          line1: 'Av. Carlos III 10',
          postalCode: '31002',
          city: 'Pamplona',
          province: 'Navarra',
        },
      },
      lines: [
        {
          description: 'Lentes de contacto mensuales',
          quantity: '6',
          unitPriceWithTax: '18.50',
          taxRate: '10',
          discountPercent: '10',
        },
      ],
    },
  },
};

export const PROVISION_ACCOUNT_EXAMPLE = {
  erpAccountId: 'EMP-0042',
  nif: 'B12345674',
  businessName: 'Óptica Ejemplo',
  legalName: 'Óptica Ejemplo S.L.',
  email: 'titular@opticaejemplo.es',
  owner: { firstName: 'María', lastName: 'Pérez', email: 'titular@opticaejemplo.es' },
  address: { line1: 'C/ Mayor 1', postalCode: '31001', city: 'Pamplona', province: 'Navarra' },
};

export const RECTIFY_INVOICE_EXAMPLE = {
  externalRef: 'DEV-2026-000045',
  reason: 'Devolución de las gafas de sol',
  lines: [
    { description: 'Gafas de sol', quantity: '1', unitPriceWithTax: '107.69', taxRate: '21' },
  ],
};

export const EXCHANGE_INVOICES_EXAMPLE = {
  externalRef: 'CANJE-2026-000012',
  invoiceIds: ['8f0c3a52-2c7e-4f1e-9a51-0d6b1f0f9c11'],
  customer: {
    externalId: 'PAG-000981',
    name: 'Laura Gómez Ruiz',
    nif: '12345678Z',
    address: { line1: 'C/ Estafeta 5', postalCode: '31001', city: 'Pamplona', province: 'Navarra' },
  },
};

export const CANCEL_INVOICE_EXAMPLE = { reason: 'Ticket duplicado por error en caja' };
