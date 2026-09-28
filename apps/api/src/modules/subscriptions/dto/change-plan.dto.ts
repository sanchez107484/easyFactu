import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export const AVAILABLE_PLAN_SLUGS = [
  'BASIC_MONTHLY',
  'BASIC_YEARLY',
  'BASIC_FREE',
  'PROFESSIONAL_MONTHLY',
  'PROFESSIONAL_YEARLY',
  'PROFESSIONAL_FREE',
] as const;

export class ChangePlanDto {
  @ApiProperty({
    description: 'Slug del plan al que se quiere cambiar',
    enum: AVAILABLE_PLAN_SLUGS,
    example: 'PROFESSIONAL_MONTHLY',
  })
  @IsIn(AVAILABLE_PLAN_SLUGS)
  targetPlanSlug!: (typeof AVAILABLE_PLAN_SLUGS)[number];
}
