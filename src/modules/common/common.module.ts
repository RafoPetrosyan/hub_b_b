import { Module } from '@nestjs/common';
import { config as dotenvConfig } from 'dotenv';
import { UploadModule } from './modules/upload/upload.module';
import { RedisModule } from './modules/redis/redis.module';
import { PasswordReset } from './modules/password-reset/entities/password-reset.entity';
import { NotifyModule } from './modules/notify/notify.module';
import { AuditModule } from './modules/audit/audit.module';
import { CommonSubscriptionPlansModule } from './modules/subscription-plans/subscription-plans.module';
import { CommonTradeModule } from './modules/trade/trade.module';
import { CommonAddOnsModule } from './modules/add-ons/add-ons.module';

dotenvConfig({ path: '.env' });

@Module({
  imports: [
    AuditModule,
    // RedisModule,
    UploadModule,
    PasswordReset,
    NotifyModule,
    CommonTradeModule,
    CommonAddOnsModule,
    CommonSubscriptionPlansModule,
  ],
  providers: [],
  controllers: [],
})
export class CommonModule {
}
