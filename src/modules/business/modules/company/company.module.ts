import { Module } from '@nestjs/common';
import { config as dotenvConfig } from 'dotenv';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from './entities/company.entity';
import { CompanyService as CompanyServiceEntity } from './entities/company-service.entity';
import { CompanyRegisterModule } from './modules/company-register/company-register.module';
import { CompanyLoginModule } from './modules/company-login/company-login.module';
import { CompanyAddressModule } from './modules/company-address/company-address.module';
import { CompanyAddress } from './modules/company-address/entities/company-address.entity';
import { UserModule } from '../user/user.module';
import { UploadModule } from '../../../common/modules/upload/upload.module';
import { CompanyTenantGuard } from '../../../../guards/company-tenant.guard';
import { StripeSubscriptionsModule } from './modules/stripe-subscriptions/stripe-subscriptions.module';
import { PaymentMethodsModule } from './modules/payment-methods/payment-methods.module';
import { CompanyProfileModule } from './modules/company-profile/company-profile.module';
import { CompanyPolicyModule } from './modules/company-policy/company-policy.module';
import { PaymentsAndDepositsModule } from './modules/payments-and-deposits/payments-and-deposits.module';

dotenvConfig({ path: '.env' });

@Module({
  imports: [
    UserModule,
    CompanyRegisterModule,
    CompanyLoginModule,
    CompanyAddressModule,
    CompanyProfileModule,
    CompanyPolicyModule,
    PaymentsAndDepositsModule,
    UploadModule,
    StripeSubscriptionsModule,
    PaymentMethodsModule,
    TypeOrmModule.forFeature([Company, CompanyAddress, CompanyServiceEntity]),
  ],
  providers: [CompanyTenantGuard],
  controllers: [],
  exports: [CompanyTenantGuard, TypeOrmModule],
})
export class CompanyModule {
}
