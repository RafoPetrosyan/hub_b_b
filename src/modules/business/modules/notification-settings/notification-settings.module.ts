import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationCategory } from './entities/notification-category.entity';
import { Notification } from './entities/notification.entity';
import { UserNotificationSetting } from './entities/user-notification-setting.entity';
import { UserNotificationMaster } from './entities/user-notification-master.entity';
import { NotificationSettingsService } from './notification-settings.service';
import { NotificationSettingsController } from './notification-settings.controller';
import { User } from '../user/entities/user.entity';
import { CompanyModule } from '../company/company.module';

@Module({
  imports: [
    CompanyModule,
    TypeOrmModule.forFeature([
      NotificationCategory,
      Notification,
      UserNotificationSetting,
      UserNotificationMaster,
      User,
    ]),
  ],
  controllers: [NotificationSettingsController],
  providers: [NotificationSettingsService],
  exports: [NotificationSettingsService],
})
export class NotificationSettingsModule {
}
