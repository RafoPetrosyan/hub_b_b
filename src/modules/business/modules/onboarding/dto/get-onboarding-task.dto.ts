import { ApiProperty } from '@nestjs/swagger';
import { OnboardingTaskStatus } from '../entities/onboarding-task.entity';

export class GetOnboardingTaskDto {
  @ApiProperty({
    description: 'Task unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Onboarding ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  onboarding_id: string;

  @ApiProperty({
    description: 'Task key identifier',
    example: 'create_company',
    enum: ['create_company', 'setup_booking_system', 'add_services', 'activate_addons', 'enable_ai_features', 'finalize_setup'],
  })
  key: string;

  @ApiProperty({
    description: 'Task status',
    example: OnboardingTaskStatus.IN_PROGRESS,
    enum: OnboardingTaskStatus,
  })
  status: OnboardingTaskStatus;

  @ApiProperty({
    description: 'Task progress percentage (0-100)',
    example: 50,
    minimum: 0,
    maximum: 100,
  })
  progress: number;

  @ApiProperty({
    description: 'Task progress message',
    example: 'Creating company record...',
    required: false,
  })
  message?: string | null;

  @ApiProperty({
    description: 'Additional task metadata',
    required: false,
  })
  meta?: any | null;

  @ApiProperty({
    description: 'Task creation date',
    example: '2024-01-01T00:00:00.000Z',
  })
  created_at: Date;

  @ApiProperty({
    description: 'Task last update date',
    example: '2024-01-01T00:00:00.000Z',
  })
  updated_at: Date;
}

