import { ConflictException, NotFoundException } from '@nestjs/common';
import { IHaciendaAdapter } from '../../src/modules/verifactu/interfaces/hacienda-adapter.interface';
import { VerifactuCancellationService } from '../../src/modules/verifactu/services/verifactu-cancellation.service';
import { VerifactuHashService } from '../../src/modules/verifactu/services/verifactu-hash.service';
import { PrismaService } from '../../src/prisma/prisma.service';

const TENANT = 'tenant-a';
const INVOICE = 'invoice-1';

function issuedInvoice(overrides: Record<string, unknown> = {}) {
  return {
    id: INVOICE,
    status: 'CONFIRMED',
    hash: 'HASH-FACTURA',
    isRectificative: false,
    rectificationType: null,
    exchangedByInvoiceId: null,
    rectificativeInvoices: [],
    ...overrides,
  };
}

function setup(invoice: Record<string, unknown> | null) {
  const tx = {
    invoice: { updateMany: jest.fn(async () => ({ count: 1 })) },
    invoiceCancellation: { create: jest.fn(async () => ({ id: 'cancellation-1' })) },
  };
  const prisma = {
    invoice: { findFirst: jest.fn(async () => invoice) },
    invoiceCancellation: {
      findFirst: jest.fn(async () => ({
        invoice: {
          number: 'T-1',
          issueDate: new Date('2026-11-08'),
          issuerSnapshotNif: 'B12345674',
        },
      })),
      update: jest.fn(),
    },
    $transaction: jest.fn(async (fn: (client: typeof tx) => unknown) => fn(tx)),
  } as unknown as PrismaService;
  const hashService = {
    generateCancellationHash: jest.fn(async () => ({
      hash: 'HASH-ANULACION',
      prevHash: 'HASH-FACTURA',
    })),
  } as unknown as VerifactuHashService;
  const adapter = {
    generateCancellationXml: jest.fn(async () => '<xml/>'),
    signXml: jest.fn(async (xml: string) => xml),
    sendCancellation: jest.fn(async () => undefined),
  } as unknown as IHaciendaAdapter;
  const service = new VerifactuCancellationService(prisma, hashService, adapter);
  return { prisma, tx, hashService, adapter, service };
}

