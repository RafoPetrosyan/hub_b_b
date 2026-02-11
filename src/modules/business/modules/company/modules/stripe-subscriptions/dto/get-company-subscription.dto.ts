import { ApiProperty } from '@nestjs/swagger';
import { CompanySubscriptionStatus } from '../entities/company-subscription.entity';

export class GetCompanySubscriptionDto {
  @ApiProperty({
    description: 'Subscription unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Company ID',
    example: 1,
  })
  company_id: string;

  @ApiProperty({
    description: 'Stripe customer ID',
    example: 'cus_1234567890',
    required: false,
  })
  stripe_customer_id?: string | null;

  @ApiProperty({
    description: 'Stripe subscription ID',
    example: 'sub_1234567890',
    required: false,
  })
  stripe_subscription_id?: string | null;

  @ApiProperty({
    description: 'Stripe price ID',
    example: 'price_1234567890',
    required: false,
  })
  stripe_price_id?: string | null;

  @ApiProperty({
    description: 'Subscription plan ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  plan_id?: string | null;

  @ApiProperty({
    description: 'Plan snapshot at time of subscription',
    required: false,
  })
  plan_snapshot?: any | null;

  @ApiProperty({
    description: 'Add-ons snapshot at time of subscription',
    required: false,
  })
  addons_snapshot?: any | null;

  @ApiProperty({
    description: 'Selected and included add-on IDs',
    required: false,
    type: [String],
  })
  addon_ids?: string[] | null;

  @ApiProperty({
    description: 'Max allowed users for the plan',
    required: false,
  })
  max_users?: number | null;

  @ApiProperty({
    description: 'Subscription status',
    enum: CompanySubscriptionStatus,
    example: CompanySubscriptionStatus.ACTIVE,
    required: false,
  })
  status?: CompanySubscriptionStatus;

  @ApiProperty({
    description: 'Current period start date',
    example: '2024-01-01T00:00:00.000Z',
    required: false,
  })
  current_period_start?: Date | null;

  @ApiProperty({
    description: 'Current period end date',
    example: '2024-02-01T00:00:00.000Z',
    required: false,
  })
  current_period_end?: Date | null;

  @ApiProperty({
    description: 'Subscription expiration date',
    example: '2024-02-01T00:00:00.000Z',
    required: false,
  })
  subscription_expires_at?: Date | null;

  @ApiProperty({
    description: 'Additional metadata (JSON object)',
    example: { note: 'stripe_not_configured' },
    required: false,
  })
  metadata?: any | null;

  @ApiProperty({
    description: 'Subscription creation date',
    example: '2024-01-01T00:00:00.000Z',
  })
  created_at: Date;

  @ApiProperty({
    description: 'Subscription last update date',
    example: '2024-01-01T00:00:00.000Z',
  })
  updated_at: Date;
}

