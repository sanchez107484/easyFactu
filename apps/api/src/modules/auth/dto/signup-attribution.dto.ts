import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

const MAX_URL_LENGTH = 2048;
const MAX_UTM_LENGTH = 255;

/**
 * First-touch attribution captured by the web on the visitor's first page view
 * and sent along with the registration form.
 */
export class SignupAttributionDto {
  @ApiProperty({ required: false, example: 'https://novafactura.es/precios?utm_source=google' })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_URL_LENGTH)
  landingUrl?: string;

  @ApiProperty({ required: false, example: 'https://www.google.com/' })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_URL_LENGTH)
  referrer?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_UTM_LENGTH)
  utmSource?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_UTM_LENGTH)
  utmMedium?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_UTM_LENGTH)
  utmCampaign?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_UTM_LENGTH)
  utmTerm?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_UTM_LENGTH)
  utmContent?: string;

  @ApiProperty({ required: false, example: '2026-10-26T09:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  firstVisitAt?: string;
}
