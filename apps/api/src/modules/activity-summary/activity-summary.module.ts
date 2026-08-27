import { Module } from '@nestjs/common';
import { ActivitySummaryController } from './activity-summary.controller';
import { ActivitySummaryService } from './activity-summary.service';

@Module({
  controllers: [ActivitySummaryController],
  providers: [ActivitySummaryService],
})
export class ActivitySummaryModule {}
