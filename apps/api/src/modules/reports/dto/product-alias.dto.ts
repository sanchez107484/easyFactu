import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProductAliasInput } from '@easyfactura/shared-types';

export class CreateProductAliasDto implements ProductAliasInput {
  @ApiProperty({ description: 'Descripción de la línea de factura tal y como se escribió' })
  @IsString()
  @MinLength(1, { message: 'La descripción es obligatoria' })
  @MaxLength(1000, { message: 'La descripción no puede superar 1000 caracteres' })
  description!: string;

  @ApiProperty({ description: 'Artículo del catálogo al que equivale' })
  @IsUUID(undefined, { message: 'Artículo no válido' })
  productId!: string;
}
