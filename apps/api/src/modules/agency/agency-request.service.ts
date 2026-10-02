import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../../common/email/email.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AgencyRequestService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  // ─── Send agency request (client-initiated) ─────────────────────────────────

  async sendAgencyRequest(clientTenantId: string, dto: { agencyNif: string; message?: string }) {
    const normalizedNif = dto.agencyNif.replace(/\s/g, '').toUpperCase();

    const clientTenant = await this.prisma.tenant.findUnique({
      where: { id: clientTenantId },
      select: { accountType: true, businessName: true, nif: true, email: true },
    });

    if (!clientTenant) throw new NotFoundException('Tu cuenta no fue encontrada');
    if (clientTenant.accountType === 'AGENCY') {
      throw new BadRequestException('Una asesoría no puede solicitar ser cliente de otra asesoría');
    }

    const agencyTenant = await this.prisma.tenant.findFirst({
      where: { nif: normalizedNif, accountType: 'AGENCY', isActive: true },
      select: { id: true, businessName: true, email: true },
    });

    if (!agencyTenant) {
      throw new NotFoundException('No se encontró ninguna asesoría registrada con ese NIF');
    }

    if (agencyTenant.id === clientTenantId) {
      throw new BadRequestException('No puedes solicitar vincularte contigo mismo');
    }

    const existingRelation = await this.prisma.agencyClientRelation.findUnique({
      where: {
        agencyTenantId_clientTenantId: {
          agencyTenantId: agencyTenant.id,
          clientTenantId,
        },
      },
    });

    if (existingRelation) {
      throw new ConflictException('Ya estás vinculado a esta asesoría');
    }

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const dailyCount = await this.prisma.agencyClientRequest.count({
      where: { clientTenantId, createdAt: { gte: oneDayAgo } },
    });

    if (dailyCount >= 5) {
      throw new HttpException(
        'Has alcanzado el límite de 5 solicitudes por día. Inténtalo mañana.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const existingRequest = await this.prisma.agencyClientRequest.findFirst({
      where: {
        clientTenantId,
        agencyTenantId: agencyTenant.id,
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
    });

    if (existingRequest) {
      throw new ConflictException('Ya tienes una solicitud pendiente para esta asesoría');
    }

    const recentRejection = await this.prisma.agencyClientRequest.findFirst({
      where: {
        clientTenantId,
        agencyTenantId: agencyTenant.id,
        status: 'REJECTED',
      },
      orderBy: { rejectedAt: 'desc' },
    });

    if (recentRejection?.rejectedAt) {
      const cooldownEnds = new Date(recentRejection.rejectedAt.getTime() + 72 * 60 * 60 * 1000);
      if (new Date() < cooldownEnds) {
        throw new HttpException(
          `Puedes reenviar la solicitud a partir del ${cooldownEnds.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}.`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const request = await this.prisma.agencyClientRequest.create({
      data: {
        clientTenantId,
        agencyTenantId: agencyTenant.id,
        clientEmail: clientTenant.email,
        clientBusinessName: clientTenant.businessName,
        clientNif: clientTenant.nif,
        message: dto.message,
        expiresAt,
      },
    });

    this.emailService.sendAgencyClientRequestNotification({
      to: agencyTenant.email,
      agencyName: agencyTenant.businessName,
      clientBusinessName: clientTenant.businessName,
      clientNif: clientTenant.nif,
      clientEmail: clientTenant.email,
      message: dto.message,
    });

    return { id: request.id, status: request.status };
  }

  // ─── Get requests received by agency ───────────────────────────────────────

  async findReceivedRequests(agencyTenantId: string, query: { page?: number; limit?: number; search?: string; status?: string }) {
    const { page = 1, limit = 20, search, status } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.AgencyClientRequestWhereInput = {
      agencyTenantId,
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { clientBusinessName: { contains: search, mode: 'insensitive' } },
              { clientNif: { contains: search, mode: 'insensitive' } },
              { clientEmail: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [requests, total] = await Promise.all([
      this.prisma.agencyClientRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.agencyClientRequest.count({ where }),
    ]);

    return {
      data: requests.map((r) => ({
        id: r.id,
        clientBusinessName: r.clientBusinessName,
        clientNif: r.clientNif,
        clientEmail: r.clientEmail,
        message: r.message,
        status: r.status,
        expiresAt: r.expiresAt.toISOString(),
        createdAt: r.createdAt.toISOString(),
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ─── Get my sent requests (client side) ───────────────────────────────────

  async findMyRequests(clientTenantId: string, query: { page?: number; limit?: number; status?: string }) {
    const { page = 1, limit = 20, status } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.AgencyClientRequestWhereInput = {
      clientTenantId,
      ...(status ? { status } : {}),
    };

    const [requests, total] = await Promise.all([
      this.prisma.agencyClientRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          agencyTenant: {
            select: { businessName: true, nif: true, email: true },
          },
        },
      }),
      this.prisma.agencyClientRequest.count({ where }),
    ]);

    return {
      data: requests.map((r) => ({
        id: r.id,
        agencyName: r.agencyTenant.businessName,
        agencyNif: r.agencyTenant.nif,
        agencyEmail: r.agencyTenant.email,
        message: r.message,
        status: r.status,
        expiresAt: r.expiresAt.toISOString(),
        createdAt: r.createdAt.toISOString(),
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ─── Accept agency request (agency side) ──────────────────────────────────

  async acceptAgencyRequest(agencyTenantId: string, requestId: string, userId: string) {
    const request = await this.prisma.agencyClientRequest.findUnique({
      where: { id: requestId },
      include: {
        agencyTenant: { select: { id: true, businessName: true } },
        clientTenant: { select: { id: true, businessName: true, nif: true } },
      },
    });

    if (!request) throw new NotFoundException('Solicitud no encontrada');

    if (request.agencyTenantId !== agencyTenantId) {
      throw new ForbiddenException('No tienes permiso para aceptar esta solicitud');
    }

    if (request.status !== 'PENDING') {
      throw new BadRequestException('Esta solicitud ya no está pendiente');
    }

    if (request.expiresAt < new Date()) {
      await this.prisma.agencyClientRequest.update({
        where: { id: requestId },
        data: { status: 'EXPIRED' },
      });
      throw new BadRequestException('Esta solicitud ha expirado');
    }

    const existingRelation = await this.prisma.agencyClientRelation.findUnique({
      where: {
        agencyTenantId_clientTenantId: {
          agencyTenantId,
          clientTenantId: request.clientTenantId,
        },
      },
    });

    if (existingRelation) {
      throw new ConflictException('Ya existe una relación con este cliente');
    }

    const relation = await this.prisma.$transaction(async (tx) => {
      const created = await tx.agencyClientRelation.create({
        data: {
          agencyTenantId,
          clientTenantId: request.clientTenantId,
          addedByUserId: userId,
        },
        include: { clientTenant: true, agencyTenant: true },
      });

      await tx.agencyClientRequest.update({
        where: { id: requestId },
        data: { status: 'ACCEPTED', acceptedAt: new Date() },
      });

      await tx.agencyRelationHistory.create({
        data: {
          agencyTenantId,
          clientTenantId: request.clientTenantId,
          agencyBusinessName: request.agencyTenant.businessName,
          clientBusinessName: request.clientTenant.businessName,
          clientNif: request.clientTenant.nif,
          startedAt: new Date(),
        },
      });

      const agencyUsers = await tx.tenantUser.findMany({
        where: {
          tenantId: agencyTenantId,
          role: { in: ['OWNER', 'ADMIN'] },
        },
        select: { userId: true },
      });

      await tx.tenantUser.createMany({
        data: agencyUsers.map((tu) => ({
          tenantId: request.clientTenantId,
          userId: tu.userId,
          role: 'ADMIN' as const,
          isOwner: false,
        })),
        skipDuplicates: true,
      });

      return created;
    });

    this.emailService.sendAgencyRequestAcceptedNotification({
      to: request.clientEmail,
      agencyName: request.agencyTenant.businessName,
      clientBusinessName: request.clientTenant.businessName,
    });

    return relation;
  }

  // ─── Reject agency request (agency side) ─────────────────────────────────

  async rejectAgencyRequest(agencyTenantId: string, requestId: string) {
    const request = await this.prisma.agencyClientRequest.findUnique({
      where: { id: requestId },
      include: {
        agencyTenant: { select: { id: true, businessName: true } },
      },
    });

    if (!request) throw new NotFoundException('Solicitud no encontrada');

    if (request.agencyTenantId !== agencyTenantId) {
      throw new ForbiddenException('No tienes permiso para rechazar esta solicitud');
    }

    if (request.status !== 'PENDING') {
      throw new BadRequestException('Esta solicitud ya no está pendiente');
    }

    await this.prisma.agencyClientRequest.update({
      where: { id: requestId },
      data: { status: 'REJECTED', rejectedAt: new Date() },
    });

    this.emailService.sendAgencyRequestRejectedNotification({
      to: request.clientEmail,
      agencyName: request.agencyTenant.businessName,
      clientBusinessName: request.clientBusinessName,
    });

    return { success: true };
  }

  // ─── Cancel agency request (client side) ─────────────────────────────────

  async cancelAgencyRequest(clientTenantId: string, requestId: string) {
    const request = await this.prisma.agencyClientRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) throw new NotFoundException('Solicitud no encontrada');

    if (request.clientTenantId !== clientTenantId) {
      throw new ForbiddenException('No tienes permiso para cancelar esta solicitud');
    }

    if (request.status !== 'PENDING') {
      throw new BadRequestException('Esta solicitud ya no está pendiente');
    }

    await this.prisma.agencyClientRequest.update({
      where: { id: requestId },
      data: { status: 'CANCELLED' },
    });

    return { success: true };
  }

  // ─── Get pending requests count (for agency sidebar badge) ─────────────────

  async getReceivedRequestsCount(agencyTenantId: string): Promise<number> {
    return this.prisma.agencyClientRequest.count({
      where: {
        agencyTenantId,
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
    });
  }
}
