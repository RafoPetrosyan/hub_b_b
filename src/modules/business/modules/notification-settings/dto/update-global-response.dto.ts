import { ApiProperty } from '@nestjs/swagger';
import { DigestFrequency } from '../entities/user-notification-master.entity';

export class UpdateGlobalResponseDto {
  @ApiProperty({
    description: 'Digest frequency for notifications',
    enum: DigestFrequency,
    example: DigestFrequency.DAILY,
  })
  digest_frequency: DigestFrequency;

  @ApiProperty({
    description: 'Quiet hours when notifications should not be sent',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        day: { type: 'string', example: 'monday' },
        start: { type: 'string', example: '22:00' },
        end: { type: 'string', example: '07:00' },
      },
    },
    nullable: true,
    example: [{ day: 'monday', start: '22:00', end: '07:00' }],
  })
  quiet_hours: Array<{ day: string; start: string; end: string }> | null;
}

