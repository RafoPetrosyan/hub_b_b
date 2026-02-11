import { ApiProperty } from '@nestjs/swagger';

export class NotificationListItemDto {
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
}

export class NotificationCategoryListItemDto {
  @ApiProperty({ description: 'Category ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'Category title', example: 'Appointments' })
  title: string;

  @ApiProperty({ description: 'Notifications in this category', type: [NotificationListItemDto] })
  notifications: NotificationListItemDto[];
}

