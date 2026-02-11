import { IsString, IsOptional, IsNumber, Min, IsIn } from 'class-validator';
import { CreatePlanOptionDto } from './create-plan-option.dto';
import { CreatePlanPriceDto } from './create-plan-price.dto';

export class UpdatePlanPriceDto implements Partial<CreatePlanPriceDto> {
  @IsString()
  plan_option_id?: string;

  @IsString()
  @IsIn(['monthly', 'yearly'])
  interval?: 'monthly' | 'yearly';

  @IsNumber()
  @Min(0)
  price_cents?: number;

  @IsOptional()
  currency?: string;
}
