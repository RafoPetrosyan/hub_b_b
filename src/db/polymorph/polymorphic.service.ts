import { DataSource, EntityTarget, Repository } from 'typeorm';

type PolymorphicOpts = {
  ownerTypeColumn?: string;
  ownerIdColumn?: string;
  collectionColumn?: string;
  primaryKey?: string;
  alias?: string;
};

const DEFAULT_OPTS: Required<PolymorphicOpts> = {
  ownerTypeColumn: 'owner_type',
  ownerIdColumn: 'owner_id',
  collectionColumn: 'collection',
  primaryKey: 'id',
  alias: 't',
};

export class PolymorphicService {
  private static dataSource: DataSource;

  static initialize(dataSource: DataSource) {
    PolymorphicService.dataSource = dataSource;
  }

  /** Find single row for owner+collection (returns first match) */
  static async findOne<T = any>(
    entity: EntityTarget<T>,
    owner: any,
    collection = 'default',
    opts?: PolymorphicOpts,
  ): Promise<T | null> {
    const o = { ...DEFAULT_OPTS, ...(opts ?? {}) };
    const { ownerType, ownerId } = PolymorphicService.normalizeOwner(owner);
    const repo = PolymorphicService.repoFor(entity);
    // simple repository findOne by dynamic where
    const where: any = {};
    where[o.ownerTypeColumn] = ownerType;
    where[o.ownerIdColumn] = ownerId;
    where[o.collectionColumn] = collection;
    return repo.findOne({ where } as any);
  }

  /** Find many rows for owner+collection */
  static async findMany<T = any>(
    entity: EntityTarget<T>,
    owner: any,
    collection = 'default',
    options?: {
      order?: { [k: string]: 'ASC' | 'DESC' };
      opts?: PolymorphicOpts;
    },
  ): Promise<T[]> {
    const o = { ...DEFAULT_OPTS, ...(options?.opts ?? {}) };
    const { ownerType, ownerId } = PolymorphicService.normalizeOwner(owner);
    const repo = PolymorphicService.repoFor(entity);
    const alias = o.alias;
    const qb = repo.createQueryBuilder(alias)
      .where(`${alias}.${o.ownerTypeColumn} = :ownerType`, { ownerType })
      .andWhere(`${alias}.${o.ownerIdColumn} = :ownerId`, { ownerId })
      .andWhere(`${alias}.${o.collectionColumn} = :collection`, { collection });

    if (options?.order) {
      Object.entries(options.order).forEach(([k, v]) => qb.addOrderBy(`${alias}.${k}`, v));
    } else {
      // sensible defaults if columns exist
      qb.addOrderBy(`${alias}.position`, 'ASC').addOrderBy(`${alias}.createdAt`, 'ASC');
    }

    return qb.getMany();
  }

  /** Attach a new row for owner+collection (non-destructive) */
  static async attach<T = any>(
    entity: EntityTarget<T>,
    owner: any,
    dto: Partial<T> & { collection?: string },
    opts?: PolymorphicOpts,
  ): Promise<T> {
    const o = { ...DEFAULT_OPTS, ...(opts ?? {}) };
    const { ownerType, ownerId } = PolymorphicService.normalizeOwner(owner);
    const repo = PolymorphicService.repoFor(entity);

    const row: any = { ...(dto as any) };
    row[o.ownerTypeColumn] = ownerType;
    row[o.ownerIdColumn] = ownerId;
    row[o.collectionColumn] = dto.collection ?? 'default';
    const created = repo.create(row as any);
    return repo.save(created as any);
  }

  /**
   * Set single (one-to-one) collection for owner: deletes existing rows for that owner+collection
   * and creates a new one inside a transaction.
   */
  static async setSingle<T = any>(
    entity: EntityTarget<T>,
    owner: any,
    dto: Partial<T> & { collection?: string },
    opts?: PolymorphicOpts,
  ): Promise<T> {
    const o = { ...DEFAULT_OPTS, ...(opts ?? {}) };
    const { ownerType, ownerId } = PolymorphicService.normalizeOwner(owner);
    const collection = dto.collection ?? 'default';
    PolymorphicService.ensureInitialized();
    return PolymorphicService.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(entity);
      // delete any existing rows for owner+collection
      await repo.delete({
        [o.ownerTypeColumn]: ownerType,
        [o.ownerIdColumn]: ownerId,
        [o.collectionColumn]: collection,
      } as any);
      const row: any = { ...(dto as any) };
      row[o.ownerTypeColumn] = ownerType;
      row[o.ownerIdColumn] = ownerId;
      row[o.collectionColumn] = collection;
      const created = repo.create(row as any);
      return repo.save(created as any);
    });
  }

  /** Delete by primary key (default 'id') */
  static async remove<T = any>(
    entity: EntityTarget<T>,
    primaryValue: string,
    opts?: PolymorphicOpts,
  ): Promise<void> {
    const o = { ...DEFAULT_OPTS, ...(opts ?? {}) };
    const repo = PolymorphicService.repoFor(entity);
    const where: any = {};
    where[o.primaryKey] = primaryValue;
    await repo.delete(where);
  }

  /** Delete all rows for owner (or for specific collection if provided) */
  static async removeForOwner<T = any>(
    entity: EntityTarget<T>,
    owner: any,
    collection?: string,
    opts?: PolymorphicOpts,
  ): Promise<void> {
    const o = { ...DEFAULT_OPTS, ...(opts ?? {}) };
    const { ownerType, ownerId } = PolymorphicService.normalizeOwner(owner);
    const repo = PolymorphicService.repoFor(entity);
    const where: any = {
      [o.ownerTypeColumn]: ownerType,
      [o.ownerIdColumn]: ownerId,
    };
    if (collection) where[o.collectionColumn] = collection;
    await repo.delete(where);
  }

  private static ensureInitialized() {
    if (!PolymorphicService.dataSource) {
      throw new Error(
        'PolymorphicService not initialized. Call PolymorphicService.initialize(dataSource) early (e.g. in main.ts).',
      );
    }
  }

  private static repoFor<T>(entity: EntityTarget<T>): Repository<T> {
    PolymorphicService.ensureInitialized();
    return PolymorphicService.dataSource.getRepository(entity);
  }

  private static normalizeOwner(owner: any) {
    if (!owner) throw new Error('Owner is required');
    const ownerType = owner.constructor?.name ?? String(owner.ownerType ?? 'Unknown');
    const ownerId = String(owner.id ?? owner.ownerId ?? owner.id?.toString?.());
    if (!ownerId) throw new Error('Owner must have an id property');
    return { ownerType, ownerId };
  }
}
