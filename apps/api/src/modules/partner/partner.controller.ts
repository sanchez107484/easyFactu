import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { PartnerGuard } from './partner.guard';
import { PartnerService } from './partner.service';

const ALLOWED_DAYS = [7, 30, 45, 90, 180, 365] as const;

@Controller('partner')
@Public()
@UseGuards(PartnerGuard)
export class PartnerController {
  constructor(private readonly partnerService: PartnerService) {}

  @Get('stats')
  getStats(@Query('days') daysStr?: string) {
    const parsed = parseInt(daysStr ?? '30', 10);
    const days = (ALLOWED_DAYS as readonly number[]).includes(parsed) ? parsed : 30;
    return this.partnerService.getStats(days);
  }
}
