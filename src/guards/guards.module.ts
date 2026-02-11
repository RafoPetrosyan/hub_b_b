import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AddOn } from '../modules/common/modules/add-ons/entities/add-on.entity';
import { CompanyAddOn } from '../modules/business/modules/add-ons/entities/add-on.entity';
import { User } from '../modules/business/modules/user/entities/user.entity';
import { CompanySubscription } from '../modules/business/modules/company/modules/stripe-subscriptions/entities/company-subscription.entity';
import { AddOnEnabledGuard } from './addon-enabled.guard';
import { ActiveSubscriptionGuard } from './active-subscription.guard';
import { MaxPractitionersGuard } from './max-practitioners.guard';

@Module({
  imports: [TypeOrmModule.forFeature([AddOn, CompanyAddOn, User, CompanySubscription])],
  providers: [AddOnEnabledGuard, ActiveSubscriptionGuard, MaxPractitionersGuard],
  exports: [AddOnEnabledGuard, ActiveSubscriptionGuard, MaxPractitionersGuard],
})
export class GuardsModule {}
