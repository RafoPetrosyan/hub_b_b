import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { NotificationCategory } from './entities/notification-category.entity';
import { Notification } from './entities/notification.entity';
import { UserNotificationSetting } from './entities/user-notification-setting.entity';
import { DigestFrequency, UserNotificationMaster } from './entities/user-notification-master.entity';
import { UpdateNotificationSettingDto } from './dto/update-notification-setting.dto';
import { UpdateMasterDto } from './dto/update-master.dto';
import { UpdateGlobalDto } from './dto/update-global.dto';

@Injectable()
export class NotificationSettingsService {
  constructor(
    @InjectRepository(NotificationCategory)
    private readonly notificationCategoryRepository: Repository<NotificationCategory>,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(UserNotificationSetting)
    private readonly userNotificationSettingRepository: Repository<UserNotificationSetting>,
    @InjectRepository(UserNotificationMaster)
    private readonly userNotificationMasterRepository: Repository<UserNotificationMaster>,
  ) {
  }

  async getSettingsForUser(userId: string) {
    const categories = await this.notificationCategoryRepository.find({
      relations: ['notifications'],
      order: { title: 'ASC' },
    });

    const allNotifications = categories.flatMap(c => c.notifications);
    const allNotificationIds = allNotifications.map(n => n.id);

    const userSettings = allNotificationIds.length
      ? await this.userNotificationSettingRepository.find({
        where: {
          user_id: userId,
          notification_id: In(allNotificationIds),
        },
      })
      : [];

    const userSettingsMap = new Map(
      userSettings.map(s => [s.notification_id, s]),
    );

    const missingSettings = allNotificationIds
      .filter(id => !userSettingsMap.has(id))
      .map(notification_id =>
        this.userNotificationSettingRepository.create({
          user_id: userId,
          notification_id,
          email: true,
          phone: true,
          push: true,
        }),
      );

    if (missingSettings.length) {
      await this.userNotificationSettingRepository.save(missingSettings);

      for (const s of missingSettings) {
        userSettingsMap.set(s.notification_id, s);
      }
    }

    let master = await this.userNotificationMasterRepository.findOne({
      where: { user_id: userId },
    });

    if (!master) {
      master = this.userNotificationMasterRepository.create({
        user_id: userId,
        enabled: true,
        digest_frequency: DigestFrequency.OFF,
        quiet_hours: null,
      });
      await this.userNotificationMasterRepository.save(master);
    }

    const result = categories.map(category => {
      const notifications = category.notifications.map(n => {
        const s = userSettingsMap.get(n.id)!;

        return {
          id: n.id,
          name: n.name,
          alias: n.alias,
          description: n.description,
          settings: {
            email: s.email,
            phone: s.phone,
            push: s.push,
          },
        };
      });

      return {
        id: category.id,
        title: category.title,
        notifications,
      };
    });

    return {
      master: {
        enabled: master.enabled,
        digest_frequency: master.digest_frequency,
        quiet_hours: master.quiet_hours,
      },
      categories: result,
    };
  }

  async updateNotificationSetting(userId: string, notificationAlias: string, dto: UpdateNotificationSettingDto) {
    const notification = await this.notificationRepository.findOne({ where: { alias: notificationAlias } });
    if (!notification) throw new NotFoundException('Notification not found');

    let setting = await this.userNotificationSettingRepository.findOne({
      where: { user_id: userId, notification_id: notification.id },
    });

    if (!setting) {
      setting = this.userNotificationSettingRepository.create({
        user_id: userId,
        notification_id: notification.id,
        email: dto.email ?? true,
        phone: dto.phone ?? true,
        push: dto.push ?? true,
      });
    } else {
      if (dto.email !== undefined) setting.email = dto.email;
      if (dto.phone !== undefined) setting.phone = dto.phone;
      if (dto.push !== undefined) setting.push = dto.push;
    }

    await this.userNotificationSettingRepository.save(setting);
    return {
      id: notification.id,
      alias: notification.alias,
      settings: {
        email: setting.email,
        phone: setting.phone,
        push: setting.push,
      },
    };
  }

  async updateMaster(userId: string, dto: UpdateMasterDto) {
    let master = await this.userNotificationMasterRepository.findOne({ where: { user_id: userId } });
    if (!master) {
      master = this.userNotificationMasterRepository.create({
        user_id: userId,
        enabled: dto.enabled ?? true,
        digest_frequency: DigestFrequency.OFF,
        quiet_hours: null,
      });
    } else {
      if (dto.enabled !== undefined) master.enabled = dto.enabled;
    }

    await this.userNotificationMasterRepository.save(master);
    return {
      enabled: master.enabled,
    };
  }

  async updateGlobal(userId: string, dto: UpdateGlobalDto) {
    let master = await this.userNotificationMasterRepository.findOne({ where: { user_id: userId } });
    if (!master) {
      master = this.userNotificationMasterRepository.create({
        user_id: userId,
        enabled: true,
        digest_frequency: dto.digest_frequency ?? DigestFrequency.OFF,
        quiet_hours: dto.quiet_hours ?? null,
      });
    } else {
      if (dto.digest_frequency !== undefined) master.digest_frequency = dto.digest_frequency;
      if (dto.quiet_hours !== undefined) master.quiet_hours = dto.quiet_hours;
    }

    await this.userNotificationMasterRepository.save(master);
    return {
      digest_frequency: master.digest_frequency,
      quiet_hours: master.quiet_hours,
    };
  }

  async listAllNotificationsGrouped() {
    const categories = await this.notificationCategoryRepository.find({
      relations: ['notifications'],
      order: { title: 'ASC' },
    });
    return categories.map((c) => ({
      id: c.id,
      title: c.title,
      notifications: c.notifications.map((n) => ({
        id: n.id,
        name: n.name,
        alias: n.alias,
        description: n.description,
      })),
    }));
  }
}
