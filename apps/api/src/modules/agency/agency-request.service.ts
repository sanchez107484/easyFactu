import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../../common/email/email.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AgencyRequestService {
  private readonly apiUrl: string;
  private readonly frontendUrl: string;

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private configService: ConfigService,
  ) {
    this.apiUrl = this.configService.get<string>('APP_URL') ?? 'http://localhost:3001';
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
  }

  private generateEmailAcceptToken(requestId: string, agencyTenantId: string): string {
    const secret = this.configService.get<string>('SCHEDULER_SECRET') ?? 'fallback-secret';
    return createHmac('sha256', secret).update(`${requestId}:${agencyTenantId}`).digest('hex');
  }

  verifyEmailAcceptToken(requestId: string, agencyTenantId: string, token: string): boolean {
    try {
      const expected = this.generateEmailAcceptToken(requestId, agencyTenantId);
      return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(token, 'hex'));
    } catch {
      return false;
    }
  }

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
        HttpStatus.TOO_MANY_REQUESTS
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
          HttpStatus.TOO_MANY_REQUESTS
        );
      }
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Upsert: if a previous CANCELLED/EXPIRED/REJECTED (post-cooldown) record exists,
    // reset it to PENDING instead of creating a duplicate (unique constraint on clientTenantId+agencyTenantId).
    const request = await this.prisma.agencyClientRequest.upsert({
      where: {
        clientTenantId_agencyTenantId: { clientTenantId, agencyTenantId: agencyTenant.id },
      },
      update: {
        status: 'PENDING',
        message: dto.message ?? null,
        expiresAt,
        rejectedAt: null,
        ...({ rejectionReason: null } as object),
      },
      create: {
        clientTenantId,
        agencyTenantId: agencyTenant.id,
        clientEmail: clientTenant.email,
        clientBusinessName: clientTenant.businessName,
        clientNif: clientTenant.nif,
        message: dto.message,
        expiresAt,
      },
    });

    const emailToken = this.generateEmailAcceptToken(request.id, agencyTenant.id);
    const emailAcceptUrl = `${this.apiUrl}/api/v1/agency/requests/${request.id}/email-accept?token=${emailToken}`;
    const requestsUrl = `${this.frontendUrl}/dashboard/asesoria/solicitudes`;

    await this.emailService.sendAgencyClientRequestNotification({
      to: agencyTenant.email,
      agencyName: agencyTenant.businessName,
      clientBusinessName: clientTenant.businessName,
      clientNif: clientTenant.nif,
      clientEmail: clientTenant.email,
      message: dto.message,
      emailAcceptUrl,
      requestsUrl,
    });

    return { id: request.id, status: request.status };
  }

  // ─── Get requests received by agency ───────────────────────────────────────

  async findReceivedRequests(
    agencyTenantId: string,
    query: { page?: number; limit?: number; search?: string; status?: string }
  ) {
    const { page = 1, limit = 20, search, status } = query;
    const skip = (page - 1) * limit;

    await this.prisma.agencyClientRequest.updateMany({
      where: { agencyTenantId, status: 'PENDING', expiresAt: { lt: new Date() } },
      data: { status: 'EXPIRED' },
    });

    const where: Prisma.AgencyClientRequestWhereInput = {
      agencyTenantId,
      ...(status ? { status: status as Prisma.AgencyClientRequestWhereInput['status'] } : {}),
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
      data: requests.map((r) => {
        const row = r as typeof r & { rejectionReason?: string | null };
        return {
          id: row.id,
          clientBusinessName: row.clientBusinessName,
          clientNif: row.clientNif,
          clientEmail: row.clientEmail,
          message: row.message,
          status: row.status,
          rejectionReason: row.rejectionReason ?? null,
          expiresAt: row.expiresAt.toISOString(),
          createdAt: row.createdAt.toISOString(),
        };
      }),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ─── Get my sent requests (client side) ───────────────────────────────────

  async findMyRequests(
    clientTenantId: string,
    query: { page?: number; limit?: number; status?: string }
  ) {
    const { page = 1, limit = 20, status } = query;
    const skip = (page - 1) * limit;

    await this.prisma.agencyClientRequest.updateMany({
      where: { clientTenantId, status: 'PENDING', expiresAt: { lt: new Date() } },
      data: { status: 'EXPIRED' },
    });

    const where: Prisma.AgencyClientRequestWhereInput = {
      clientTenantId,
      ...(status ? { status: status as Prisma.AgencyClientRequestWhereInput['status'] } : {}),
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
      data: requests.map((r) => {
        const row = r as typeof r & { rejectionReason?: string | null };
        return {
          id: row.id,
          agencyName: row.agencyTenant.businessName,
          agencyNif: row.agencyTenant.nif,
          agencyEmail: row.agencyTenant.email,
          message: row.message,
          status: row.status,
          rejectionReason: row.rejectionReason ?? null,
          expiresAt: row.expiresAt.toISOString(),
          createdAt: row.createdAt.toISOString(),
        };
      }),
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

    await this.emailService.sendAgencyRequestAcceptedNotification({
      to: request.clientEmail,
      agencyName: request.agencyTenant.businessName,
      clientBusinessName: request.clientTenant.businessName,
    });

    return relation;
  }

  // ─── Reject agency request (agency side) ─────────────────────────────────

  async rejectAgencyRequest(agencyTenantId: string, requestId: string, reason?: string) {
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
      // rejectionReason added in migration 20261006_add_rejection_reason — cast until Prisma client regenerates
      data: { status: 'REJECTED', rejectedAt: new Date(), ...({ rejectionReason: reason ?? null } as object) },
    });

    await this.emailService.sendAgencyRequestRejectedNotification({
      to: request.clientEmail,
      agencyName: request.agencyTenant.businessName,
      clientBusinessName: request.clientBusinessName,
      reason,
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

  // ─── Accept via email token (one-click accept from email) ────────────────

  async acceptViaEmailToken(requestId: string, token: string): Promise<string> {
    const request = await this.prisma.agencyClientRequest.findUnique({
      where: { id: requestId },
      include: {
        agencyTenant: { select: { id: true, businessName: true } },
        clientTenant: { select: { id: true, businessName: true, nif: true } },
      },
    });

    if (!request) throw new NotFoundException('Solicitud no encontrada');

    if (!this.verifyEmailAcceptToken(requestId, request.agencyTenantId, token)) {
      throw new ForbiddenException('Token de aceptación inválido');
    }

    if (request.status !== 'PENDING') {
      return `${this.frontendUrl}/dashboard/asesoria/solicitudes`;
    }

    if (request.expiresAt < new Date()) {
      await this.prisma.agencyClientRequest.update({
        where: { id: requestId },
        data: { status: 'EXPIRED' },
      });
      return `${this.frontendUrl}/dashboard/asesoria/solicitudes?emailAccept=expired`;
    }

    const existingRelation = await this.prisma.agencyClientRelation.findUnique({
      where: {
        agencyTenantId_clientTenantId: {
          agencyTenantId: request.agencyTenantId,
          clientTenantId: request.clientTenantId,
        },
      },
    });

    if (existingRelation) {
      return `${this.frontendUrl}/dashboard/asesoria/solicitudes`;
    }

    const agencyOwner = await this.prisma.tenantUser.findFirst({
      where: { tenantId: request.agencyTenantId, role: { in: ['OWNER', 'ADMIN'] } },
      orderBy: { createdAt: 'asc' },
    });

    const addedByUserId = agencyOwner?.userId ?? 'system';

    await this.prisma.$transaction(async (tx) => {
      await tx.agencyClientRelation.create({
        data: {
          agencyTenantId: request.agencyTenantId,
          clientTenantId: request.clientTenantId,
          addedByUserId,
        },
      });

      await tx.agencyClientRequest.update({
        where: { id: requestId },
        data: { status: 'ACCEPTED', acceptedAt: new Date() },
      });

      await tx.agencyRelationHistory.create({
        data: {
          agencyTenantId: request.agencyTenantId,
          clientTenantId: request.clientTenantId,
          agencyBusinessName: request.agencyTenant.businessName,
          clientBusinessName: request.clientTenant.businessName,
          clientNif: request.clientTenant.nif,
          startedAt: new Date(),
        },
      });

      const agencyUsers = await tx.tenantUser.findMany({
        where: { tenantId: request.agencyTenantId, role: { in: ['OWNER', 'ADMIN'] } },
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
    });

    await this.emailService.sendAgencyRequestAcceptedNotification({
      to: request.clientEmail,
      agencyName: request.agencyTenant.businessName,
      clientBusinessName: request.clientTenant.businessName,
    });

    return `${this.frontendUrl}/dashboard/asesoria/solicitudes?emailAccept=success`;
  }

  // ─── Send referral email to unregistered agency ──────────────────────────

  async sendAgencyReferral(
    clientTenantId: string,
    dto: { agencyEmail: string; message?: string },
  ) {
    const clientTenant = await this.prisma.tenant.findUnique({
      where: { id: clientTenantId },
      select: { businessName: true, nif: true, accountType: true },
    });

    if (!clientTenant) throw new NotFoundException('Tu cuenta no fue encontrada');
    if (clientTenant.accountType === 'AGENCY') {
      throw new BadRequestException('Una asesoría no puede enviar esta invitación');
    }

    const existingAgency = await this.prisma.tenant.findFirst({
      where: { email: dto.agencyEmail, accountType: 'AGENCY', isActive: true },
    });

    if (existingAgency) {
      throw new BadRequestException(
        'Esta asesoría ya está registrada. Usa su NIF para enviarle una solicitud de vinculación.',
      );
    }

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const dailyCount = await this.prisma.agencyReferral.count({
      where: { clientTenantId, createdAt: { gte: oneDayAgo } },
    });

    if (dailyCount >= 3) {
      throw new HttpException(
        'Has alcanzado el límite de 3 invitaciones por día. Inténtalo mañana.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const existingReferral = await this.prisma.agencyReferral.findFirst({
      where: { clientTenantId, agencyEmail: dto.agencyEmail.toLowerCase() },
    });

    if (existingReferral) {
      throw new ConflictException('Ya enviaste una invitación a este email.');
    }

    const referral = await this.prisma.agencyReferral.create({
      data: {
        clientTenantId,
        agencyEmail: dto.agencyEmail.toLowerCase(),
        clientBusinessName: clientTenant.businessName,
        clientNif: clientTenant.nif,
        message: dto.message,
      },
    });

    await this.emailService.sendAgencyReferralInvitation({
      to: dto.agencyEmail,
      clientBusinessName: clientTenant.businessName,
      clientNif: clientTenant.nif,
      message: dto.message,
      referralId: referral.id,
    });

    return { id: referral.id, success: true };
  }

  // ─── Resend referral email to unregistered agency ───────────────────────────

  private static readonly MAX_REFERRAL_RESENDS = 3;
  private static readonly REFERRAL_RESEND_COOLDOWN_MS = 2 * 60 * 1000;

  async resendAgencyReferral(clientTenantId: string, referralId: string) {
    const referral = await this.prisma.agencyReferral.findUnique({
      where: { id: referralId },
      include: { clientTenant: { select: { businessName: true, nif: true, accountType: true } } },
    });

    if (!referral) throw new NotFoundException('Invitación no encontrada');

    if (referral.clientTenantId !== clientTenantId) {
      throw new ForbiddenException('No tienes permiso para reenviar esta invitación');
    }

    const existingAgency = await this.prisma.tenant.findFirst({
      where: { email: referral.agencyEmail, accountType: 'AGENCY', isActive: true },
    });

    if (existingAgency) {
      throw new BadRequestException(
        'Esta asesoría ya se ha registrado. Usa su NIF para enviarle una solicitud de vinculación.',
      );
    }

    if (referral.resendCount >= AgencyRequestService.MAX_REFERRAL_RESENDS) {
      throw new HttpException(
        `Has alcanzado el límite de ${AgencyRequestService.MAX_REFERRAL_RESENDS} reenvíos para esta invitación.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (referral.lastResentAt) {
      const cooldownEnds = new Date(referral.lastResentAt.getTime() + AgencyRequestService.REFERRAL_RESEND_COOLDOWN_MS);
      if (new Date() < cooldownEnds) {
        const secondsLeft = Math.ceil((cooldownEnds.getTime() - Date.now()) / 1000);
        throw new HttpException(
          `Espera ${secondsLeft} segundos antes de volver a enviar el correo.`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    await this.prisma.agencyReferral.update({
      where: { id: referralId },
      data: { resendCount: referral.resendCount + 1, lastResentAt: new Date() },
    });

    await this.emailService.sendAgencyReferralInvitation({
      to: referral.agencyEmail,
      clientBusinessName: referral.clientTenant.businessName,
      clientNif: referral.clientTenant.nif,
      message: referral.message ?? undefined,
      referralId: referral.id,
    });

    return {
      success: true,
      resendCount: referral.resendCount + 1,
      maxResends: AgencyRequestService.MAX_REFERRAL_RESENDS,
    };
  }

  // ─── List referrals sent by client ─────────────────────────────────────────

  async findMyReferrals(clientTenantId: string) {
    const referrals = await this.prisma.agencyReferral.findMany({
      where: { clientTenantId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return referrals.map((r) => ({
      id: r.id,
      agencyEmail: r.agencyEmail,
      resendCount: r.resendCount,
      lastResentAt: r.lastResentAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
    }));
  }
}
