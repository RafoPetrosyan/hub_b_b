import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class Step10Dto {
  @ApiProperty({
    description: 'Whether business has scheduling system',
    example: true,
  })
  @IsBoolean()
  has_schedule: boolean;

  @ApiProperty({
    description: 'Whether business offers education/training',
    example: false,
  })
  @IsBoolean()
  has_education: boolean;

  @ApiProperty({
    description: 'Whether business sells products',
    example: true,
  })
  @IsBoolean()
  has_products: boolean;
}
