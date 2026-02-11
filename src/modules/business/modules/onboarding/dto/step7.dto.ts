import { IsArray, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class Step7Dto {
  @ApiProperty({
    description: 'Array of selected trade IDs',
    type: [String],
    required: false,
    example: ['1', '2'],
  })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  selected_ids?: string[];

  @ApiProperty({
    description: 'Array of other trades as plain strings',
    example: ['Holistic Wellness', 'Energy Healing'],
    required: false,
    type: [String],
  })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  other_trades?: string[];
}
