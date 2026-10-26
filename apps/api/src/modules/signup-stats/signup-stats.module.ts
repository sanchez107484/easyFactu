import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { SignupStatsController } from './signup-stats.controller';
import { SignupStatsService } from './signup-stats.service';

@Module({
  imports: [PrismaModule],
  controllers: [SignupStatsController],
  providers: [SignupStatsService],
})
export class SignupStatsModule {}
