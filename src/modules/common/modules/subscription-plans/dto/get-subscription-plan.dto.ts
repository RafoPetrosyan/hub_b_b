import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';

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
  @Type(() => BenefitChildDto)
  @Expose()
  children?: BenefitChildDto[];
}

export class GetPlanPromotionDto {
  @ApiProperty({
    description: 'Promotion unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Promotion code (optional, null for auto-apply promotions)',
    example: 'SUMMER2024',
    required: false,
  })
  @Expose()
  code?: string | null;

  @ApiProperty({
    description: 'Promotion title',
    example: 'Summer Sale',
  })
  @Expose()
  title: string;

  @ApiProperty({
    description: 'Promotion description',
    example: 'Get 20% off on all plans',
    required: false,
  })
  @Expose()
  description?: string | null;
}

export class GetSubscriptionPlanDto {
  @ApiProperty({
    description: 'Plan unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Plan name',
    example: 'Professional Plan',
  })
  @Expose()
  name: string;

  @ApiProperty({
    description: 'Plan description',
    example: 'Perfect for growing businesses',
    required: false,
  })
  @Expose()
  description?: string | null;

  @ApiProperty({
    description: 'Price in cents',
    example: 9999,
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
    description: 'Duration value',
    example: 1,
  })
  @Expose()
  duration_value: number;

  @ApiProperty({
    description: 'Whether the plan is trending',
    example: true,
    default: false,
  })
  @Expose()
  is_trending: boolean;

  @ApiProperty({
    description: 'Whether the plan is active',
    example: true,
    default: false,
  })
  @Expose()
  is_active: boolean;

  @ApiProperty({
    description: 'Stripe product ID',
    example: 'prod_1234567890',
    required: false,
  })
  @Exclude()
  stripe_product_id?: string | null;

  @ApiProperty({
    description: 'Stripe price ID',
    example: 'price_1234567890',
    required: false,
  })
  @Exclude()
  stripe_price_id?: string | null;

  @ApiProperty({
    description: 'Plan benefits',
    type: [BenefitNodeDto],
    required: false,
  })
  @Type(() => BenefitNodeDto)
  @Expose()
  benefits?: BenefitNodeDto[];

  @ApiProperty({
    description: 'Associated promotions',
    type: [GetPlanPromotionDto],
    required: false,
  })
  @Exclude()
  promotions?: GetPlanPromotionDto[];

  @ApiProperty({
    description: 'Plan creation date',
    example: '2024-01-01T00:00:00.000Z',
  })
  @Expose()
  created_at: Date;

  @ApiProperty({
    description: 'Plan last update date',
    example: '2024-01-01T00:00:00.000Z',
  })
  @Expose()
  updated_at: Date;

  @ApiProperty({
    description: 'Plan deleted date',
    example: '2024-01-01T00:00:00.000Z',
  })
  @Exclude()
  deleted_at: Date;
}

