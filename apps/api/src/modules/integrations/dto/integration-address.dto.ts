import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class IntegrationAddressDto {
  @ApiProperty({ example: 'C/ Mayor 1' })
  @IsString({ message: 'Debe ser texto' })
  @MinLength(2, { message: 'Mínimo 2 caracteres' })
  @MaxLength(200, { message: 'Máximo 200 caracteres' })
  line1!: string;

  @ApiProperty({ example: '31001' })
  @Matches(/^\d{5}$/, { message: 'Código postal de 5 dígitos' })
  postalCode!: string;

  @ApiProperty({ example: 'Pamplona' })
  @IsString({ message: 'Debe ser texto' })
  @MinLength(2, { message: 'Mínimo 2 caracteres' })
  @MaxLength(100, { message: 'Máximo 100 caracteres' })
  city!: string;

  @ApiPropertyOptional({ example: 'Navarra' })
  @IsOptional()
  @IsString({ message: 'Debe ser texto' })
  @MaxLength(100, { message: 'Máximo 100 caracteres' })
  province?: string;
}
