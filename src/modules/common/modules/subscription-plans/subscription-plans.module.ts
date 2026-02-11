import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionPlansPublicController } from './subscription-plans.controller';
import { SubscriptionPlansService } from './subscription-plans.service';
import { Tier } from './entities/tier.entity';
import { PlanOption } from './entities/plan-option.entity';
import { PlanPrice } from './entities/plan-price.entity';
import { PlanOptionAddOn } from '../add-ons/entities/plan-option-addon.entity';
import { CompanyAddOn } from '../../../business/modules/add-ons/entities/add-on.entity';
import {
  CompanySubscription
} from '../../../business/modules/company/modules/stripe-subscriptions/entities/company-subscription.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tier, PlanOption, PlanOptionAddOn, CompanyAddOn, CompanySubscription, PlanPrice])],
  controllers: [SubscriptionPlansPublicController],
  providers: [SubscriptionPlansService],
  exports: [TypeOrmModule],
})
export class CommonSubscriptionPlansModule {
}
