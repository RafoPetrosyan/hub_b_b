import { ApiProperty } from '@nestjs/swagger';
import { GetOnboardingTaskDto } from './get-onboarding-task.dto';

export class StartFinalizeResponseDto {
  @ApiProperty({
    description: 'Onboarding ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  onboarding_id: string;

  @ApiProperty({
    description: 'List of created tasks',
    type: [GetOnboardingTaskDto],
  })
  tasks: GetOnboardingTaskDto[];
}