describe('VeriFactu · cancellation records', () => {
  it('marks the invoice CANCELLED, frees replaced tickets and creates the record atomically', async () => {
    const { service, tx, prisma } = setup(issuedInvoice());
    await expect(service.cancelInvoice(TENANT, INVOICE, 'Ticket duplicado')).resolves.toEqual({
      id: 'cancellation-1',
    });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    const [[statusUpdate], [release]] = (tx.invoice.updateMany as jest.Mock).mock.calls;
    expect(statusUpdate).toMatchObject({
      where: { id: INVOICE, tenantId: TENANT },
      data: { status: 'CANCELLED' },
    });
    expect(release).toMatchObject({
      where: { tenantId: TENANT, exchangedByInvoiceId: INVOICE },
      data: { exchangedByInvoiceId: null },
    });
    expect(tx.invoiceCancellation.create).toHaveBeenCalledWith({
      data: { tenantId: TENANT, invoiceId: INVOICE, reason: 'Ticket duplicado' },
      select: { id: true },
    });
  });

  it('chains, signs and sends the record after creating it', async () => {
    const { service, prisma, hashService, adapter } = setup(issuedInvoice());
    await service.processCancellation(TENANT, 'cancellation-1');
    expect(hashService.generateCancellationHash).toHaveBeenCalledWith(TENANT, {
      issuerNif: 'B12345674',
      number: 'T-1',
      issueDate: new Date('2026-11-08'),
    });
    const [[update]] = (prisma.invoiceCancellation.update as jest.Mock).mock.calls;
    expect(update.data).toMatchObject({ hash: 'HASH-ANULACION', prevHash: 'HASH-FACTURA' });
    expect(update.data.chainedAt).toBeInstanceOf(Date);
    expect(adapter.sendCancellation).toHaveBeenCalledWith(TENANT, 'cancellation-1', '<xml/>');
  });

  it('keeps the hash and marks ERROR when sending fails', async () => {
    const { service, prisma, adapter } = setup(issuedInvoice());
    (adapter.sendCancellation as jest.Mock).mockRejectedValue(new Error('AEAT caída'));
    await service.processCancellation(TENANT, 'cancellation-1');
    const calls = (prisma.invoiceCancellation.update as jest.Mock).mock.calls;
    expect(calls.at(-1)?.[0].data).toEqual({ verifactuStatus: 'ERROR' });
  });

  it('returns NotFound for an invoice of another tenant', async () => {
    const { service, prisma } = setup(null);
    await expect(service.cancelInvoice(TENANT, INVOICE, 'Motivo')).rejects.toBeInstanceOf(
      NotFoundException
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it.each([
    ['already cancelled', { status: 'CANCELLED' }],
    ['a draft', { status: 'DRAFT' }],
    ['substituted (RECTIFIED)', { status: 'RECTIFIED' }],
    ['not hashed yet', { hash: null }],
    ['with issued rectificatives', { rectificativeInvoices: [{ id: 'r1' }] }],
    ['an exchanged simplified invoice', { exchangedByInvoiceId: 'f3' }],
    ['a substitution rectificative', { isRectificative: true, rectificationType: 'SUBSTITUTION' }],
  ])('rejects cancelling an invoice that is %s', async (_label, overrides) => {
    const { service, prisma } = setup(issuedInvoice(overrides));
    await expect(service.cancelInvoice(TENANT, INVOICE, 'Motivo')).rejects.toBeInstanceOf(
      ConflictException
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('fails without creating the record if the status changed concurrently', async () => {
    const { service, tx } = setup(issuedInvoice());
    (tx.invoice.updateMany as jest.Mock).mockResolvedValueOnce({ count: 0 });
    await expect(service.cancelInvoice(TENANT, INVOICE, 'Motivo')).rejects.toBeInstanceOf(
      ConflictException
    );
    expect(tx.invoiceCancellation.create).not.toHaveBeenCalled();
  });
});

describe('VeriFactu · hash chain across invoices and cancellations', () => {
  function chain(
    lastInvoice: { hash: string; chainedAt: Date | null } | null,
    lastCancellation: { hash: string; chainedAt: Date | null } | null
  ) {
    const prisma = {
      invoice: { findFirst: jest.fn(async () => lastInvoice) },
      invoiceCancellation: { findFirst: jest.fn(async () => lastCancellation) },
    } as unknown as PrismaService;
    return { prisma, service: new VerifactuHashService(prisma) };
  }

  it('links to the most recent record, whichever its kind', async () => {
    const older = new Date('2026-11-09T10:00:00Z');
    const newer = new Date('2026-11-09T10:05:00Z');
    await expect(
      chain(
        { hash: 'INV', chainedAt: older },
        { hash: 'ANU', chainedAt: newer }
      ).service.findPreviousHash(TENANT)
    ).resolves.toBe('ANU');
    await expect(
      chain(
        { hash: 'INV', chainedAt: newer },
        { hash: 'ANU', chainedAt: older }
      ).service.findPreviousHash(TENANT)
    ).resolves.toBe('INV');
  });

  it('treats invoices hashed before chainedAt existed as older than any cancellation', async () => {
    const { service } = chain(
      { hash: 'LEGACY', chainedAt: null },
      { hash: 'ANU', chainedAt: new Date() }
    );
    await expect(service.findPreviousHash(TENANT)).resolves.toBe('ANU');
  });

  it('starts the chain with no previous hash', async () => {
    await expect(chain(null, null).service.findPreviousHash(TENANT)).resolves.toBeNull();
  });

  it('considers every hashed invoice of the tenant, whatever its status', async () => {
    const { prisma, service } = chain({ hash: 'INV', chainedAt: new Date() }, null);
    await service.findPreviousHash(TENANT);
    const [[query]] = (prisma.invoice.findFirst as jest.Mock).mock.calls;
    expect(query.where).toEqual({ tenantId: TENANT, hash: { not: null } });
  });

  it('hashes a cancellation differently from the invoice it annuls', async () => {
    const { service } = chain({ hash: 'PREV', chainedAt: new Date() }, null);
    const annulled = { issuerNif: 'B12345674', number: 'T-1', issueDate: new Date('2026-11-08') };
    const invoiceHash = await service.generateHash(TENANT, { ...annulled, total: 12.1 });
    const cancellationHash = await service.generateCancellationHash(TENANT, annulled);
    expect(cancellationHash.prevHash).toBe('PREV');
    expect(cancellationHash.hash).toMatch(/^[0-9A-F]{64}$/);
    expect(cancellationHash.hash).not.toBe(invoiceHash.hash);
  });
});
