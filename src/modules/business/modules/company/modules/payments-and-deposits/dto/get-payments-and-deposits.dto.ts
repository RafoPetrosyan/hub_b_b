import { ApiProperty } from '@nestjs/swagger';
import { RefundWindow } from '../../refund-policy/entities/company-refund-policy.entity';

export class CompanyPaymentMethodDto {
  @ApiProperty({
    description: 'Company payment method id',
    example: '123e4567-e89b-12d3-a456-426614174111',
  })
  id: string;

  @ApiProperty({
    description: 'Payment method name',
    example: 'Credit Card',
  })
  name: string;

  @ApiProperty({
    description: 'Payment method description',
    example: 'Accept credit and debit cards',
    required: false,
  })
  description?: string | null;

  @ApiProperty({
    description: 'Payment method enabled state',
    example: true,
  })
  state: boolean;
}

export class DepositRequirementDto {
  @ApiProperty({
    description: 'Deposit requirement enabled state',
    example: false,
  })
  state: boolean;

  @ApiProperty({
    description: 'Deposit amount percentage (0-100)',
    example: 20,
  })
  amount: number;
}

export class RefundPolicyDto {
  @ApiProperty({
    description: 'Automatic refunds enabled',
    example: false,
  })
  automatic_refunds: boolean;

  @ApiProperty({
    description: 'Require deposit for refunds',
    example: false,
  })
  require_deposit: boolean;

  @ApiProperty({
    description: 'Refund window',
    enum: RefundWindow,
    required: false,
    example: RefundWindow.HOURS_24,
  })
  refund_window?: RefundWindow | null;
}

export class GetPaymentsAndDepositsDto {
  @ApiProperty({
    description: 'Company payment methods',
    type: [CompanyPaymentMethodDto],
  })
  payment_methods: CompanyPaymentMethodDto[];

  @ApiProperty({
    description: 'Company deposit requirement',
    type: DepositRequirementDto,
  })
  deposit_requirement: DepositRequirementDto;

  @ApiProperty({
    description: 'Company refund policy',
    type: RefundPolicyDto,
  })
  refund_policy: RefundPolicyDto;
}
