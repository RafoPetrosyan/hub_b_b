import { Exclude, Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { GetBreakDto } from './get-break.dto';

export class GetWorkingHourDto {
  @ApiProperty({
    description: 'Day of the week',
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    example: 'Monday',
  })
  @Expose()
  day: string;

  @ApiProperty({
    description: 'Opening time in HH:MM format (24-hour)',
    example: '09:00',
  })
  @Expose()
  open: string;

  @ApiProperty({
    description: 'Closing time in HH:MM format (24-hour)',
    example: '17:00',
  })
  @Expose()
  close: string;

  @ApiProperty({
    description: 'Break times during working hours',
    type: [GetBreakDto],
    required: false,
  })
  @Expose()
  @Type(() => GetBreakDto)
  breaks?: GetBreakDto[];

  @Exclude()
  id: string;

  @Exclude()
  location_id: string;

  @Exclude()
  created_at: Date;

  @Exclude()
  updated_at: Date;
}

