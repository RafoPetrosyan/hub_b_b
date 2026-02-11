import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly repo: Repository<AuditLog>,
  ) {
  }

  async findRecent(limit = 50) {
    return this.repo.find({
      order: { created_at: 'DESC' },
      take: limit,
    });
  }

  async findByEntity(entityType: string, entityId?: string, limit = 100) {
    const where: any = { entity_type: entityType };
    if (entityId) where.entity_id = entityId;
    return this.repo.find({
      where,
      order: { created_at: 'DESC' },
      take: limit,
    });
  }

  async findByCompany(companyId: string, limit = 100) {
    return this.repo.find({
      where: { company_id: companyId },
      order: { created_at: 'DESC' },
      take: limit,
    });
  }
}
