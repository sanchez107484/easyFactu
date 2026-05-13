import { IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LookupCustomerDto {
  @ApiProperty({ description: 'NIF/CIF a buscar en el directorio fiscal global' })
  @IsString()
  @MinLength(7, { message: 'El NIF debe tener al menos 7 caracteres' })
  @MaxLength(20, { message: 'NIF demasiado largo' })
  nif!: string;
}
