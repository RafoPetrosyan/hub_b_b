import { IsArray, IsBoolean, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class BenefitChildDto {
  @IsString()
  name: string;
}

class BenefitNodeDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BenefitChildDto)
  children?: BenefitChildDto[];
}

export class CreatePlanOptionDto {
  @IsString()
  tier_id: string;

  @IsString()
  key: 'basics' | 'growth' | 'elite';

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BenefitNodeDto)
  benefits?: BenefitNodeDto[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  extra_practitioner_price_cents?: number;

  @IsOptional()
  @IsBoolean()
  website_included?: boolean;

  @IsOptional()
  @IsNumber()
  website_price_monthly_cents?: number;

  @IsOptional()
  @IsNumber()
  website_price_yearly_cents?: number;

  @IsOptional()
  @IsNumber()
  educator_upgrade_monthly_cents?: number;
}
