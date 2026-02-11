import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  NotificationProvider,
} from '../../../../business/modules/notification-template/enum/notification-provider.enum';

export class UpdateNotificationTemplateDto {
  @ApiProperty({
    description: 'Notification delivery provider',
    enum: NotificationProvider,
    example: NotificationProvider.EMAIL,
    required: false,
  })
  @IsOptional()
  @IsEnum(NotificationProvider)
  provider?: NotificationProvider;

  @ApiProperty({
    description: 'Notification title/subject',
    example: 'Welcome to Our Platform!',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  title?: string | null;

  @ApiProperty({
    description: 'Notification body content. Use {{variable_name}} for variables.',
    example: 'Hello {{user.name}}, welcome to our platform!',
    required: false,
  })
  @IsOptional()
  @IsString()
  body?: string;
}
