import { Module } from '@nestjs/common';
import { AddOnsService } from './add-ons.service';
import { AddOnsController } from './add-ons.controller';
import {CommonAddOnsModule as CommonAddOnsModule} from '../../../common/modules/add-ons/add-ons.module';
import { StripeModule } from '../../../common/modules/stripe/stripe.module';
import { CommonSubscriptionPlansModule } from '../../../common/modules/subscription-plans/subscription-plans.module';

@Module({
  imports: [CommonAddOnsModule, CommonSubscriptionPlansModule, StripeModule],
  providers: [AddOnsService],
  controllers: [AddOnsController],
  exports: [AddOnsService],
})
export class AddOnsModule {}
