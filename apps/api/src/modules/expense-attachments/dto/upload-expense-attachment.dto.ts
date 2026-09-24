import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class UploadExpenseAttachmentDto {
  @IsUUID()
  @IsOptional()
  expenseId?: string;
}
