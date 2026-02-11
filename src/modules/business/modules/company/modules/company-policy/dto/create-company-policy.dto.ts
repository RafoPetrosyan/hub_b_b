import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class CreateCompanyPolicyDto {
  @ApiProperty({
    description: 'Base policy id to create for company',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  policy_id: string;

  @ApiPropertyOptional({
    description: 'Company policy data',
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  data?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Policy enabled state',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  state?: boolean;
}
