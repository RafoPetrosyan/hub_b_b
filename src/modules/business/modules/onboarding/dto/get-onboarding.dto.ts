import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class GetOnboardingDto {
  @ApiProperty({
    description: 'Onboarding unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  user_id: string;

  @ApiProperty({
    description: 'Company ID (set after company creation)',
    example: 1,
    required: false,
  })
  @Expose()
  company_id?: string | null;

  @ApiProperty({
    description: 'Current step number (1-12)',
    example: 5,
    minimum: 1,
    maximum: 12,
  })
  @Expose()
  current_step: number;

  @ApiProperty({
    description: 'Whether onboarding is completed',
    example: false,
  })
  @Expose()
  completed: boolean;

  @ApiProperty({
    description: 'Step data stored as JSON object',
    example: {
      '1': { tier_id: 'tier_123' },
      '2': { subscription_id: 'plan_123' },
      '3': { addon_ids: ['addon_1', 'addon_2'] },
    },
    required: false,
  })
  @Expose()
  steps_data?: Record<string, any> | null;

  @ApiProperty({
    description: 'Additional metadata',
    required: false,
  })
  @Expose()
  metadata?: any | null;

  @ApiProperty({
    description: 'Onboarding creation date',
    example: '2024-01-01T00:00:00.000Z',
  })
  @Expose()
  created_at: Date;

  @ApiProperty({
    description: 'Onboarding last update date',
    example: '2024-01-01T00:00:00.000Z',
  })
  @Expose()
  updated_at: Date;
}

