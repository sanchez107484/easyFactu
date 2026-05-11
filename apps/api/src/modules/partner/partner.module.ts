import { Module } from '@nestjs/common';
import { PartnerController } from './partner.controller';
import { PartnerService } from './partner.service';
import { PartnerGuard } from './partner.guard';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PartnerController],
  providers: [PartnerService, PartnerGuard],
})
export class PartnerModule {}
