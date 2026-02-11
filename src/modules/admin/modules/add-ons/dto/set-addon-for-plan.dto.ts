import { IsUUID, IsOptional, IsBoolean, IsInt, Min, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetAddonForPlanDto {
  @ApiProperty({
    description: 'Add-on UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  addon_id: string;

  @ApiProperty({
    description: 'Whether the add-on is included in the plan at no extra cost',
    example: false,
  })
  @IsBoolean()
  included: boolean;

  @ApiProperty({
    description: 'Plan-specific price in cents (when not included)',
    example: 2900,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  price_cents?: number;

  @ApiProperty({
    description: 'Currency code for the price',
    example: 'USD',
    required: false,
  })
  @IsOptional()
  @IsString()
  currency?: string;
}
