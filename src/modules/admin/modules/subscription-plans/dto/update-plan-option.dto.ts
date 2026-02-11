import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
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
import { CreatePlanOptionDto } from './create-plan-option.dto';

export class UpdatePlanOptionDto implements Partial<CreatePlanOptionDto> {
  @IsString()
  tier_id?: string;

  @IsString()
  key?: 'basics' | 'growth' | 'elite';

  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BenefitNodeDto)
  benefits?: BenefitNodeDto[];
}
