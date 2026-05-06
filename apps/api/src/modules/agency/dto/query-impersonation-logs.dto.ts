import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsUUID, IsDateString, Min, Max } from 'class-validator';

export class QueryImpersonationLogsDto {
  @IsOptional()
  @IsUUID()
  clientTenantId?: string;

  @IsOptional()
  @IsUUID()
  actorUserId?: string;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number = 50;
}
