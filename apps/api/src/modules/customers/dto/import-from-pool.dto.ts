import { IsString, MaxLength, MinLength } from 'class-validator';

export class ImportFromPoolDto {
  @IsString()
  @MinLength(7, { message: 'El NIF debe tener al menos 7 caracteres' })
  @MaxLength(20, { message: 'NIF demasiado largo' })
  nif!: string;
}
