import { config as dotenvConfig } from 'dotenv';
import { DataSource } from 'typeorm';
import type { DataSourceOptions } from 'typeorm';
import type { SeederOptions } from 'typeorm-extension';
import { join, resolve } from 'path';
import { registerAs } from '@nestjs/config';
import { User } from '../modules/business/modules/user/entities/user.entity';
import { Company } from '../modules/business/modules/company/entities/company.entity';
import { CompanyService } from '../modules/business/modules/company/entities/company-service.entity';
import { CompanyBooking } from '../modules/business/modules/company/modules/company-profile/entities/company-booking.entity';
import { Policy } from '../modules/business/modules/company/modules/company-policy/entities/policy.entity';
import {
  CompanyPolicy,
} from '../modules/business/modules/company/modules/company-policy/entities/company-policy.entity';
import {
  CompanyRefundPolicy,
} from '../modules/business/modules/company/modules/refund-policy/entities/company-refund-policy.entity';
import {
  CompanyDepositRequirement,
} from '../modules/business/modules/company/modules/deposit-requirements/entities/company-deposit-requirement.entity';
import { PaymentMethod } from '../modules/admin/modules/payment-methods/entities/payment-method.entity';
import {
  CompanyPaymentMethod,
} from '../modules/business/modules/company/modules/company-payment-methods/entities/company-payment-method.entity';
import { FormTemplate } from '../modules/form-template/entities/form-template.entity';
import { FormTemplateVersion } from '../modules/form-template/entities/form-template-version.entity';
import { FormField } from '../modules/form-template/entities/form-field.entity';
import { BusinessForm } from '../modules/form-template/entities/business-form.entity';
import { BusinessFormField } from '../modules/form-template/entities/business-form-field.entity';
import { Location } from '../modules/business/modules/location/entities/location.entity';
import { LocationAddress } from '../modules/business/modules/location/entities/location-address.entity';
import { UserToken } from '../modules/business/modules/user-token/entities/user-token.entity';
import { PasswordReset } from '../modules/common/modules/password-reset/entities/password-reset.entity';
import { VerificationCode } from '../modules/business/modules/verification-code/entities/verification-code.entity';
import {
  CompanyAddress,
} from '../modules/business/modules/company/modules/company-address/entities/company-address.entity';
import { BaseSpecialization } from '../modules/specialization/entities/specialization.entity';
import { BusinessSpecialization } from '../modules/specialization/entities/business-specialization.entity';
import { BaseService } from '../modules/admin/modules/service/entities/base-service.entity';
import { BusinessService } from '../modules/admin/modules/service/entities/business-service.entity';
import { LocationWorkingHours } from '../modules/business/modules/location/entities/location-working-hours.entity';
import { Media } from '../modules/common/modules/media/media.entity';
import {
  NotificationVariable,
} from '../modules/business/modules/notification-template/entities/notification-variable.entity';
import {
  CompanyNotificationTemplate,
} from '../modules/business/modules/notification-template/entities/company-notification-template.entity';
import {
  NotificationTemplate,
} from '../modules/business/modules/notification-template/entities/notification-template.entity';
import {
  NotificationType,
} from '../modules/business/modules/notification-template/entities/notification-type.entity';
import {
  UserNotificationMaster,
} from '../modules/business/modules/notification-settings/entities/user-notification-master.entity';
import {
  UserNotificationSetting,
} from '../modules/business/modules/notification-settings/entities/user-notification-setting.entity';
import { Notification } from '../modules/business/modules/notification-settings/entities/notification.entity';
import {
  NotificationCategory,
} from '../modules/business/modules/notification-settings/entities/notification-category.entity';
import { AuditLog } from '../modules/common/modules/audit/entities/audit-log.entity';
import { MobileVersion } from '../modules/mobile-version/entities/mobile-version.entity';
import {
  CompanySubscription,
} from '../modules/business/modules/company/modules/stripe-subscriptions/entities/company-subscription.entity';
import {
  SubscriptionPeriod,
} from '../modules/business/modules/company/modules/stripe-subscriptions/entities/subscription-period.entity';
import {
  Transaction,
} from '../modules/business/modules/company/modules/stripe-subscriptions/entities/transaction.entity';
import { Onboarding } from '../modules/business/modules/onboarding/entities/onboarding.entity';
import { OnboardingTask } from '../modules/business/modules/onboarding/entities/onboarding-task.entity';
import { TradeGroup } from '../modules/common/modules/trade/entities/trade-group.entity';
import { Trade } from '../modules/common/modules/trade/entities/trade.entity';
import { AddOn } from '../modules/common/modules/add-ons/entities/add-on.entity';
import { CompanyAddOn } from '../modules/business/modules/add-ons/entities/add-on.entity';
import { PlanOption } from '../modules/common/modules/subscription-plans/entities/plan-option.entity';
import { PlanOptionAddOn } from '../modules/common/modules/add-ons/entities/plan-option-addon.entity';
import { PlanPrice } from '../modules/common/modules/subscription-plans/entities/plan-price.entity';
import { Tier } from '../modules/common/modules/subscription-plans/entities/tier.entity';

dotenvConfig({ path: '.env' });

// Check if we're in development (TypeScript) or production (compiled JS)
const isDevelopment = process.env.NODE_ENV !== 'production';

const rootDir = process.cwd();
// Resolve absolute path for seeders to ensure it works regardless of where ts-node is executed from
const seedersPath = resolve(__dirname, 'seeders');
const factoriesPath = resolve(__dirname, 'factories');
const migrationsPath = resolve(__dirname, 'migrations');
export const options: DataSourceOptions & SeederOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities: isDevelopment
    ? [
      User,
      Trade,
      Company,
      CompanyBooking,
      CompanyRefundPolicy,
      CompanyDepositRequirement,
      PaymentMethod,
      CompanyPaymentMethod,
      Policy,
      CompanyPolicy,
      CompanyService,
      CompanyAddress,
      FormTemplate,
      FormTemplateVersion,
      FormField,
      BusinessForm,
      BusinessFormField,
      Location,
      NotificationTemplate,
      NotificationVariable,
      NotificationType,
      CompanyNotificationTemplate,
      LocationAddress,
      LocationWorkingHours,
      UserToken,
      PasswordReset,
      VerificationCode,
      BaseSpecialization,
      BusinessSpecialization,
      BaseService,
      BusinessService,
      Media,
      UserNotificationMaster,
      UserNotificationSetting,
      Notification,
      NotificationCategory,
      AuditLog,
      MobileVersion,
      PlanOption,
      PlanOptionAddOn,
      PlanPrice,
      Tier,
      CompanySubscription,
      SubscriptionPeriod,
      Transaction,
      Onboarding,
      OnboardingTask,
      TradeGroup,
      AddOn,
      CompanyAddOn,
    ]
    : [join(rootDir, '**', '*.entity.js')],
  migrations: [join(migrationsPath, '**', '*.{ts,js}').replace(/\\/g, '/')],
  // Use absolute path with forward slashes for cross-platform compatibility
  seeds: [join(seedersPath, '**', '*.{ts,js}').replace(/\\/g, '/')],
  factories: [join(factoriesPath, '**', '*.{ts,js}').replace(/\\/g, '/')],
  ssl: !isDevelopment,
  extra: isDevelopment ? {} : {
    ssl: {
      rejectUnauthorized: false,
    },
  },
};

export const typeormConfig = registerAs('typeorm', () => options);
const dataSource = new DataSource(options);
export default dataSource;
