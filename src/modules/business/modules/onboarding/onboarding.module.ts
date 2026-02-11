import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Onboarding } from './entities/onboarding.entity';
import { OnboardingTask } from './entities/onboarding-task.entity';
import { OnboardingService } from './onboarding.service';
import { OnboardingController } from './onboarding.controller';
import { CompanyModule } from '../company/company.module';
import { StripeSubscriptionsModule } from '../company/modules/stripe-subscriptions/stripe-subscriptions.module';
import { PaymentMethodsModule } from '../company/modules/payment-methods/payment-methods.module';
import { TradeModule } from '../../../admin/modules/trade/trade.module';
import { ServiceModule } from '../../../admin/modules/service/service.module';
import { VerificationCodeModule } from '../verification-code/verification-code.module';
import { UserModule } from '../user/user.module';
import { NotifyModule } from '../../../common/modules/notify/notify.module';
import { BusinessAddOnsModule } from '../add-ons/add-ons.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Onboarding, OnboardingTask]),
    forwardRef(() => StripeSubscriptionsModule),
    forwardRef(() => PaymentMethodsModule),
    forwardRef(() => CompanyModule),
    forwardRef(() => TradeModule),
    forwardRef(() => UserModule),
    forwardRef(() => NotifyModule),
    forwardRef(() => ServiceModule),
    forwardRef(() => VerificationCodeModule),
    forwardRef(() => BusinessAddOnsModule),
  ],
  providers: [OnboardingService],
  controllers: [OnboardingController],
  exports: [OnboardingService, TypeOrmModule],
})
export class OnboardingModule {
}
