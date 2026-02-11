import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateCompanyPolicyDto {
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
