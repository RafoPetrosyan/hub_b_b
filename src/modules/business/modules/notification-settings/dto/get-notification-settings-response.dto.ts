import { ApiProperty } from '@nestjs/swagger';
import { DigestFrequency } from '../entities/user-notification-master.entity';

export class NotificationSettingDto {
  @ApiProperty({ description: 'Notification ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'Notification name', example: 'New Appointment' })
  name: string;

  @ApiProperty({ description: 'Notification alias/slug', example: 'new-appointment' })
  alias: string;

  @ApiProperty({
    description: 'Notification description',
    example: 'Receive notifications when a new appointment is created',
  })
  description: string;

  @ApiProperty({
    description: 'User-specific notification settings',
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

export class NotificationCategoryDto {
  @ApiProperty({ description: 'Category ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'Category title', example: 'Appointments' })
  title: string;

  @ApiProperty({ description: 'Notifications in this category', type: [NotificationSettingDto] })
  notifications: NotificationSettingDto[];
}

export class MasterSettingsDto {
  @ApiProperty({ description: 'Master toggle for all notifications', example: true })
  enabled: boolean;

  @ApiProperty({
    description: 'Digest frequency for notifications',
    enum: DigestFrequency,
    example: DigestFrequency.OFF,
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

export class GetNotificationSettingsResponseDto {
  @ApiProperty({ description: 'Master notification settings', type: MasterSettingsDto })
  master: MasterSettingsDto;

  @ApiProperty({ description: 'Notification categories with user settings', type: [NotificationCategoryDto] })
  categories: NotificationCategoryDto[];
}

