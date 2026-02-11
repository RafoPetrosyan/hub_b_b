import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { NotificationProvider } from '../enum/notification-provider.enum';

export class GetNotificationVariableDto {
  @ApiProperty({
    description: 'Variable unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Variable key used in template',
    example: 'user.name',
  })
  @Expose()
  key: string;

  @ApiProperty({
    description: 'Human-readable label',
    example: 'User Full Name',
    required: false,
  })
  @Expose()
  label?: string | null;

  @ApiProperty({
    description: 'Variable description',
    example: 'The full name of the user',
    required: false,
  })
  @Expose()
  description?: string | null;

  @ApiProperty({
    description: 'Whether this variable is required',
    example: true,
  })
  @Expose()
  required: boolean;

  @Exclude()
  template_id: string;

  @Exclude()
  created_at: Date;

  @Exclude()
  updated_at: Date;
}

export class GetNotificationTemplateDto {
  @ApiProperty({
    description: 'Template unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Template type identifier',
    example: 'user_welcome',
  })
  @Expose()
  type: string;

  @ApiProperty({
    description: 'Template name',
    example: 'User Welcome Notification',
  })
  @Expose()
  name: string;

  @ApiProperty({
    description: 'Notification provider',
    enum: NotificationProvider,
    example: NotificationProvider.EMAIL,
  })
  @Expose()
  provider: NotificationProvider;

  @ApiProperty({
    description: 'Template title',
    example: 'Welcome to Our Platform!',
  })
  @Expose()
  title: string;

  @ApiProperty({
    description: 'Template body',
    example: 'Hello {{user.name}}, welcome!',
  })
  @Expose()
  body: string;

  @ApiProperty({
    description: 'Template variables',
    type: [GetNotificationVariableDto],
  })
  @Expose()
  @Type(() => GetNotificationVariableDto)
  variables?: GetNotificationVariableDto[];

  @Exclude()
  created_by: string | null;

  @Exclude()
  created_at: Date;

  @Exclude()
  updated_at: Date;

  @Exclude()
  deleted_at?: Date | null;
}

export class GetCompanyNotificationTemplateDto {
  @ApiProperty({
    description: 'Company template unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Template type identifier',
    example: 'user_welcome',
  })
  @Expose()
  type: string;

  @ApiProperty({
    description: 'Template name',
    example: 'User Welcome Notification',
  })
  @Expose()
  name: string;

  @ApiProperty({
    description: 'Notification provider',
    enum: NotificationProvider,
    example: NotificationProvider.EMAIL,
  })
  @Expose()
  provider: NotificationProvider;

  @ApiProperty({
    description: 'Custom template title (overrides base template)',
    example: 'Welcome to Our Platform!',
    nullable: true,
  })
  @Expose()
  title: string;

  @ApiProperty({
    description: 'Custom template body (overrides base template)',
    example: 'Hello {{user.name}}, welcome!',
  })
  @Expose()
  body: string;

  @ApiProperty({
    description: 'Last synchronization date with base template',
    example: '2023-01-01T00:00:00Z',
  })
  @Expose()
  last_sync_date: Date;

  @ApiProperty({
    description: 'Template variables (from base template)',
    type: [GetNotificationVariableDto],
    required: false,
  })
  @Expose()
  @Type(() => GetNotificationVariableDto)
  variables?: GetNotificationVariableDto[];

  @Exclude()
  company_id: string;

  @Exclude()
  base_template_id: string;

  @Exclude()
  created_by: string | null;

  @Exclude()
  created_at: Date;

  @Exclude()
  updated_at: Date;

  @Exclude()
  deleted_at?: Date | null;
}

