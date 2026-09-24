import { Module } from '@nestjs/common';
import { ExpenseAttachmentsService } from './expense-attachments.service';
import { ExpenseAttachmentsController } from './expense-attachments.controller';
import { GuardsModule } from '../../common/guards/guards.module';

@Module({
  imports: [GuardsModule],
  controllers: [ExpenseAttachmentsController],
  providers: [ExpenseAttachmentsService],
  exports: [ExpenseAttachmentsService],
})
export class ExpenseAttachmentsModule {}
