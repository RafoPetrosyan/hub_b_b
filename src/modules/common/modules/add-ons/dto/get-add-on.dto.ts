import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class BenefitChildDto {
  @ApiProperty({
    description: 'Benefit name',
    example: 'Child benefit',
  })
  @Expose()
  name: string;
}

export class BenefitNodeDto {
  @ApiProperty({
    description: 'Benefit name',
    example: 'This is the main',
  })
  @Expose()
  name: string;

  @ApiProperty({
    description: 'Child benefits (one level)',
    type: [BenefitChildDto],
    required: false,
  })
  @Expose()
  children?: BenefitChildDto[];
}

export class GetAddOnDto {
  @ApiProperty({
    description: 'Add-on unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Add-on name',
    example: 'Priority support',
  })
  @Expose()
  name: string;

  @ApiProperty({
    description: 'Add-on description',
    example: 'Access to priority email and chat support',
    required: false,
  })
  @Expose()
  description?: string | null;

  @ApiProperty({
    description: 'Add-on detailed description',
    example: 'A professional brand website that supports your business.',
    required: false,
  })
  @Expose()
  detailed_description?: string | null;

  @ApiProperty({
    description: 'Best for description',
    example: 'Businesses that want a strong online presence without booking pages.',
    required: false,
  })
  @Expose()
  best_for?: string | null;

  @ApiProperty({
    description: 'Add-on benefits',
    type: [BenefitNodeDto],
    required: false,
  })
  @Expose()
  benefits?: BenefitNodeDto[];

  @ApiProperty({
    description: 'Add-on slug',
    example: 'priority-support',
  })
  @Expose()
  slug: string;

  @ApiProperty({
    description: 'Price in cents',
    example: 1999,
  })
  @Expose()
  price_cents: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'USD',
    default: 'USD',
  })
  @Expose()
  currency: string;

  @ApiProperty({
    description: 'Stripe product ID',
    example: 'prod_1234567890',
    required: false,
  })
  @Expose()
  stripe_product_id?: string | null;

  @ApiProperty({
    description: 'Add-on creation date',
    example: '2024-01-01T00:00:00.000Z',
  })
  @Expose()
  created_at: Date;

  @ApiProperty({
    description: 'Add-on last update date',
    example: '2024-01-01T00:00:00.000Z',
  })
  @Expose()
  updated_at: Date;

  @ApiProperty({
    description: 'Add-on deleted date',
    example: null,
    required: false,
  })
  @Expose()
  deleted_at?: Date | null;
}
