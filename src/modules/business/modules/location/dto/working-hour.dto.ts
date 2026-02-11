import { IsArray, IsIn, IsOptional, IsString, Matches, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { BreakDto } from './break.dto';

export class WorkingHourDto {
  @ApiProperty({
    description: 'Day of the week',
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    example: 'Monday',
  })
  @IsIn([
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ])
  day: string;

  @ApiProperty({
    description: 'Opening time in HH:MM format (24-hour)',
    example: '09:00',
    pattern: '^\\d{2}:\\d{2}$',
  })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  open: string;

  @ApiProperty({
    description: 'Closing time in HH:MM format (24-hour)',
    example: '17:00',
    pattern: '^\\d{2}:\\d{2}$',
  })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  close: string;

  @ApiProperty({
    description: 'Optional break times during working hours',
    type: [BreakDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BreakDto)
  breaks?: BreakDto[];
}
