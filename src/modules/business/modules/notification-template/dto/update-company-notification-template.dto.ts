import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCompanyNotificationTemplateDto {
  @ApiProperty({
    description: 'Custom title for the notification template (overrides base template)',
    example: 'Welcome to Our Platform!',
    required: false,
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiProperty({
    description: 'Custom body for the notification template (overrides base template). Use {{variable_name}} for variables.',
    example: 'Hello {{user.name}}, welcome to our platform! Your account has been created successfully.',
    required: false,
  })
  @IsOptional()
  @IsString()
  body?: string;
}
