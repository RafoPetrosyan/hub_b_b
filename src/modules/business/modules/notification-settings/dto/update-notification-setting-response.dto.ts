import { ApiProperty } from '@nestjs/swagger';

export class UpdateNotificationSettingResponseDto {
  @ApiProperty({ description: 'Notification ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'Notification alias/slug', example: 'new-appointment' })
  alias: string;

  @ApiProperty({
    description: 'Updated notification settings',
    type: 'object',
    properties: {
      email: { type: 'boolean', example: true },
      phone: { type: 'boolean', example: false },
      push: { type: 'boolean', example: false },
    },
  })
  settings: {
    email: boolean;
    phone: boolean;
    push: boolean;
  };
}

