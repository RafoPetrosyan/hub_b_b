import { Seeder } from 'typeorm-extension';
import { DataSource } from 'typeorm';
import { readFileSync } from 'fs';
import { join } from 'path';
import { TradeGroup } from '../../modules/common/modules/trade/entities/trade-group.entity';
import { Trade } from '../../modules/common/modules/trade/entities/trade.entity';
import { User } from '../../modules/business/modules/user/entities/user.entity';
import { UserRole } from '../../modules/auth';

function readJson<T>(filename: string): T {
  const raw = readFileSync(join(__dirname, filename), 'utf-8');
  return JSON.parse(raw) as T;
}

export default class TradesSeeder implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    const tradeGroupRepo = dataSource.getRepository(TradeGroup);
    const tradeRepo = dataSource.getRepository(Trade);
    const userRepo = dataSource.getRepository(User);

    const seed = readJson<Array<{ group: string; trades: string[] }>>('trades.json');

    const superAdmin = await userRepo.findOne({ where: { role: UserRole.SUPER_ADMIN } });
    const fallbackUser = superAdmin ?? (await userRepo.findOne({ where: {} }));
    if (!fallbackUser) {
      console.warn('No users found; skipping trades seeder.');
      return;
    }

    for (const g of seed) {
      if (!g?.group) continue;
      let group = await tradeGroupRepo.findOne({ where: { name: g.group } });
      if (!group) {
        group = await tradeGroupRepo.save(tradeGroupRepo.create({ name: g.group }));
      }

      for (const tradeName of g.trades ?? []) {
        const name = String(tradeName ?? '').trim();
        if (!name) continue;
        const exists = await tradeRepo.findOne({ where: { name, group_id: group.id } });
        if (exists) continue;

        await tradeRepo.save(tradeRepo.create({
          name,
          group_id: group.id,
          is_active: true,
        }));
      }
    }
  }
}
