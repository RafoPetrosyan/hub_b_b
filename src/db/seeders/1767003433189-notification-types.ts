import { Seeder } from 'typeorm-extension';
import { DataSource } from 'typeorm';
import { NotificationType as NotificationTypeEnum } from '../../modules/business/modules/notification-template/enum/notification-type.enum';
import { NotificationType } from '../../modules/business/modules/notification-template/entities/notification-type.entity';

export default class NotificationTypesSeeder implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    console.log('[Seeder] NotificationTypesSeeder running');
    const repo = dataSource.getRepository(NotificationType);
    const existing = new Set((await repo.find({ select: ['key'] })).map(r => r.key));
    const payload = Object.values(NotificationTypeEnum)
      .filter(k => !existing.has(k))
      .map(k => ({ name: k, key: k, description: k }));
    if (payload.length) {
      await repo.insert(payload);
      console.log(`[Seeder] inserted ${payload.length} rows`);
    } else {
      console.log('[Seeder] nothing to insert');
    }
  }
}
