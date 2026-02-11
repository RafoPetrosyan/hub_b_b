import { Module } from '@nestjs/common';
import { config as dotenvConfig } from 'dotenv';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationTemplateService } from './notification-template.service';
import { NotificationTemplateController } from './notification-template.controller';
import { NotificationTemplate } from './entities/notification-template.entity';
import { CompanyNotificationTemplate } from './entities/company-notification-template.entity';
import { NotificationVariable } from './entities/notification-variable.entity';
import { NotificationType } from './entities/notification-type.entity';

dotenvConfig({ path: '.env' });

@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationTemplate, CompanyNotificationTemplate, NotificationVariable, NotificationType]),
  ],
  providers: [NotificationTemplateService],
  controllers: [NotificationTemplateController],
  exports: [NotificationTemplateService, TypeOrmModule],
})
export class NotificationTemplateModule {
}
