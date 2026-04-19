import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { InvoiceSeriesService } from '../invoice-series/invoice-series.service';
import { EmailService } from '../../common/email/email.service';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { SwitchTenantDto } from './dto/switch-tenant.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private invoiceSeriesService: InvoiceSeriesService,
    private emailService: EmailService
  ) {}

  async register(dto: RegisterDto) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    // Check if tenant with NIF already exists
    const existingTenant = await this.prisma.tenant.findFirst({
      where: { nif: dto.nif },
    });

    if (existingTenant) {
      throw new ConflictException('Ya existe una empresa con este NIF');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 12);

    // Generate email verification token
    const emailVerifyToken = randomBytes(32).toString('hex');

    // Create tenant, user, and tenantUser relationship in transaction
    const result = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Create tenant
      const tenant = await tx.tenant.create({
        data: {
          businessName: dto.businessName,
          nif: dto.nif,
          address: '',
          postalCode: '',
          city: '',
          province: '',
          email: dto.email,
          setupCompleted: false,
          accountType: dto.accountType,
        },
      });

      // Create user (no tenantId, no role)
      const user = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          emailVerifyToken,
          lastActiveTenantId: tenant.id,
        },
      });

      // Create TenantUser relationship (user is OWNER)
      const tenantUser = await tx.tenantUser.create({
        data: {
          tenantId: tenant.id,
          userId: user.id,
          role: 'OWNER',
          isOwner: true,
        },
        include: {
          tenant: true,
        },
      });

      return { user, tenant, tenantUser };
    });

    // Create default invoice series (F and R) outside transaction
    await this.invoiceSeriesService.createDefaultSeries(result.tenant.id);

    // Send verification email (fire-and-forget)
    this.emailService.sendEmailVerification({
      to: result.user.email,
      firstName: result.user.firstName,
      verifyToken: emailVerifyToken,
    });

    // Generate tokens
    const tokens = await this.generateTokens(result.user.id, result.user.email, result.tenant.id);

    // Save refresh token
    await this.prisma.user.update({
      where: { id: result.user.id },
      data: { refreshToken: tokens.refreshToken },
    });

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        emailVerified: result.user.emailVerified,
        lastActiveTenantId: result.user.lastActiveTenantId,
      },
      tenants: [
        {
          tenant: {
            id: result.tenant.id,
            businessName: result.tenant.businessName,
            nif: result.tenant.nif,
            setupCompleted: result.tenant.setupCompleted,
            accountType: result.tenant.accountType,
          },
          role: result.tenantUser.role,
          isOwner: result.tenantUser.isOwner,
        },
      ],
      currentTenant: {
        id: result.tenant.id,
        businessName: result.tenant.businessName,
        nif: result.tenant.nif,
        setupCompleted: result.tenant.setupCompleted,
        accountType: result.tenant.accountType,
      },
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: {
        tenantUsers: {
          include: {
            tenant: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Email o contraseña incorrectos');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Usuario desactivado');
    }

    if (user.tenantUsers.length === 0) {
      throw new UnauthorizedException('No tienes acceso a ninguna empresa');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email o contraseña incorrectos');
    }

    // Determine which tenant to activate
    let activeTenantId: string;

    if (dto.tenantId) {
      // User specified a tenant
      const hasTenant = user.tenantUsers.some(
        (tu: { tenantId: string }) => tu.tenantId === dto.tenantId
      );
      if (!hasTenant) {
        throw new UnauthorizedException('No tienes acceso a esta empresa');
      }
      activeTenantId = dto.tenantId;
    } else if (user.lastActiveTenantId) {
      // Use last active tenant
      const hasLastActive = user.tenantUsers.some(
        (tu: { tenantId: string }) => tu.tenantId === user.lastActiveTenantId
      );
      const firstTenant = user.tenantUsers[0];
      if (!firstTenant) {
        throw new UnauthorizedException('No tienes acceso a ninguna empresa');
      }
      activeTenantId = hasLastActive ? user.lastActiveTenantId : firstTenant.tenantId;
    } else {
      // Use first tenant
      const firstTenant = user.tenantUsers[0];
      if (!firstTenant) {
        throw new UnauthorizedException('No tienes acceso a ninguna empresa');
      }
      activeTenantId = firstTenant.tenantId;
    }

    const activeTenantUser = user.tenantUsers.find(
      (tu: { tenantId: string }) => tu.tenantId === activeTenantId
    );
    if (!activeTenantUser) {
      throw new UnauthorizedException('No se encontró la empresa seleccionada');
    }

    if (!activeTenantUser.tenant.isActive) {
      throw new UnauthorizedException('Empresa desactivada');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, activeTenantId);

    // Save refresh token, update last login and last active tenant
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken: tokens.refreshToken,
        lastLoginAt: new Date(),
        lastActiveTenantId: activeTenantId,
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        emailVerified: user.emailVerified,
        lastActiveTenantId: activeTenantId,
      },
      tenants: user.tenantUsers.map((tu: any) => ({
        tenant: {
          id: tu.tenant.id,
          businessName: tu.tenant.businessName,
          nif: tu.tenant.nif,
          setupCompleted: tu.tenant.setupCompleted,
          plan: tu.tenant.plan,
          accountType: tu.tenant.accountType,
        },
        role: tu.role,
        isOwner: tu.isOwner,
      })),
      currentTenant: {
        id: activeTenantUser.tenant.id,
        businessName: activeTenantUser.tenant.businessName,
        nif: activeTenantUser.tenant.nif,
        setupCompleted: activeTenantUser.tenant.setupCompleted,
        plan: activeTenantUser.tenant.plan,
        accountType: activeTenantUser.tenant.accountType,
      },
      ...tokens,
    };
  }

  async switchTenant(userId: string, dto: SwitchTenantDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        tenantUsers: {
          where: { tenantId: dto.tenantId },
          include: {
            tenant: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Primary path: user has a direct TenantUser record for the target tenant
    if (user.tenantUsers.length > 0) {
      const tenantUser = user.tenantUsers[0]!;

      if (!tenantUser.tenant.isActive) {
        throw new UnauthorizedException('Empresa desactivada');
      }

      const tokens = await this.generateTokens(user.id, user.email, dto.tenantId);

      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastActiveTenantId: dto.tenantId, refreshToken: tokens.refreshToken },
      });

      return {
        currentTenant: {
          id: tenantUser.tenant.id,
          businessName: tenantUser.tenant.businessName,
          nif: tenantUser.tenant.nif,
          setupCompleted: tenantUser.tenant.setupCompleted,
          plan: tenantUser.tenant.plan,
          accountType: tenantUser.tenant.accountType,
        },
        ...tokens,
      };
    }

    // Secondary path: agency user acting as a managed client
    // The user belongs to an agency tenant that has an active AgencyClientRelation
    // with the target tenant, but has no direct TenantUser record there.
    const agencyRelation = await this.prisma.agencyClientRelation.findFirst({
      where: {
        clientTenantId: dto.tenantId,
        agencyTenant: {
          isActive: true,
          tenantUsers: { some: { userId } },
        },
      },
      include: { clientTenant: true },
    });

    if (!agencyRelation) {
      throw new UnauthorizedException('No tienes acceso a esta empresa');
    }

    if (!agencyRelation.clientTenant.isActive) {
      throw new UnauthorizedException('Empresa desactivada');
    }

    const tokens = await this.generateTokens(user.id, user.email, dto.tenantId);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastActiveTenantId: dto.tenantId, refreshToken: tokens.refreshToken },
    });

    return {
      currentTenant: {
        id: agencyRelation.clientTenant.id,
        businessName: agencyRelation.clientTenant.businessName,
        nif: agencyRelation.clientTenant.nif,
        setupCompleted: agencyRelation.clientTenant.setupCompleted,
        plan: agencyRelation.clientTenant.plan,
        accountType: agencyRelation.clientTenant.accountType,
      },
      ...tokens,
    };
  }

  async refreshTokens(userId: string, tenantId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        isActive: true,
        tenantUsers: {
          where: { tenantId },
          select: { tenantId: true },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Token inválido');
    }

    if (user.tenantUsers.length === 0) {
      throw new UnauthorizedException('No tienes acceso a esta empresa');
    }

    const tokens = await this.generateTokens(user.id, user.email, tenantId);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refreshToken },
    });

    return tokens;
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    return { message: 'Sesión cerrada correctamente' };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists
      return { message: 'Si el email existe, recibirás un enlace de recuperación' };
    }

    const resetToken = randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetExpires,
      },
    });

    // Send reset email (fire-and-forget)
    this.emailService.sendPasswordReset({
      to: user.email,
      firstName: user.firstName,
      resetToken,
    });

    return { message: 'Si el email existe, recibirás un enlace de recuperación' };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Token inválido o expirado');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        refreshToken: null, // Invalidate all sessions
      },
    });

    return { message: 'Contraseña actualizada correctamente' };
  }

  async verifyEmail(token: string) {
    const user = await this.prisma.user.findFirst({
      where: { emailVerifyToken: token },
    });

    if (!user) {
      throw new NotFoundException('Token de verificación inválido');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifyToken: null,
      },
    });

    return { message: 'Email verificado correctamente' };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        emailVerified: true,
        isActive: true,
        lastLoginAt: true,
        lastActiveTenantId: true,
        createdAt: true,
        tenantUsers: {
          select: {
            role: true,
            isOwner: true,
            tenant: {
              select: {
                id: true,
                businessName: true,
                nif: true,
                setupCompleted: true,
                plan: true,
                logoUrl: true,
                accountType: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return {
      ...user,
      tenants: user.tenantUsers.map((tu: any) => ({
        tenant: tu.tenant,
        role: tu.role,
        isOwner: tu.isOwner,
      })),
    };
  }

  async updateProfile(userId: string, dto: { firstName?: string; lastName?: string }) {
    const updateData: { firstName?: string; lastName?: string } = {};
    if (dto.firstName !== undefined) updateData.firstName = dto.firstName;
    if (dto.lastName !== undefined) updateData.lastName = dto.lastName;

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        emailVerified: true,
        lastActiveTenantId: true,
      },
    });

    return user;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('La contraseña actual no es correcta');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { message: 'Contraseña actualizada correctamente' };
  }

  private async generateTokens(userId: string, email: string, tenantId: string) {
    const payload = { sub: userId, email, tenantId };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRATION') || '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '7d',
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }
}
