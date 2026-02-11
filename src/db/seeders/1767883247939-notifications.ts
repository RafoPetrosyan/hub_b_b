import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import { Notification } from '../../modules/business/modules/notification-settings/entities/notification.entity';
import {
    NotificationCategory
} from '../../modules/business/modules/notification-settings/entities/notification-category.entity';

export class Notifications1767883247939 implements Seeder {
    track = false;
    public async run(dataSource: DataSource): Promise<void> {
        const categories = [
            {
                title: 'General',
                description: null,
                notifications: [
                    {
                        name: 'Booking Notifications',
                    },
                    {
                        name: 'Appointment Reminders',
                        description: 'Send reminders to clients before their appointments',
                        is_reminder: true,
                    },
                    {
                        name: 'Cancellation Notifications',
                        description: 'Get notified when appointments are cancelled',
                    },
                    {
                        name: 'Payment Notifications',
                        description: 'Get notified about payments and transactions',
                    },
                ] as {
                    name: string,
                    description?: string
                    is_reminder?: boolean,
                }[],
            },
        ];


        const categoryRepo = dataSource.getRepository(NotificationCategory);
        const notificationRepo = dataSource.getRepository(Notification);

        for (const category of categories) {
            /**
             * 1. Upsert category
             */
            let categoryEntity = await categoryRepo.findOne({
                where: { title: category.title },
            });

            if (!categoryEntity) {
                categoryEntity = categoryRepo.create({
                    title: category.title,
                    description: category.description,
                });
                await categoryRepo.save(categoryEntity);
            }

            /**
             * 2. Insert notifications
             */
            for (const notification of category.notifications) {
                const alias = this.slugify(notification.name);

                const exists = await notificationRepo.findOne({
                    where: {
                        alias,
                        category_id: categoryEntity.id,
                    },
                });

                if (exists) {
                    continue;
                }

                await notificationRepo.save(
                  notificationRepo.create({
                      category_id: categoryEntity.id,
                      name: notification.name,
                      alias,
                      description: notification.description,
                      // is_reminder: notification.is_reminder ?? false,
                  }),
                );
            }
        }

        console.log('[Seeder] Notification categories & notifications seeded');
    }

    private slugify(value: string): string {
        return value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '_')
          .replace(/^_|_$/g, '');
    }
}
