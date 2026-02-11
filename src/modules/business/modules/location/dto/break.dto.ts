import { IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BreakDto {
  @ApiProperty({
    description: 'Break start time in HH:MM format (24-hour)',
    example: '12:00',
    pattern: '^\\d{2}:\\d{2}$',
  })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  start: string;

  @ApiProperty({
    description: 'Break end time in HH:MM format (24-hour)',
    example: '13:00',
    pattern: '^\\d{2}:\\d{2}$',
  })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  end: string;
}
