import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  NotificationProvider,
} from '../../../../business/modules/notification-template/enum/notification-provider.enum';
import { NotificationType } from '../../../../business/modules/notification-template/enum/notification-type.enum';

export class CreateNotificationTemplateDto {
  @ApiProperty({
    description: 'Unique type identifier for the notification template',
    example: NotificationType.USER_WELCOME,
    maxLength: 150,
  })
  @IsString()
  @IsUUID()
  @IsNotEmpty()
  type_id: string;

  @ApiProperty({
    description: 'Human-readable name for the notification template',
    example: 'User Welcome Notification',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Notification delivery provider',
    enum: NotificationProvider,
    example: NotificationProvider.EMAIL,
  })
  @IsEnum(NotificationProvider)
  @IsNotEmpty()
  provider: NotificationProvider;

  @ApiProperty({
    description: 'Notification body content. Use {{variable_name}} for variables.',
    example: 'Hello {{user.name}}, welcome to our platform!',
  })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiProperty({
    description: 'Notification title/subject',
    example: 'Welcome to Our Platform!',
    required: false,
  })
  @IsOptional()
  @IsString()
  title?: string;
}
