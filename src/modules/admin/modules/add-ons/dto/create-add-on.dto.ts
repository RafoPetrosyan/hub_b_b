import { IsArray, IsInt, IsOptional, IsString, Length, Matches, Min, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class BenefitChildDto {
  @ApiProperty({
    description: 'Child benefit name',
    example: 'Child benefit',
  })
  @IsString()
  name: string;
}

class BenefitNodeDto {
  @ApiProperty({
    description: 'Benefit name',
    example: 'This is the main',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Child benefits (one level)',
    type: [BenefitChildDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BenefitChildDto)
  children?: BenefitChildDto[];
}

export class CreateAddOnDto {
  @ApiProperty({
    description: 'Add-on display name',
    example: 'Extra Practitioners',
    minLength: 1,
    maxLength: 200,
  })
  @IsString()
  @Length(1, 200)
  name: string;

  @ApiProperty({
    description: 'Optional add-on description',
    example: 'Add more practitioners to your account',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Detailed add-on description',
    example: 'A professional brand website that supports your business.',
    required: false,
  })
  @IsOptional()
  @IsString()
  detailed_description?: string;

  @ApiProperty({
    description: 'Best for description',
    example: 'Businesses that want a strong online presence without booking pages.',
    required: false,
  })
  @IsOptional()
  @IsString()
  best_for?: string;

  @ApiProperty({
    description: 'Add-on benefits',
    type: [BenefitNodeDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BenefitNodeDto)
  benefits?: BenefitNodeDto[];

  @ApiProperty({
    description: 'URL-safe slug (lowercase, numbers, hyphens only)',
    example: 'extra-practitioners',
    required: false,
    pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$',
  })
  @IsOptional()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  slug?: string;

  @ApiProperty({
    description: 'Price in cents',
    example: 1999,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  price_cents: number;

  @ApiProperty({
    description: 'Currency code (e.g. USD)',
    example: 'USD',
    required: false,
  })
  @IsOptional()
  @IsString()
  currency?: string;
}
