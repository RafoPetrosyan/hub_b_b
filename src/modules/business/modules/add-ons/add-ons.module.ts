import { Module } from '@nestjs/common';
import { AddOnsService } from './add-ons.service';
import { CommonAddOnsModule } from '../../../common/modules/add-ons/add-ons.module';
import { CommonSubscriptionPlansModule } from '../../../common/modules/subscription-plans/subscription-plans.module';
import { StripeSubscriptionsModule } from '../company/modules/stripe-subscriptions/stripe-subscriptions.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyAddOn } from './entities/add-on.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([CompanyAddOn]),
    CommonAddOnsModule,
    CommonSubscriptionPlansModule,
    CommonSubscriptionPlansModule,
    StripeSubscriptionsModule
  ],
  providers: [AddOnsService],
  exports: [AddOnsService, TypeOrmModule],
})
export class BusinessAddOnsModule {}
