import { randomUUID } from 'crypto';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  PaginatedResponse,
  ReportHistoryEntry,
  ReportParameters,
  ReportType,
} from '@easyfactura/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import { ReportsStorageService } from './reports-storage.service';
import { QueryReportHistoryDto } from './dto/query-report-history.dto';
import { parseHistoryParameters } from './report-history-parameters';

/** Only the most recent reports per tenant keep their row + stored file. */
const MAX_HISTORY_PER_TENANT = 50;

export interface RecordReportInput {
  tenantId: string;
  userId: string;
  generatedByAgency: boolean;
  type: ReportType;
  fromDate: string;
  toDate: string;
  parameters: ReportParameters;
  fileName: string;
  file: Buffer;
}

const HISTORY_SELECT = {
  id: true,
  type: true,
  fromDate: true,
  toDate: true,
  parameters: true,
  fileName: true,
  fileSize: true,
  storagePath: true,
  generatedByAgency: true,
  createdAt: true,
  generatedByUser: { select: { firstName: true, lastName: true, email: true } },
} satisfies Prisma.ReportHistorySelect;

type HistoryRow = Prisma.ReportHistoryGetPayload<{ select: typeof HISTORY_SELECT }>;

@Injectable()
export class ReportsHistoryService {
  private readonly logger = new Logger(ReportsHistoryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: ReportsStorageService
  ) {}

  async record(input: RecordReportInput): Promise<string> {
    const id = randomUUID();
    const storagePath = await this.tryStoreFile(input.tenantId, id, input.file);

    await this.prisma.reportHistory.create({
      data: {
        id,
        tenantId: input.tenantId,
        generatedByUserId: input.userId,
        generatedByAgency: input.generatedByAgency,
        type: input.type,
        fromDate: new Date(input.fromDate),
        toDate: new Date(input.toDate),
        parameters: input.parameters as unknown as Prisma.InputJsonObject,
        fileName: input.fileName,
        fileSize: input.file.length,
        storagePath,
      },
    });

    await this.pruneOldEntries(input.tenantId);
    return id;
  }

  async list(
    tenantId: string,
    query: QueryReportHistoryDto
  ): Promise<PaginatedResponse<ReportHistoryEntry>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const [rows, total] = await Promise.all([
      this.prisma.reportHistory.findMany({
        where: { tenantId },
        select: HISTORY_SELECT,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.reportHistory.count({ where: { tenantId } }),
    ]);

    return {
      data: rows.map(toHistoryEntry),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getFile(tenantId: string, id: string): Promise<{ fileName: string; file: Buffer }> {
    const entry = await this.prisma.reportHistory.findFirst({
      where: { id, tenantId },
      select: { fileName: true, storagePath: true },
    });
    if (!entry) throw new NotFoundException('Informe no encontrado');

    const file = entry.storagePath ? await this.storage.download(entry.storagePath) : null;
    if (!file) throw new NotFoundException('El archivo de este informe ya no está disponible');

    return { fileName: entry.fileName, file };
  }

  /** Storage failures must not block the download the user just requested. */
  private async tryStoreFile(tenantId: string, id: string, file: Buffer): Promise<string | null> {
    if (!this.storage.isEnabled) return null;

    const storagePath = this.storage.buildPath(tenantId, id);
    try {
      await this.storage.upload(storagePath, file);
      return storagePath;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to store report ${id}: ${message}`);
      return null;
    }
  }

  private async pruneOldEntries(tenantId: string): Promise<void> {
    const stale = await this.prisma.reportHistory.findMany({
      where: { tenantId },
      select: { id: true, storagePath: true },
      orderBy: { createdAt: 'desc' },
      skip: MAX_HISTORY_PER_TENANT,
    });
    if (stale.length === 0) return;

    await this.prisma.reportHistory.deleteMany({
      where: { tenantId, id: { in: stale.map((entry) => entry.id) } },
    });
    await this.storage.remove(
      stale.map((entry) => entry.storagePath).filter((path): path is string => path !== null)
    );
  }
}

function toHistoryEntry(row: HistoryRow): ReportHistoryEntry {
  const user = row.generatedByUser;
  return {
    id: row.id,
    // Prisma's enum and the shared enum carry identical string values.
    type: row.type as ReportType,
    fromDate: row.fromDate.toISOString().slice(0, 10),
    toDate: row.toDate.toISOString().slice(0, 10),
    parameters: parseHistoryParameters(row.parameters),
    fileName: row.fileName,
    fileSize: row.fileSize,
    isFileAvailable: row.storagePath !== null,
    generatedByAgency: row.generatedByAgency,
    generatedBy: user
      ? { name: `${user.firstName} ${user.lastName}`.trim() || user.email, email: user.email }
      : null,
    createdAt: row.createdAt.toISOString(),
  };
}
