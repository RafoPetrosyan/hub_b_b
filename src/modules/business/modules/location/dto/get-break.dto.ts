import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class GetBreakDto {
  @ApiProperty({
    description: 'Break start time in HH:MM format (24-hour)',
    example: '12:00',
  })
  @Expose()
  start: string;

  @ApiProperty({
    description: 'Break end time in HH:MM format (24-hour)',
    example: '13:00',
  })
  @Expose()
  end: string;
}

