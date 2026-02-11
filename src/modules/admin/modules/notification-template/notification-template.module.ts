import { Module } from '@nestjs/common';
import { config as dotenvConfig } from 'dotenv';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationTemplateService } from './notification-template.service';
import { NotificationTemplateController } from './notification-template.controller';
import {
  NotificationTemplate,
} from '../../../business/modules/notification-template/entities/notification-template.entity';
import {
  NotificationVariable,
} from '../../../business/modules/notification-template/entities/notification-variable.entity';
import { NotificationType } from '../../../business/modules/notification-template/entities/notification-type.entity';

dotenvConfig({ path: '.env' });

@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationTemplate, NotificationVariable, NotificationType]),
  ],
  providers: [NotificationTemplateService],
  controllers: [NotificationTemplateController],
  exports: [NotificationTemplateService],
})
export class NotificationTemplateModule {
}
