import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StripeSubscriptionsService } from './stripe-subscriptions.service';
import { StripeWebhookController } from './stripe-webhook.controller';
import { CompanySubscriptionsController } from './subscriptions.controller';
import { CompanySubscription } from './entities/company-subscription.entity';
import { SubscriptionPeriod } from './entities/subscription-period.entity';
import { Transaction } from './entities/transaction.entity';
import { Company } from '../../entities/company.entity';
import { PlanOption } from '../../../../../common/modules/subscription-plans/entities/plan-option.entity';
import { PlanOptionAddOn } from '../../../../../common/modules/add-ons/entities/plan-option-addon.entity';
import { AddOn } from '../../../../../common/modules/add-ons/entities/add-on.entity';
import { PlanPrice } from '../../../../../common/modules/subscription-plans/entities/plan-price.entity';
import { Tier } from '../../../../../common/modules/subscription-plans/entities/tier.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Company, PlanOption, PlanOptionAddOn, AddOn, PlanPrice, Tier, CompanySubscription, SubscriptionPeriod, Transaction])],
  providers: [StripeSubscriptionsService],
  controllers: [StripeWebhookController, CompanySubscriptionsController],
  exports: [StripeSubscriptionsService, TypeOrmModule],
})
export class StripeSubscriptionsModule {
}
