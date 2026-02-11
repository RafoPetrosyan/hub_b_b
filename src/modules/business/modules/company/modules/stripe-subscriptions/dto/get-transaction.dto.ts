import { ApiProperty } from '@nestjs/swagger';
import { TransactionStatus } from '../entities/transaction.entity';

export class GetTransactionDto {
  @ApiProperty({
    description: 'Transaction unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Stripe event ID',
    example: 'evt_1234567890',
    required: false,
  })
  stripe_event_id?: string | null;

  @ApiProperty({
    description: 'Stripe object ID (payment_intent/charge/invoice)',
    example: 'pi_1234567890',
    required: false,
  })
  stripe_object_id?: string | null;

  @ApiProperty({
    description: 'Stripe event type',
    example: 'invoice.payment_succeeded',
    required: false,
  })
  type?: string | null;

  @ApiProperty({
    description: 'Company ID',
    example: 1,
    required: false,
  })
  company_id?: string | null;

  @ApiProperty({
    description: 'Company subscription ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  company_subscription_id?: string | null;

  @ApiProperty({
    description: 'Transaction amount in cents',
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
    description: 'Transaction status',
    enum: TransactionStatus,
    example: TransactionStatus.SUCCEEDED,
    required: false,
  })
  status?: TransactionStatus;

  @ApiProperty({
    description: 'Raw Stripe event data (JSON object)',
    required: false,
  })
  raw?: any | null;

  @ApiProperty({
    description: 'Transaction creation date',
    example: '2024-01-01T00:00:00.000Z',
  })
  created_at: Date;
}

