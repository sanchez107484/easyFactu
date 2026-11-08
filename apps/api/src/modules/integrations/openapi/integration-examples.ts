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
