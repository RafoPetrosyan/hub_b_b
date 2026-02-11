import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BasePolicyDto {
  @ApiProperty({
    description: 'Base policy id',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Policy name',
    example: 'Cancellation Policy',
  })
  name: string;

  @ApiProperty({
    description: 'Policy description',
    example: 'Set rules for appointment cancellations',
    required: false,
  })
  description?: string | null;

  @ApiProperty({
    description: 'Policy slug',
    example: 'cancellation',
  })
  slug: string;

  @ApiProperty({
    description: 'Default enabled state',
    example: true,
  })
  default_state: boolean;

  @ApiProperty({
    description: 'Default policy text',
    example: 'Appointments canceled within 24 hours may be charged.',
    required: false,
  })
  default_text?: string | null;

  @ApiProperty({
    description: 'Whether policy is additional',
    example: false,
  })
  is_additional: boolean;

  @ApiProperty({
    description: 'Field definitions and validation rules',
    type: 'array',
    items: { type: 'object' },
    required: false,
  })
  fields?: Record<string, any> | any[] | null;
}

export class CompanyPolicyDto {
  @ApiProperty({
    description: 'Company policy id',
    example: '123e4567-e89b-12d3-a456-426614174111',
  })
  id: string;

  @ApiProperty({
    description: 'Company id',
    example: '123e4567-e89b-12d3-a456-426614174222',
  })
  company_id: string;

  @ApiProperty({
    description: 'Base policy id',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  policy_id: string;

  @ApiProperty({
    description: 'Policy slug copied from base policy',
    example: 'cancellation',
  })
  slug: string;

  @ApiPropertyOptional({
    description: 'Company policy data',
    type: 'object',
    additionalProperties: true,
  })
  data?: Record<string, any> | null;

  @ApiProperty({
    description: 'Policy enabled state',
    example: true,
  })
  state: boolean;

  @ApiProperty({
    description: 'Base policy details',
    type: BasePolicyDto,
  })
  policy: BasePolicyDto;
}
