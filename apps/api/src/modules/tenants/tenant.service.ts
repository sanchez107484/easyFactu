import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { SetupTenantDto } from './dto/setup-tenant.dto';

@Injectable()
export class TenantService {
  constructor(private prisma: PrismaService) {}

  async findOne(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Empresa no encontrada');
    }

    return tenant;
  }

  async update(tenantId: string, userId: string, dto: UpdateTenantDto) {
    // Verify user belongs to tenant and has admin/owner permissions
    const tenantUser = await this.prisma.tenantUser.findUnique({
      where: {
        tenantId_userId: {
          tenantId,
          userId,
        },
      },
    });

    if (!tenantUser || !['OWNER', 'ADMIN'].includes(tenantUser.role)) {
      throw new ForbiddenException('No tienes permisos para actualizar la empresa');
    }

    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: dto,
    });
  }

  async completeSetup(tenantId: string) {
    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: { setupCompleted: true },
    });
  }

  /**
   * Setup wizard endpoint
   * Completes the initial tenant configuration after registration
   */
  async setup(tenantId: string, userId: string, dto: SetupTenantDto) {
    // Verify user belongs to tenant and has admin/owner permissions
    const tenantUser = await this.prisma.tenantUser.findUnique({
      where: {
        tenantId_userId: {
          tenantId,
          userId,
        },
      },
    });

    if (!tenantUser || !['OWNER', 'ADMIN'].includes(tenantUser.role)) {
      throw new ForbiddenException('No tienes permisos para configurar la empresa');
    }

    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        ...dto,
        setupCompleted: true,
      },
    });
  }
}
