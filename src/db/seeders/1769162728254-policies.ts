import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Policy } from '../../modules/business/modules/company/modules/company-policy/entities/policy.entity';

type PolicySeed = {
  name: string;
  slug: string;
  description?: string | null;
  default_state?: boolean;
  default_text?: string | null;
  is_additional?: boolean;
  fields?: Array<Record<string, any>>;
};

function readJson<T>(filename: string): T {
  const raw = readFileSync(join(__dirname, filename), 'utf-8');
  return JSON.parse(raw) as T;
}

export class Policies1769162728254 implements Seeder {
  track = false;

  public async run(dataSource: DataSource): Promise<void> {
    const policies = readJson<PolicySeed[]>('policies.json');

    const policyRepo = dataSource.getRepository(Policy);

    for (const policy of policies) {
      if (!policy?.slug) {
        continue;
      }
      const existing = await policyRepo.findOne({ where: { slug: policy.slug } });
      if (!existing) {
        await policyRepo.save(policyRepo.create(policy));
        continue;
      }

      await policyRepo.save({
        ...existing,
        name: policy.name,
        description: policy.description ?? null,
        default_state: policy.default_state ?? true,
        default_text: policy.default_text ?? null,
        is_additional: policy.is_additional ?? false,
        fields: policy.fields ?? null,
      });
    }

    console.log('[Seeder] Policies seeded');
  }
}
