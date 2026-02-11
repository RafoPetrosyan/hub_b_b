import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsAndDepositsService } from './payments-and-deposits.service';
import { PaymentsAndDepositsController } from './payments-and-deposits.controller';
import { CompanyPaymentMethod } from '../company-payment-methods/entities/company-payment-method.entity';
import {
  CompanyDepositRequirement,
} from '../deposit-requirements/entities/company-deposit-requirement.entity';
import {
  CompanyRefundPolicy,
} from '../refund-policy/entities/company-refund-policy.entity';
import { PaymentMethod } from '../../../../../admin/modules/payment-methods/entities/payment-method.entity';
import { Company } from '../../entities/company.entity';
import { User } from '../../../user/entities/user.entity';
import { CompanyTenantGuard } from '../../../../../../guards/company-tenant.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CompanyPaymentMethod,
      CompanyDepositRequirement,
      CompanyRefundPolicy,
      PaymentMethod,
      Company,
      User,
    ]),
  ],
  controllers: [PaymentsAndDepositsController],
  providers: [PaymentsAndDepositsService, CompanyTenantGuard],
  exports: [PaymentsAndDepositsService],
})
export class PaymentsAndDepositsModule {
}
