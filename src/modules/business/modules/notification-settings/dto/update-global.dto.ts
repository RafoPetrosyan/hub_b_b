import { IsArray, IsEnum, IsIn, IsOptional, Matches, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { DigestFrequency } from '../entities/user-notification-master.entity';

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export class QuietHourItemDto {
  @ApiProperty({
    description: 'Day of the week for quiet hours',
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    example: 'monday',
  })
  @IsIn(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])
  day: string;

  @ApiProperty({
    description: 'Start time in 24-hour format (HH:MM)',
    example: '22:00',
    pattern: '^([01]\\d|2[0-3]):([0-5]\\d)$',
  })
  @Matches(TIME_REGEX, { message: 'start must be HH:MM 24h' })
  start: string;

  @ApiProperty({
    description: 'End time in 24-hour format (HH:MM)',
    example: '07:00',
    pattern: '^([01]\\d|2[0-3]):([0-5]\\d)$',
  })
  @Matches(TIME_REGEX, { message: 'end must be HH:MM 24h' })
  end: string;
}

export class UpdateGlobalDto {
  @ApiProperty({
    description: 'Digest frequency for notifications',
    enum: DigestFrequency,
    example: DigestFrequency.DAILY,
    required: false,
  })
  @IsOptional()
  @IsEnum(DigestFrequency)
  digest_frequency?: DigestFrequency;

  @ApiProperty({
    description: 'Quiet hours when notifications should not be sent',
    type: [QuietHourItemDto],
    example: [{ day: 'monday', start: '22:00', end: '07:00' }],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuietHourItemDto)
  quiet_hours?: QuietHourItemDto[];
}
