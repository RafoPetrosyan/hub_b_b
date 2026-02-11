import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { Expose, Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CreateFormFieldDto } from './create-form-template.dto';

export class UpdateFormTemplateDto {
  @ApiProperty({
    description: 'Form template name',
    example: 'Customer Intake Form',
    maxLength: 255,
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @IsOptional()
  @Expose()
  name?: string;

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
    description: 'Whether the form template is active',
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
  is_active?: boolean;

  @ApiProperty({
    description: 'Form fields to update',
    type: [CreateFormFieldDto],
    required: false,
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateFormFieldDto)
  @Expose()
  fields?: CreateFormFieldDto[];
}


