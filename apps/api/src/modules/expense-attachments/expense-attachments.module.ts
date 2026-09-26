import { Module } from '@nestjs/common';
import { ExpenseAttachmentsService } from './expense-attachments.service';
import { ExpenseAttachmentStorageService } from './expense-attachment-storage.service';
import { ExpenseAttachmentsController } from './expense-attachments.controller';
import { GuardsModule } from '../../common/guards/guards.module';

@Module({
  imports: [GuardsModule],
  controllers: [ExpenseAttachmentsController],
  providers: [ExpenseAttachmentsService, ExpenseAttachmentStorageService],
  exports: [ExpenseAttachmentsService, ExpenseAttachmentStorageService],
})
export class ExpenseAttachmentsModule {}
