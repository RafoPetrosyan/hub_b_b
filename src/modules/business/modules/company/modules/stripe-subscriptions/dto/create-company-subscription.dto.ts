import { IsArray, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCompanySubscriptionDto {
  @ApiProperty({
    description: 'Company UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  company_id: string;

  @ApiProperty({
    description: 'Subscription plan UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  plan_id: string;

  @ApiProperty({
    description: 'Stripe PaymentMethod ID from frontend',
    example: 'pm_1234567890',
  })
  @IsString()
  payment_method_id: string;

  @ApiProperty({
    description: 'Optional promotion/coupon code to apply',
    example: 'SUMMER2024',
    required: false,
  })
  @IsOptional()
  @IsString()
  coupon_code?: string;

  @ApiProperty({
    description: 'Optional add-on UUIDs selected for the subscription',
    example: ['123e4567-e89b-12d3-a456-426614174000'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  addon_ids?: string[];
}
