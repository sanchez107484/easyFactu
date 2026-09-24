import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Plan } from '@easyfactura/shared-types';
import { ExpenseAttachmentsService } from '../src/modules/expense-attachments/expense-attachments.service';
import { prismaTest, cleanupTestData } from './helpers/prisma-test';
import {
  createTestTenant,
  createTestUser,
  linkTenantUser,
  createTestCategory,
  createTestExpense,
  createTestAttachment,
} from './helpers/test-data';

jest.setTimeout(30000);

function createMulterFile(overrides: Partial<Express.Multer.File> = {}): Express.Multer.File {
  const { Readable } = require('stream');
  const emptyReadable = new Readable();
  emptyReadable.push(null);
  return {
    fieldname: 'file',
    originalname: overrides.originalname ?? 'receipt.pdf',
    encoding: '7bit',
    mimetype: overrides.mimetype ?? 'application/pdf',
    size: overrides.size ?? 1024,
    buffer: overrides.buffer ?? Buffer.from('test'),
    destination: '',
    filename: '',
    path: '',
    stream: emptyReadable,
  };
}

describe('ExpenseAttachmentsService security', () => {
  const attachmentsService = new ExpenseAttachmentsService(prismaTest);
  let tenantAId: string;
  let tenantBId: string;
  let userAId: string;
  let userBId: string;
  let categoryAId: string;
  let categoryBId: string;
  let expenseAId: string;
  let expenseBIdValue: string;

  const tracked = {
    tenantIds: [] as string[],
    userIds: [] as string[],
    categoryIds: [] as string[],
    expenseIds: [] as string[],
    attachmentIds: [] as string[],
  };

  beforeAll(async () => {
    const tenantA = await createTestTenant(Plan.PROFESSIONAL);
    const tenantB = await createTestTenant(Plan.PROFESSIONAL);
    tenantAId = tenantA.id;
    tenantBId = tenantB.id;
    tracked.tenantIds.push(tenantAId, tenantBId);

    const userA = await createTestUser();
    const userB = await createTestUser();
    userAId = userA.id;
    userBId = userB.id;
    tracked.userIds.push(userAId, userBId);

    await linkTenantUser(tenantAId, userAId);
    await linkTenantUser(tenantBId, userBId);

    const categoryA = await createTestCategory('Category A');
    const categoryB = await createTestCategory('Category B');
    categoryAId = categoryA.id;
    categoryBId = categoryB.id;
    tracked.categoryIds.push(categoryAId, categoryBId);

    const expenseA = await createTestExpense(tenantAId, userAId, categoryAId);
    expenseAId = expenseA.id;
    tracked.expenseIds.push(expenseAId);

    const expenseB = await createTestExpense(tenantBId, userBId, categoryBId);
    expenseBIdValue = expenseB.id;
    tracked.expenseIds.push(expenseB.id);
  });

  afterAll(async () => {
    await cleanupTestData(tracked);
    await prismaTest.$disconnect();
  });

  it('should not allow tenant A to read tenant B attachment', async () => {
    const attachmentB = await createTestAttachment(tenantBId, userBId);
    tracked.attachmentIds.push(attachmentB.id);
    await expect(attachmentsService.findOne(tenantAId, attachmentB.id)).rejects.toThrow(NotFoundException);
  });

  it('should not allow tenant A to download tenant B attachment', async () => {
    const attachmentB = await createTestAttachment(tenantBId, userBId);
    tracked.attachmentIds.push(attachmentB.id);
    await expect(attachmentsService.download(tenantAId, attachmentB.id)).rejects.toThrow(NotFoundException);
  });

  it('should not allow tenant A to delete tenant B attachment', async () => {
    const attachmentB = await createTestAttachment(tenantBId, userBId);
    tracked.attachmentIds.push(attachmentB.id);
    await expect(attachmentsService.remove(tenantAId, attachmentB.id)).rejects.toThrow(NotFoundException);
  });

  it('should not allow uploading an attachment to an expense from another tenant', async () => {
    await expect(
      attachmentsService.upload(tenantAId, userAId, createMulterFile(), { expenseId: expenseBIdValue })
    ).rejects.toThrow(NotFoundException);
  });

  it('should reject files larger than 5MB', async () => {
    await expect(
      attachmentsService.upload(tenantAId, userAId, createMulterFile({ size: 6 * 1024 * 1024 }))
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject disallowed mime types', async () => {
    await expect(
      attachmentsService.upload(tenantAId, userAId, createMulterFile({ mimetype: 'application/zip' }))
    ).rejects.toThrow(BadRequestException);
  });

  it('should allow uploading, downloading and removing own attachment', async () => {
    const uploaded = await attachmentsService.upload(
      tenantAId,
      userAId,
      createMulterFile({ originalname: 'invoice.pdf' }),
      { expenseId: expenseAId }
    );
    tracked.attachmentIds.push(uploaded.id);
    expect(uploaded.fileName).toBe('invoice.pdf');

    const found = await attachmentsService.findOne(tenantAId, uploaded.id);
    expect(found.id).toBe(uploaded.id);

    const downloaded = await attachmentsService.download(tenantAId, uploaded.id);
    expect(downloaded.buffer.toString()).toBe('test');

    await attachmentsService.remove(tenantAId, uploaded.id);
    tracked.attachmentIds = tracked.attachmentIds.filter((id) => id !== uploaded.id);
    await expect(attachmentsService.findOne(tenantAId, uploaded.id)).rejects.toThrow(NotFoundException);
  });
});
