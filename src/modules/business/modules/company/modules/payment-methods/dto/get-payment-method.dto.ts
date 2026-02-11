import { ApiProperty } from '@nestjs/swagger';

export class GetPaymentMethodDto {
  @ApiProperty({
    description: 'Payment method unique identifier',
    example: 'pm_1234567890',
  })
  id: string;

  @ApiProperty({
    description: 'Company ID',
    example: 1,
  })
  company_id: string;

  @ApiProperty({
    description: 'Stripe payment method ID',
    example: 'pm_1234567890',
  })
  stripe_payment_method_id: string;

  @ApiProperty({
    description: 'Payment method type',
    example: 'card',
  })
  type: string;

  @ApiProperty({
    description: 'Last 4 digits of the card',
    example: '4242',
    required: false,
  })
  last4?: string | null;

  @ApiProperty({
    description: 'Card brand',
    example: 'visa',
    required: false,
  })
  brand?: string | null;

  @ApiProperty({
    description: 'Expiration month (1-12)',
    example: 12,
    required: false,
  })
  exp_month?: number | null;

  @ApiProperty({
    description: 'Expiration year (4 digits)',
    example: 2025,
    required: false,
  })
  exp_year?: number | null;

  @ApiProperty({
    description: 'Billing name',
    example: 'John Doe',
    required: false,
  })
  billing_name?: string | null;

  @ApiProperty({
    description: 'Whether this is the primary payment method',
    example: true,
    default: false,
  })
  is_primary: boolean;

  @ApiProperty({
    description: 'Card fingerprint',
    example: 'abc123def456',
    required: false,
  })
  fingerprint?: string | null;

  @ApiProperty({
    description: 'Additional metadata (JSON object)',
    required: false,
  })
  metadata?: any | null;

  @ApiProperty({
    description: 'Payment method creation date',
    example: '2024-01-01T00:00:00.000Z',
  })
  created_at: Date;

  @ApiProperty({
    description: 'Payment method last update date',
    example: '2024-01-01T00:00:00.000Z',
  })
  updated_at: Date;
}

