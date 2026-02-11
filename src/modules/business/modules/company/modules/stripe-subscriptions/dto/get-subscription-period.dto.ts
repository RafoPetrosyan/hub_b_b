import { ApiProperty } from '@nestjs/swagger';

export class GetSubscriptionPeriodDto {
  @ApiProperty({
    description: 'Period unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Company subscription ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  company_subscription_id: string;

  @ApiProperty({
    description: 'Period start date',
    example: '2024-01-01T00:00:00.000Z',
  })
  period_start: Date;

  @ApiProperty({
    description: 'Period end date',
    example: '2024-02-01T00:00:00.000Z',
  })
  period_end: Date;

  @ApiProperty({
    description: 'Amount in cents for this period',
    example: 9999,
    required: false,
  })
  amount_cents?: number | null;

  @ApiProperty({
    description: 'Currency code',
    example: 'USD',
    required: false,
  })
  currency?: string | null;

  @ApiProperty({
    description: 'Stripe invoice ID',
    example: 'in_1234567890',
    required: false,
  })
  invoice_id?: string | null;

  @ApiProperty({
    description: 'Additional metadata (JSON object)',
    required: false,
  })
  metadata?: any | null;

  @ApiProperty({
    description: 'Period creation date',
    example: '2024-01-01T00:00:00.000Z',
  })
  created_at: Date;
}

