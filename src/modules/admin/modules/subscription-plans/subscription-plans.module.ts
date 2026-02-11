import { Module } from '@nestjs/common';
import { SubscriptionPlansService } from './subscription-plans.service';
import { CommonSubscriptionPlansModule } from '../../../common/modules/subscription-plans/subscription-plans.module';
import {
  SubscriptionPlansController,
} from './subscription-plans.controller';
import { StripeModule } from '../../../common/modules/stripe/stripe.module';

@Module({
  imports: [CommonSubscriptionPlansModule, StripeModule],
  controllers: [SubscriptionPlansController],
  providers: [SubscriptionPlansService],
  exports: [SubscriptionPlansService],
})
export class SubscriptionPlansModule {
}
