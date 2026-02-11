import { Module } from '@nestjs/common';
import { config as dotenvConfig } from 'dotenv';
import { UserModule } from './modules/user/user.module';
import { NotificationTemplateModule } from './modules/notification-template/notification-template.module';
import { TradeModule } from './modules/trade/trade.module';
import { ServiceModule } from './modules/service/service.module';
import { SubscriptionPlansModule } from './modules/subscription-plans/subscription-plans.module';
import { AddOnsModule } from './modules/add-ons/add-ons.module';
import { TradeGroupModule } from './modules/trade-groups/trade-group.module';
import { PaymentMethodsModule } from './modules/payment-methods/payment-methods.module';

dotenvConfig({ path: '.env' });

@Module({
  imports: [
    UserModule,
    NotificationTemplateModule,
    TradeModule,
    TradeGroupModule,
    ServiceModule,
    SubscriptionPlansModule,
    AddOnsModule,
    PaymentMethodsModule,
  ],
  providers: [],
  controllers: [],
})
export class AdminModule {
}
