import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { Expose, Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBusinessFormFieldDto {
  @ApiProperty({
    description: 'Form field UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  @Expose()
  form_field_id: string;

  @ApiProperty({
    description: 'Override label for this field',
    example: 'Client Name',
    maxLength: 255,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  @Expose()
  label_override?: string;

  @ApiProperty({
    description: 'Override required status for this field',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @Expose()
  is_required_override?: boolean;

  @ApiProperty({
    description: 'Whether this field is hidden',
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @Expose()
  is_hidden?: boolean;

  @ApiProperty({
    description: 'Sort order for field display',
    example: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Expose()
  sort_order?: number;

  @ApiProperty({
    description: 'Override settings for this field',
    example: { min: 0, max: 100 },
    required: false,
  })
  @IsOptional()
  @Expose()
  settings_override?: Record<string, any>;
}

export class CreateBusinessFormDto {
  @ApiProperty({
    description: 'Business ID',
    example: '48',
  })
  @IsString()
  @IsNotEmpty()
  @Expose()
  business_id: string;

  @ApiProperty({
    description: 'Form template version UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  @Expose()
  form_template_version_id: string;

  @ApiProperty({
    description: 'Business form name',
    example: 'My Business Intake Form',
    maxLength: 255,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  @Expose()
  name?: string;

  @ApiProperty({
    description: 'Whether the business form is active',
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
    description: 'Business form fields with overrides',
    type: [CreateBusinessFormFieldDto],
    required: false,
  })
  @IsOptional()
  @Expose()
  @Type(() => CreateBusinessFormFieldDto)
  fields?: CreateBusinessFormFieldDto[];
}

