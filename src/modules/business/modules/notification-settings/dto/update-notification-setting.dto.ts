import { IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateNotificationSettingDto {
  @ApiProperty({
    description: 'Enable or disable email notifications for this notification type',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  email?: boolean;

  @ApiProperty({
    description: 'Enable or disable phone/SMS notifications for this notification type',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  phone?: boolean;

  @ApiProperty({
    description: 'Enable or disable push notifications for this notification type',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  push?: boolean;
}
