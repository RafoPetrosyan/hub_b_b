import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RefundWindow } from '../../refund-policy/entities/company-refund-policy.entity';

export class UpdateCompanyPaymentMethodDto {
  @ApiPropertyOptional({
    description: 'Company payment method id',
    example: '123e4567-e89b-12d3-a456-426614174111',
  })
  @IsUUID()
  id: string;

  @ApiPropertyOptional({
    description: 'Payment method name',
    example: 'Credit Card',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({
    description: 'Payment method description',
    example: 'Accept credit and debit cards',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @ApiPropertyOptional({
    description: 'Payment method enabled state',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  state?: boolean;
}

export class UpdateDepositRequirementDto {
  @ApiPropertyOptional({
    description: 'Deposit requirement enabled state',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  state?: boolean;

  @ApiPropertyOptional({
    description: 'Deposit amount percentage (0-100)',
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  amount?: number;
}

export class UpdateRefundPolicyDto {
  @ApiPropertyOptional({
    description: 'Automatic refunds enabled',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  automatic_refunds?: boolean;

  @ApiPropertyOptional({
    description: 'Require deposit for refunds',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  require_deposit?: boolean;

  @ApiPropertyOptional({
    description: 'Refund window',
    enum: RefundWindow,
    example: RefundWindow.HOURS_24,
  })
  @IsOptional()
  @IsEnum(RefundWindow)
  refund_window?: RefundWindow | null;
}

export class UpdatePaymentsAndDepositsDto {
  @ApiPropertyOptional({
    description: 'Company payment methods',
    type: [UpdateCompanyPaymentMethodDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateCompanyPaymentMethodDto)
  payment_methods?: UpdateCompanyPaymentMethodDto[];

  @ApiPropertyOptional({
    description: 'Company deposit requirement',
    type: UpdateDepositRequirementDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateDepositRequirementDto)
  deposit_requirement?: UpdateDepositRequirementDto;

  @ApiPropertyOptional({
    description: 'Company refund policy',
    type: UpdateRefundPolicyDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateRefundPolicyDto)
  refund_policy?: UpdateRefundPolicyDto;
}
