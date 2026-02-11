import { Module } from '@nestjs/common';
import { config as dotenvConfig } from 'dotenv';
import { CompanyModule } from './modules/company/company.module';
import { LocationModule } from './modules/location/location.module';
import { StaffModule } from './modules/staff/staff.module';
import { UserModule } from './modules/user/user.module';
import { VerificationCodeModule } from './modules/verification-code/verification-code.module';
import { UserTokenModule } from './modules/user-token/user-token.module';
import { NotificationTemplateModule } from './modules/notification-template/notification-template.module';
import { CommonModule } from '../common/common.module';
import { AccountModule } from './modules/account/account.module';
import { NotificationSettingsModule } from './modules/notification-settings/notification-settings.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { GuardsModule } from '../../guards/guards.module';

dotenvConfig({ path: '.env' });

@Module({
  imports: [
    CommonModule,
    OnboardingModule,
    AccountModule,
    CompanyModule,
    LocationModule,
    StaffModule,
    UserModule,
    UserTokenModule,
    VerificationCodeModule,
    NotificationTemplateModule,
    NotificationSettingsModule,
    GuardsModule,
  ],
  providers: [],
  controllers: [],
})
export class BusinessModule {
}
