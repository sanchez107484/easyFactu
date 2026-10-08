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
import { InvoiceSeriesService } from '../invoice-series/invoice-series.service';
import { EmailService } from '../../common/email/email.service';
import { CreateDirectClientDto } from './dto/create-direct-client.dto';
import { InviteClientDto } from './dto/invite-client.dto';
import { ResendActivationDto } from './dto/resend-activation.dto';
import { randomBytes } from 'crypto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AgencyInvitationService {
  constructor(
    private prisma: PrismaService,
    private invoiceSeriesService: InvoiceSeriesService,
    private emailService: EmailService,
  ) {}

  // ─── Check NIF (real-time pre-validation) ──────────────────────────────

  async checkNif(
    agencyTenantId: string,
    nif: string
  ): Promise<
    | { status: 'AVAILABLE' }
    | { status: 'ALREADY_IN_PORTFOLIO'; email: string; businessName: string; nif: string; city: string | null; province: string | null }
    | { status: 'EXISTS_CAN_INVITE'; email: string; businessName: string; nif: string; city: string | null; province: string | null }
  > {
    const normalizedNif = nif.toUpperCase().trim();

    const existing = await this.prisma.tenant.findUnique({
      where: { nif: normalizedNif },
      select: { id: true, email: true, businessName: true, nif: true, city: true, province: true },
    });

    if (!existing) return { status: 'AVAILABLE' };

    const relation = await this.prisma.agencyClientRelation.findUnique({
      where: {
        agencyTenantId_clientTenantId: {
          agencyTenantId,
          clientTenantId: existing.id,
        },
      },
      select: { id: true },
    });

    if (relation) {
      return {
        status: 'ALREADY_IN_PORTFOLIO',
        email: existing.email ?? '',
        businessName: existing.businessName,
        nif: existing.nif,
        city: existing.city,
        province: existing.province,
      };
    }

    return {
      status: 'EXISTS_CAN_INVITE',
      email: existing.email ?? '',
      businessName: existing.businessName,
      nif: existing.nif,
      city: existing.city,
      province: existing.province,
    };
  }

  // ─── Public search agency by email or NIF ──────────────────────────────

  async searchAgencyPublic(
    q: string
  ): Promise<
    | { status: 'NOT_FOUND' }
    | { status: 'FOUND'; businessName: string; nif: string; email: string; city: string | null; province: string | null }
  > {
    const identifier = q.trim();
    if (!identifier) return { status: 'NOT_FOUND' };

    const isEmail = identifier.includes('@');

    if (isEmail) {
      const normalizedEmail = identifier.toLowerCase();
      const tenant = await this.prisma.tenant.findFirst({
        where: { email: normalizedEmail, accountType: 'AGENCY', isActive: true },
        select: { businessName: true, nif: true, email: true, city: true, province: true },
      });

      if (!tenant) return { status: 'NOT_FOUND' };

      return {
        status: 'FOUND',
        businessName: tenant.businessName,
        nif: tenant.nif,
        email: tenant.email ?? '',
        city: tenant.city,
        province: tenant.province,
      };
    }

    const normalizedNif = identifier.toUpperCase();
    const tenantByNif = await this.prisma.tenant.findFirst({
      where: { nif: normalizedNif, accountType: 'AGENCY', isActive: true },
      select: { businessName: true, nif: true, email: true, city: true, province: true },
    });

    if (!tenantByNif) return { status: 'NOT_FOUND' };

    return {
      status: 'FOUND',
      businessName: tenantByNif.businessName,
      nif: tenantByNif.nif,
      email: tenantByNif.email ?? '',
      city: tenantByNif.city,
      province: tenantByNif.province,
    };
  }

  // ─── Check identifier (NIF or email) ───────────────────────────────────

  async checkIdentifier(
    agencyTenantId: string,
    q: string
  ): Promise<
    | { status: 'AVAILABLE' }
    | { status: 'ALREADY_IN_PORTFOLIO'; email: string; businessName: string; nif: string; city: string | null; province: string | null }
    | { status: 'EXISTS_CAN_INVITE'; email: string; businessName: string; nif: string; city: string | null; province: string | null }
    | { status: 'EMAIL_EXISTS' }
  > {
    const identifier = q.trim();
    if (!identifier) return { status: 'AVAILABLE' };

    const isEmail = identifier.includes('@');

    if (isEmail) {
      const normalizedEmail = identifier.toLowerCase();

      const [existingTenant, existingUser] = await Promise.all([
        this.prisma.tenant.findFirst({
          where: { email: normalizedEmail },
          select: { id: true, email: true, businessName: true, nif: true, city: true, province: true },
        }),
        this.prisma.user.findUnique({
          where: { email: normalizedEmail },
          select: { id: true },
        }),
      ]);

      if (!existingTenant) {
        return existingUser ? { status: 'EMAIL_EXISTS' } : { status: 'AVAILABLE' };
      }

      const relation = await this.prisma.agencyClientRelation.findUnique({
        where: {
          agencyTenantId_clientTenantId: {
            agencyTenantId,
            clientTenantId: existingTenant.id,
          },
        },
        select: { id: true },
      });

      if (relation) {
        return {
          status: 'ALREADY_IN_PORTFOLIO',
          email: existingTenant.email ?? '',
          businessName: existingTenant.businessName,
          nif: existingTenant.nif,
          city: existingTenant.city,
          province: existingTenant.province,
        };
      }

      return {
        status: 'EXISTS_CAN_INVITE',
        email: existingTenant.email ?? '',
        businessName: existingTenant.businessName,
        nif: existingTenant.nif,
        city: existingTenant.city,
        province: existingTenant.province,
      };
    }

    return this.checkNif(agencyTenantId, identifier);
  }

  // ─── Create direct client ──────────────────────────────────────────────

  async createDirectClient(
    agencyTenantId: string,
    addedByUserId: string,
    dto: CreateDirectClientDto
  ) {
    const normalizedNif = dto.nif.toUpperCase().trim();
    const normalizedEmail = dto.email.toLowerCase().trim();

    const [agencyTenantRecord, existingByNif, existingTenantByEmail, existingUserByEmail] =
      await Promise.all([
        this.prisma.tenant.findUnique({
          where: { id: agencyTenantId },
          select: { accountType: true, businessName: true },
        }),
        this.prisma.tenant.findFirst({
          where: { nif: normalizedNif },
          select: {
            id: true,
            email: true,
            businessName: true,
            clientRelations: {
              where: { agencyTenantId },
              select: { id: true },
              take: 1,
            },
          },
        }),
        this.prisma.tenant.findFirst({
          where: { email: normalizedEmail },
          select: { id: true },
        }),
        this.prisma.user.findUnique({
          where: { email: normalizedEmail },
          select: { id: true },
        }),
      ]);

    if (!agencyTenantRecord) throw new NotFoundException('Tenant no encontrado');
    if (agencyTenantRecord.accountType !== 'AGENCY') {
      throw new ForbiddenException('Solo las asesorías pueden acceder a este recurso');
    }

    if (existingByNif) {
      if (existingByNif.clientRelations.length > 0) {
        throw new ConflictException({
          code: 'ALREADY_IN_PORTFOLIO',
          message: 'Este cliente ya está en tu cartera',
        });
      }
      throw new ConflictException({
        code: 'NIF_EXISTS',
        email: existingByNif.email,
        businessName: existingByNif.businessName,
        message: `Este NIF ya tiene una cuenta registrada. Envíale una invitación a ${existingByNif.email} para vincularle a tu asesoría.`,
      });
    }

    if (existingTenantByEmail || existingUserByEmail) {
      throw new ConflictException({
        code: 'EMAIL_EXISTS',
        message: 'Este email ya está registrado en otra cuenta. Usa un email diferente o envía una invitación.',
      });
    }

    const activationToken = randomBytes(32).toString('hex');
    const activationExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const result = await this.prisma.$transaction(async (tx) => {
      const clientTenant = await tx.tenant.create({
        data: {
          businessName: dto.businessName,
          nif: normalizedNif,
          email: normalizedEmail,
          accountType: dto.accountType ?? 'INDIVIDUAL',
          address: '',
          postalCode: '',
          city: '',
          province: '',
          phone: dto.phone ?? null,
          setupCompleted: false,
        },
      });

      const clientUser = await tx.user.create({
        data: {
          email: normalizedEmail,
          passwordHash: null,
          firstName: '',
          lastName: '',
          emailVerified: false,
          accountActivationToken: activationToken,
          accountActivationExpires: activationExpires,
          lastActiveTenantId: clientTenant.id,
        },
      });

      await tx.tenantUser.create({
        data: {
          tenantId: clientTenant.id,
          userId: clientUser.id,
          role: 'OWNER',
          isOwner: true,
        },
      });

      const relation = await tx.agencyClientRelation.create({
        data: {
          agencyTenantId,
          clientTenantId: clientTenant.id,
          addedByUserId,
          notes: dto.notes,
        },
        include: { clientTenant: true },
      });

      await tx.agencyRelationHistory.create({
        data: {
          agencyTenantId,
          clientTenantId: clientTenant.id,
          agencyBusinessName: agencyTenantRecord.businessName,
          clientBusinessName: clientTenant.businessName,
          clientNif: clientTenant.nif,
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
          tenantId: clientTenant.id,
          userId: tu.userId,
          role: 'ADMIN' as const,
          isOwner: false,
        })),
        skipDuplicates: true,
      });

      await this.invoiceSeriesService.createDefaultSeries(clientTenant.id, tx);

      return { clientTenant, relation };
    });

    await this.emailService.sendAccountActivation({
      to: normalizedEmail,
      businessName: dto.businessName,
      agencyName: agencyTenantRecord.businessName,
      activationToken,
      expiresAt: activationExpires,
    });

    return result.relation;
  }

  // ─── Resend activation email ───────────────────────────────────────────

  async resendActivation(agencyTenantId: string, clientTenantId: string, dto: ResendActivationDto) {
    const relation = await this.prisma.agencyClientRelation.findUnique({
      where: { agencyTenantId_clientTenantId: { agencyTenantId, clientTenantId } },
      include: {
        clientTenant: { select: { id: true, businessName: true, email: true } },
      },
    });

    if (!relation) throw new NotFoundException('Cliente no encontrado en tu cartera');

    const ownerTenantUser = await this.prisma.tenantUser.findFirst({
      where: { tenantId: clientTenantId, isOwner: true },
      include: {
        user: { select: { id: true, email: true, emailVerified: true } },
      },
    });

    if (!ownerTenantUser?.user) {
      throw new NotFoundException('Usuario del cliente no encontrado');
    }

    const user = ownerTenantUser.user;

    if (user.emailVerified) {
      throw new ConflictException(
        'El cliente ya ha verificado su email y activado su cuenta. No se puede reenviar el enlace.'
      );
    }

    const [agencyTenantRecord] = await Promise.all([
      this.prisma.tenant.findUnique({
        where: { id: agencyTenantId },
        select: { businessName: true },
      }),
    ]);

    let targetEmail = relation.clientTenant.email;

    if (dto.email) {
      const normalizedEmail = dto.email.toLowerCase().trim();
      if (normalizedEmail !== user.email.toLowerCase()) {
        const [existingTenant, existingUser] = await Promise.all([
          this.prisma.tenant.findFirst({
            where: { email: normalizedEmail, id: { not: clientTenantId } },
            select: { id: true },
          }),
          this.prisma.user.findFirst({
            where: { email: normalizedEmail, id: { not: user.id } },
            select: { id: true },
          }),
        ]);

        if (existingTenant || existingUser) {
          throw new ConflictException(
            'Este email ya está registrado en otra cuenta. Usa un email diferente.'
          );
        }

        await this.prisma.$transaction([
          this.prisma.tenant.update({
            where: { id: clientTenantId },
            data: { email: normalizedEmail },
          }),
          this.prisma.user.update({
            where: { id: user.id },
            data: { email: normalizedEmail },
          }),
        ]);

        targetEmail = normalizedEmail;
      }
    }

    const activationToken = randomBytes(32).toString('hex');
    const activationExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        accountActivationToken: activationToken,
        accountActivationExpires: activationExpires,
      },
    });

    await this.emailService.sendAccountActivation({
      to: targetEmail,
      businessName: relation.clientTenant.businessName,
      agencyName: agencyTenantRecord?.businessName ?? '',
      activationToken,
      expiresAt: activationExpires,
    });

    return { email: targetEmail };
  }

  // ─── Send invitation ───────────────────────────────────────────────────

  async inviteClient(agencyTenantId: string, dto: InviteClientDto) {
    const normalizedEmail = dto.inviteeEmail.toLowerCase().trim();

    const now = Date.now();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);

    const [monthlyPairCount, recentRejections, dailyAgencyCount] = await Promise.all([
      this.prisma.agencyInvitation.count({
        where: { agencyTenantId, inviteeEmail: normalizedEmail, createdAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.agencyInvitation.findMany({
        where: {
          agencyTenantId,
          inviteeEmail: normalizedEmail,
          status: 'REJECTED' as Prisma.EnumAgencyInvitationStatusFilter,
        },
        orderBy: { rejectedAt: 'desc' } as Prisma.AgencyInvitationOrderByWithRelationInput,
        select: { rejectedAt: true } as Prisma.AgencyInvitationSelect,
        take: 3,
      }),
      this.prisma.agencyInvitation.count({
        where: { agencyTenantId, createdAt: { gte: oneDayAgo } },
      }),
    ]);

    const totalRejections = recentRejections.length;
    const lastRejection = recentRejections[0] as { rejectedAt: Date | null } | undefined;

    if (totalRejections >= 3) {
      throw new ForbiddenException(
        'Este destinatario ha rechazado 3 invitaciones tuyas. No es posible enviar más invitaciones a este email.'
      );
    }

    if (totalRejections > 0 && lastRejection?.rejectedAt) {
      const cooldownHours = totalRejections === 1 ? 72 : 7 * 24;
      const cooldownMs = cooldownHours * 60 * 60 * 1000;
      const cooldownEnds = new Date(lastRejection.rejectedAt.getTime() + cooldownMs);
      if (new Date() < cooldownEnds) {
        throw new HttpException(
          `El destinatario rechazó tu última invitación. Puedes reintentar a partir del ${cooldownEnds.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}.`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    if (monthlyPairCount >= 5) {
      throw new HttpException(
        'Has alcanzado el límite de 5 invitaciones en los últimos 30 días para este destinatario.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (dailyAgencyCount >= 20) {
      throw new HttpException(
        'Has alcanzado el límite diario de invitaciones. Inténtalo mañana.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const existingInvitation = await this.prisma.agencyInvitation.findFirst({
      where: {
        agencyTenantId,
        inviteeEmail: normalizedEmail,
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvitation) {
      throw new ConflictException('Ya existe una invitación pendiente para este email');
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const [invitation, agencyTenant] = await Promise.all([
      this.prisma.agencyInvitation.create({
        data: {
          agencyTenantId,
          inviteeEmail: normalizedEmail,
          inviteeName: dto.inviteeName,
          token,
          expiresAt,
        },
      }),
      this.prisma.tenant.findUnique({
        where: { id: agencyTenantId },
        select: { businessName: true, nif: true },
      }),
    ]);

    await this.emailService.sendAgencyInvitation({
      to: dto.inviteeEmail,
      inviteeName: dto.inviteeName,
      agencyName: agencyTenant?.businessName ?? 'Tu asesoría',
      agencyNif: agencyTenant?.nif ?? '',
      invitationToken: token,
      expiresAt,
    });

    return invitation;
  }

  // ─── Get public invitation info ────────────────────────────────────────

  async findInvitationByToken(token: string) {
    const invitation = await this.prisma.agencyInvitation.findUnique({
      where: { token },
      include: {
        agencyTenant: { select: { businessName: true, nif: true, city: true } },
      },
    });

    if (!invitation) throw new NotFoundException('Invitación no encontrada');

    if (invitation.status !== 'PENDING') {
      const statusMessages: Record<string, string> = {
        ACCEPTED: 'Esta invitación ya fue aceptada',
        EXPIRED: 'Esta invitación ha expirado',
        REJECTED: 'Esta invitación fue rechazada por el destinatario',
        CANCELLED: 'Esta invitación fue cancelada por la asesoría',
      };
      throw new BadRequestException(
        statusMessages[invitation.status] ?? 'Esta invitación ya no está disponible'
      );
    }

    if (invitation.expiresAt < new Date()) {
      await this.prisma.agencyInvitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      });
      throw new BadRequestException('La invitación ha expirado');
    }

    return {
      inviteeName: invitation.inviteeName,
      agencyName: invitation.agencyTenant.businessName,
      agencyNif: invitation.agencyTenant.nif,
      agencyCity: invitation.agencyTenant.city,
      expiresAt: invitation.expiresAt,
      status: invitation.status,
    };
  }

  // ─── Accept invitation ─────────────────────────────────────────────────

  async acceptInvitation(token: string, clientTenantId: string, userId: string, userEmail: string) {
    const invitation = await this.prisma.agencyInvitation.findUnique({
      where: { token },
      include: { agencyTenant: { select: { id: true, businessName: true } } },
    });

    if (!invitation) {
      throw new NotFoundException('Invitación no encontrada');
    }

    if (invitation.inviteeEmail !== userEmail.toLowerCase().trim()) {
      throw new ForbiddenException('No tienes permiso para aceptar esta invitación');
    }

    if (invitation.status !== 'PENDING') {
      throw new BadRequestException('Esta invitación ya fue usada o cancelada');
    }

    if (invitation.expiresAt < new Date()) {
      await this.prisma.agencyInvitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      });
      throw new BadRequestException('La invitación ha expirado');
    }

    const clientTenant = await this.prisma.tenant.findUnique({
      where: { id: clientTenantId },
      select: { accountType: true, businessName: true },
    });

    if (clientTenant?.accountType === 'AGENCY') {
      throw new BadRequestException(
        'Una asesoría no puede ser cliente de otra asesoría. Usa el sistema de colaboración para vincular gestorías.'
      );
    }

    const existingRelation = await this.prisma.agencyClientRelation.findUnique({
      where: {
        agencyTenantId_clientTenantId: {
          agencyTenantId: invitation.agencyTenantId,
          clientTenantId,
        },
      },
    });

    if (existingRelation) {
      throw new ConflictException('Ya estás vinculado a esta asesoría');
    }

    const relation = await this.prisma.$transaction(async (tx) => {
      const created = await tx.agencyClientRelation.create({
        data: {
          agencyTenantId: invitation.agencyTenantId,
          clientTenantId,
          addedByUserId: userId,
        },
        include: { clientTenant: true, agencyTenant: true },
      });

      await tx.agencyInvitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED' },
      });

      await tx.agencyRelationHistory.create({
        data: {
          agencyTenantId: invitation.agencyTenantId,
          clientTenantId,
          agencyBusinessName: invitation.agencyTenant.businessName,
          clientBusinessName: created.clientTenant.businessName,
          clientNif: created.clientTenant.nif,
          startedAt: new Date(),
        },
      });

      const agencyUsers = await tx.tenantUser.findMany({
        where: {
          tenantId: invitation.agencyTenantId,
          role: { in: ['OWNER', 'ADMIN'] },
        },
        select: { userId: true },
      });

      await tx.tenantUser.createMany({
        data: agencyUsers.map((tu) => ({
          tenantId: clientTenantId,
          userId: tu.userId,
          role: 'ADMIN' as const,
          isOwner: false,
        })),
        skipDuplicates: true,
      });

      return created;
    });

    const agencyTenantDetails = await this.prisma.tenant.findUnique({
      where: { id: invitation.agencyTenantId },
      select: { email: true, businessName: true },
    });

    if (agencyTenantDetails) {
      await this.emailService.sendClientAcceptedInvitationNotification({
        to: agencyTenantDetails.email,
        agencyName: agencyTenantDetails.businessName,
        clientName: relation.clientTenant.businessName,
        clientNif: relation.clientTenant.nif,
      });
    }

    return relation;
  }

  // ─── Reject invitation ─────────────────────────────────────────────────

  async rejectInvitation(token: string, clientTenantId: string, userEmail: string) {
    const invitation = await this.prisma.agencyInvitation.findUnique({
      where: { token },
      include: {
        agencyTenant: { select: { id: true, email: true, businessName: true } },
      },
    });

    if (!invitation) throw new NotFoundException('Invitación no encontrada');

    if (invitation.inviteeEmail !== userEmail.toLowerCase().trim()) {
      throw new ForbiddenException('No tienes permiso para rechazar esta invitación');
    }

    if (invitation.status !== 'PENDING') {
      throw new BadRequestException('Esta invitación ya no está pendiente');
    }

    if (invitation.expiresAt < new Date()) {
      await this.prisma.agencyInvitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      });
      throw new BadRequestException('La invitación ha expirado');
    }

    const [clientTenant] = await Promise.all([
      this.prisma.tenant.findUnique({
        where: { id: clientTenantId },
        select: { businessName: true, email: true },
      }),
      this.prisma.agencyInvitation.update({
        where: { id: invitation.id },
        data: {
          status: 'REJECTED',
          rejectedAt: new Date(),
        } as unknown as Prisma.AgencyInvitationUncheckedUpdateInput,
      }),
    ]);

    if (clientTenant && invitation.agencyTenant.email) {
      await this.emailService.sendClientRejectedInvitationNotification({
        to: invitation.agencyTenant.email,
        agencyName: invitation.agencyTenant.businessName,
        clientName: clientTenant.businessName,
        clientEmail: clientTenant.email,
      });
    }
  }

  // ─── Pending invitations list ──────────────────────────────────────────

  async findPendingInvitations(agencyTenantId: string) {
    return this.prisma.agencyInvitation.findMany({
      where: {
        agencyTenantId,
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        inviteeEmail: true,
        inviteeName: true,
        expiresAt: true,
        createdAt: true,
        status: true,
      },
    });
  }

  // ─── All invitations ───────────────────────────────────────────────────

  async findAllInvitations(agencyTenantId: string) {
    const allInvitations = await this.prisma.agencyInvitation.findMany({
      where: { agencyTenantId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        inviteeEmail: true,
        inviteeName: true,
        status: true,
        expiresAt: true,
        rejectedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const seen = new Set<string>();
    const dedupedInvitations = allInvitations
      .filter((inv) => {
        if (seen.has(inv.inviteeEmail)) return false;
        seen.add(inv.inviteeEmail);
        return true;
      })
      .map((inv) => ({
        ...inv,
        entryType: 'INVITATION' as const,
        clientTenantId: undefined as string | undefined,
      }));

    const pendingActivations = await this.prisma.agencyClientRelation.findMany({
      where: {
        agencyTenantId,
        clientTenant: {
          tenantUsers: {
            some: {
              isOwner: true,
              user: { emailVerified: false, accountActivationExpires: { not: null } },
            },
          },
        },
      },
      select: {
        id: true,
        clientTenantId: true,
        createdAt: true,
        updatedAt: true,
        clientTenant: {
          select: {
            businessName: true,
            email: true,
            tenantUsers: {
              where: { isOwner: true },
              select: { user: { select: { accountActivationExpires: true } } },
              take: 1,
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const activationEntries = pendingActivations
      .filter((rel) => !!rel.clientTenant.email && !seen.has(rel.clientTenant.email))
      .map((rel) => {
        const expires = rel.clientTenant.tenantUsers?.[0]?.user?.accountActivationExpires;
        const isExpired = !!expires && expires < new Date();
        return {
          id: rel.id,
          inviteeEmail: rel.clientTenant.email!,
          inviteeName: rel.clientTenant.businessName,
          status: (isExpired ? 'EXPIRED' : 'PENDING') as 'EXPIRED' | 'PENDING',
          expiresAt: expires ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          rejectedAt: null as null,
          createdAt: rel.createdAt,
          updatedAt: rel.updatedAt,
          entryType: 'ACTIVATION' as const,
          clientTenantId: rel.clientTenantId,
        };
      });

    return [...dedupedInvitations, ...activationEntries].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  // ─── Cancel invitation ─────────────────────────────────────────────────

  async cancelInvitation(agencyTenantId: string, invitationId: string) {
    const invitation = await this.prisma.agencyInvitation.findFirst({
      where: { id: invitationId, agencyTenantId },
    });

    if (!invitation) throw new NotFoundException('Invitación no encontrada');
    if (invitation.status !== 'PENDING') {
      throw new BadRequestException('Esta invitación ya no está pendiente');
    }

    return this.prisma.agencyInvitation.update({
      where: { id: invitationId },
      data: { status: 'CANCELLED' },
    });
  }

  // ─── Get received invitations (client side) ────────────────────────────

  async getReceivedInvitations(userEmail: string) {
    const invitations = await this.prisma.agencyInvitation.findMany({
      where: {
        inviteeEmail: userEmail.toLowerCase().trim(),
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
      include: {
        agencyTenant: {
          select: { businessName: true, nif: true, city: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return invitations.map((inv) => ({
      id: inv.id,
      token: inv.token,
      inviteeName: inv.inviteeName,
      agencyName: inv.agencyTenant.businessName,
      agencyNif: inv.agencyTenant.nif,
      agencyCity: inv.agencyTenant.city,
      status: inv.status,
      expiresAt: inv.expiresAt.toISOString(),
      createdAt: inv.createdAt.toISOString(),
    }));
  }
}
