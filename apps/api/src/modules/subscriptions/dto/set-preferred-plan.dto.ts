import { IsIn, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const AVAILABLE_PREFERRED_PLAN_SLUGS = [
  'BASIC_MONTHLY',
  'BASIC_YEARLY',
  'PROFESSIONAL_MONTHLY',
  'PROFESSIONAL_YEARLY',
] as const;

export class SetPreferredPlanDto {
  @ApiPropertyOptional({
    description: 'Slug del plan preferido para cuando termine el período gratuito',
    enum: AVAILABLE_PREFERRED_PLAN_SLUGS,
    example: 'PROFESSIONAL_YEARLY',
  })
  @IsOptional()
  @IsIn(AVAILABLE_PREFERRED_PLAN_SLUGS)
  preferredPlanSlug?: (typeof AVAILABLE_PREFERRED_PLAN_SLUGS)[number] | null;
}
