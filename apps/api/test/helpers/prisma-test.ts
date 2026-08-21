import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../../src/prisma/prisma.service';

export const prismaTest = new PrismaService();

export async function cleanupTestData(ids: {
  expenseIds?: string[];
  supplierIds?: string[];
  attachmentIds?: string[];
  categoryIds?: string[];
  tenantIds?: string[];
  userIds?: string[];
}) {
  if (ids.expenseIds?.length) {
    await prismaTest.expense.deleteMany({
      where: { id: { in: ids.expenseIds } },
    });
  }
  if (ids.attachmentIds?.length) {
    await prismaTest.expenseAttachment.deleteMany({
      where: { id: { in: ids.attachmentIds } },
    });
  }
  if (ids.supplierIds?.length) {
    await prismaTest.supplier.deleteMany({
      where: { id: { in: ids.supplierIds } },
    });
  }
  if (ids.categoryIds?.length) {
    await prismaTest.expenseCategory.deleteMany({
      where: { id: { in: ids.categoryIds } },
    });
  }
  if (ids.tenantIds?.length) {
    await prismaTest.tenant.deleteMany({
      where: { id: { in: ids.tenantIds } },
    });
  }
  if (ids.userIds?.length) {
    await prismaTest.user.deleteMany({
      where: { id: { in: ids.userIds } },
    });
  }
}
