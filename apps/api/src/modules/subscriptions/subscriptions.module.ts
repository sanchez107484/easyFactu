import { Module } from '@nestjs/common';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { GuardsModule } from '../../common/guards/guards.module';
import { EmailModule } from '../../common/email/email.module';

@Module({
  imports: [GuardsModule, EmailModule],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
