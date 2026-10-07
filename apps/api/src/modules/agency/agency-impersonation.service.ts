import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AgencyImpersonationService {
  constructor(private prisma: PrismaService) {}

  // ─── Impersonation audit log ─────────────────────────────────────────────

  async findImpersonationLogs(agencyTenantId: string, query: {
    clientTenantId?: string;
    actorUserId?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }) {
    const { clientTenantId, actorUserId, dateFrom, dateTo, page = 1, limit = 50 } = query;

    const where: Prisma.AgencyImpersonationLogWhereInput = {
      agencyTenantId,
      ...(clientTenantId ? { clientTenantId } : {}),
      ...(actorUserId ? { actorUserId } : {}),
    };

    if (dateFrom || dateTo) {
      where.startedAt = {};
      if (dateFrom) (where.startedAt as Prisma.DateTimeFilter).gte = new Date(dateFrom);
      if (dateTo) (where.startedAt as Prisma.DateTimeFilter).lte = new Date(dateTo);
    }

    const [total, rows] = await Promise.all([
      this.prisma.agencyImpersonationLog.count({ where }),
      this.prisma.agencyImpersonationLog.findMany({
        where,
        orderBy: { startedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          clientTenantId: true,
          clientBusinessName: true,
          actorUserId: true,
          actorEmail: true,
          ipAddress: true,
          userAgent: true,
          startedAt: true,
          endedAt: true,
        },
      }),
    ]);

    return {
      data: rows.map((r) => ({
        id: r.id,
        clientTenantId: r.clientTenantId,
        clientBusinessName: r.clientBusinessName,
        actorUserId: r.actorUserId,
        actorEmail: r.actorEmail,
        ipAddress: r.ipAddress,
        userAgent: r.userAgent,
        startedAt: r.startedAt.toISOString(),
        endedAt: r.endedAt?.toISOString() ?? null,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }
}
