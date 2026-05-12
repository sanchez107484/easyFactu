import {
  IsEnum,
  IsOptional,
  IsDateString,
  IsArray,
  IsUUID,
  ValidateIf,
  ArrayMaxSize,
} from 'class-validator';

export enum ExportModePrisma {
  PENDING = 'PENDING',
  PERIOD = 'PERIOD',
  MANUAL = 'MANUAL',
}

export enum ExportFormatDto {
  CEGID = 'CEGID',
  CONTAPLUS = 'CONTAPLUS',
  A3CON = 'A3CON',
  DIAMACON = 'DIAMACON',
}

export class ExportInvoicesDto {
  @IsEnum(ExportFormatDto)
  format!: ExportFormatDto;

  @IsEnum(ExportModePrisma)
  mode!: ExportModePrisma;

  /** Required when mode = PERIOD */
  @ValidateIf((o: ExportInvoicesDto) => o.mode === ExportModePrisma.PERIOD)
  @IsDateString()
  dateFrom?: string;

  /** Required when mode = PERIOD */
  @ValidateIf((o: ExportInvoicesDto) => o.mode === ExportModePrisma.PERIOD)
  @IsDateString()
  dateTo?: string;

  /** Required when mode = MANUAL */
  @ValidateIf((o: ExportInvoicesDto) => o.mode === ExportModePrisma.MANUAL)
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMaxSize(200, { message: 'No se pueden seleccionar más de 200 facturas por exportación' })
  invoiceIds?: string[];
}

export class UpdatePreferredFormatDto {
  @IsEnum(ExportFormatDto, { message: 'Formato de exportación no válido' })
  format!: ExportFormatDto;
}

export class QueryInvoicesForExportDto {
  @IsEnum(ExportModePrisma)
  mode!: ExportModePrisma;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;
}
