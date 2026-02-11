import { IsString, IsIn, IsNumber, Min, IsOptional } from 'class-validator';

export class CreatePlanPriceDto {
  @IsString()
  plan_option_id: string;

  @IsString()
  @IsIn(['monthly', 'yearly'])
  interval: 'monthly' | 'yearly';

  @IsNumber()
  @Min(0)
  price_cents: number;

  @IsOptional()
  currency?: string;
}
