import { IsArray, IsNumber, IsString, IsObject, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ConfirmImportRowDto {
  @IsNumber()
  row!: number;

  @IsString()
  status!: string;

  @IsOptional()
  @IsString()
  errorMessage?: string;

  @IsOptional()
  @IsString()
  warningMessage?: string;

  @IsObject()
  data!: Record<string, unknown>;
}

export class ConfirmImportDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConfirmImportRowDto)
  rows!: ConfirmImportRowDto[];
}
