import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class GetFormFieldDto {
  @ApiProperty({
    description: 'Field unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Field name (internal identifier)',
    example: 'customer_name',
  })
  @Expose()
  name: string;

  @ApiProperty({
    description: 'Field label (display name)',
    example: 'Customer Name',
  })
  @Expose()
  label: string;

  @ApiProperty({
    description: 'Field type',
    example: 'text',
  })
  @Expose()
  field_type: string;

  @ApiProperty({
    description: 'Whether the field is required',
    example: true,
  })
  @Expose()
  is_required: boolean;

  @ApiProperty({
    description: 'Placeholder text',
    example: 'Enter customer name',
  })
  @Expose()
  placeholder: string;

  @ApiProperty({
    description: 'Help text for the field',
    example: 'Enter the full name of the customer',
  })
  @Expose()
  help_text: string;

  @ApiProperty({
    description: 'Sort order for field display',
    example: 1,
  })
  @Expose()
  sort_order: number;

  @ApiProperty({
    description: 'Additional field settings',
    example: { min: 0, max: 100 },
  })
  @Expose()
  settings: Record<string, any>;

  @ApiProperty({
    description: 'Field creation timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  @Expose()
  created_at: Date;
}

export class GetFormTemplateVersionDto {
  @ApiProperty({
    description: 'Version unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Version number',
    example: 1,
  })
  @Expose()
  version: number;

  @ApiProperty({
    description: 'Whether this version is active',
    example: true,
  })
  @Expose()
  is_active: boolean;

  @ApiProperty({
    description: 'Version creation timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  @Expose()
  created_at: Date;

  @ApiProperty({
    description: 'Form fields for this version',
    type: [GetFormFieldDto],
    required: false,
  })
  @Expose()
  @Type(() => GetFormFieldDto)
  fields?: GetFormFieldDto[];
}

export class GetFormTemplateDto {
  @ApiProperty({
    description: 'Form template unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Form template name',
    example: 'Customer Intake Form',
  })
  @Expose()
  name: string;

  @ApiProperty({
    description: 'Form template description',
    example: 'Form for collecting customer information',
  })
  @Expose()
  description: string;

  @ApiProperty({
    description: 'Trade UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  trade_id: string;

  @ApiProperty({
    description: 'Business ID',
    example: '48',
    nullable: true,
  })
  @Expose()
  business_id: string | null;

  @ApiProperty({
    description: 'Whether the form template is active',
    example: true,
  })
  @Expose()
  is_active: boolean;

  @ApiProperty({
    description: 'Form template creation timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  @Expose()
  created_at: Date;

  @ApiProperty({
    description: 'Form template last update timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  @Expose()
  updated_at: Date;

  @ApiProperty({
    description: 'Form template versions',
    type: [GetFormTemplateVersionDto],
    required: false,
  })
  @Expose()
  @Type(() => GetFormTemplateVersionDto)
  versions?: GetFormTemplateVersionDto[];
}

