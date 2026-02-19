import { ApiProperty } from '@nestjs/swagger';

export class PaginationMetaDto {
  @ApiProperty({ description: 'Total de elementos' })
  total!: number;

  @ApiProperty({ description: 'Página actual' })
  page!: number;

  @ApiProperty({ description: 'Elementos por página' })
  limit!: number;

  @ApiProperty({ description: 'Total de páginas' })
  totalPages!: number;
}

export class PaginatedResponseDto<T> {
  @ApiProperty({ description: 'Datos paginados', isArray: true })
  data!: T[];

  @ApiProperty({ description: 'Metadatos de paginación', type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}
