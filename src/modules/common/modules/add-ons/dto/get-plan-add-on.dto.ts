import { ApiProperty } from '@nestjs/swagger';
import { GetAddOnDto } from './get-add-on.dto';

export class GetPlanAddOnDto {
  @ApiProperty({
    description: 'Plan option add-on row ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Plan option ID',
    example: '223e4567-e89b-12d3-a456-426614174000',
  })
  plan_option_id: string;

  @ApiProperty({
    description: 'Add-on ID',
    example: '323e4567-e89b-12d3-a456-426614174000',
  })
  addon_id: string;

  @ApiProperty({
    description: 'Whether the add-on is included in the plan',
    example: false,
  })
  included: boolean;

  @ApiProperty({
    description: 'Plan-specific add-on price in cents',
    example: 2900,
    required: false,
  })
  price_cents?: number | null;

  @ApiProperty({
    description: 'Currency code',
    example: 'USD',
    required: false,
  })
  currency?: string | null;

  @ApiProperty({
    description: 'Stripe price ID for this plan add-on',
    example: 'price_1234567890',
    required: false,
  })
  stripe_price_id?: string | null;

  @ApiProperty({
    description: 'Add-on details',
    type: GetAddOnDto,
  })
  addon?: GetAddOnDto;
}
