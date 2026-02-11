import { IsBoolean, IsNumber, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class Step2Dto {
  @ApiProperty({
    description: 'Subscription plan UUID selected by the user',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  subscription_id: string;

  @ApiProperty({
    description: 'Whether user wants website add-on (if not included in plan)',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  has_website?: boolean;

  @ApiProperty({
    description: 'Number of additional practitioners requested',
    example: 2,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  additional_practitioners?: number;
}
