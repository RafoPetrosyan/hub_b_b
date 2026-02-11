import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class Step1Dto {
  @ApiProperty({
    description: 'Tier UUID selected by the user',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  tier_id: string;
}
