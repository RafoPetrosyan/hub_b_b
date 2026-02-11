import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { Expose, Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFormFieldDto {
  @ApiProperty({
    description: 'Field name (internal identifier)',
    example: 'customer_name',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Expose()
  name: string;

  @ApiProperty({
    description: 'Field label (display name)',
    example: 'Customer Name',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Expose()
  label: string;

  @ApiProperty({
    description: 'Field type (e.g., text, email, number, select)',
    example: 'text',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Expose()
  field_type: string;

  @ApiProperty({
    description: 'Whether the field is required',
    example: true,
    required: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @Expose()
  is_required?: boolean;

  @ApiProperty({
    description: 'Placeholder text',
    example: 'Enter customer name',
    maxLength: 255,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  @Expose()
  placeholder?: string;

  @ApiProperty({
    description: 'Help text for the field',
    example: 'Enter the full name of the customer',
    required: false,
  })
  @IsString()
  @IsOptional()
  @Expose()
  help_text?: string;

  @ApiProperty({
    description: 'Sort order for field display',
    example: 1,
    minimum: 0,
    required: false,
  })
  @IsInt()
  @IsOptional()
  @Min(0)
  @Expose()
  sort_order?: number;

  @ApiProperty({
    description: 'Additional field settings',
    example: { min: 0, max: 100 },
    required: false,
  })
  @IsOptional()
  @Expose()
  settings?: Record<string, any>;
}

export class CreateFormTemplateVersionDto {
  @ApiProperty({
    description: 'Version number',
    example: 1,
    minimum: 1,
  })
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  @Expose()
  version: number;

  @ApiProperty({
    description: 'Whether this version is active',
    example: true,
    required: false,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @Expose()
  is_active?: boolean;

  @ApiProperty({
    description: 'Form fields for this version',
    type: [CreateFormFieldDto],
    required: false,
  })
  @IsOptional()
  @Expose()
  @Type(() => CreateFormFieldDto)
  fields?: CreateFormFieldDto[];
}

export class CreateFormTemplateDto {
  @ApiProperty({
    description: 'Form template name',
    example: 'Customer Intake Form',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Expose()
  name: string;

  @ApiProperty({
    description: 'Form template description',
    example: 'Form for collecting customer information',
    required: false,
  })
  @IsString()
  @IsOptional()
  @Expose()
  description?: string;

  @ApiProperty({
    description: 'Trade UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  @Expose()
  trade_id: string;

  @ApiProperty({
    description: 'Business UUID (optional)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsString()
  @IsOptional()
  @Expose()
  business_id?: string;

  @ApiProperty({
    description: 'Whether the form template is active',
    example: true,
    required: false,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @Expose()
  is_active?: boolean;

  @ApiProperty({
    description: 'Initial version of the form template',
    type: CreateFormTemplateVersionDto,
    required: false,
  })
  @IsOptional()
  @Expose()
  @Type(() => CreateFormTemplateVersionDto)
  version?: CreateFormTemplateVersionDto;
}
