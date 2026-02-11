import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TradeGroup } from '../../../common/modules/trade/entities/trade-group.entity';
import { CreateTradeGroupDto } from './dto/create-trade-group.dto';
import { UpdateTradeGroupDto } from './dto/update-trade-group.dto';

@Injectable()
export class TradeGroupService {
  constructor(
    @InjectRepository(TradeGroup)
    private readonly repo: Repository<TradeGroup>,
  ) {}

  async create(dto: CreateTradeGroupDto) {
    const exists = await this.repo.findOne({ where: { name: dto.name } });
    if (exists) throw new BadRequestException('Trade group with this name already exists');

    const e = this.repo.create({ name: dto.name });
    return this.repo.save(e);
  }

  async findAll(query?: { q?: string; includeDeleted?: boolean }) {
    const qb = this.repo.createQueryBuilder('tg');

    if (!query?.includeDeleted) {
      qb.where('tg.deleted_at IS NULL');
    }

    if (query?.q) {
      qb.andWhere('tg.name ILIKE :q', { q: `%${query.q}%` });
    }

    qb.orderBy('tg.name', 'ASC');

    return qb.getMany();
  }

  async findOne(id: string) {
    const e = await this.repo.findOne({ where: { id } });
    if (!e) throw new NotFoundException('Trade group not found');
    return e;
  }

  async update(id: string, dto: UpdateTradeGroupDto) {
    const e = await this.repo.findOne({ where: { id } });
    if (!e) throw new NotFoundException('Trade group not found');

    if (dto.name && dto.name !== e.name) {
      const other = await this.repo.findOne({ where: { name: dto.name } });
      if (other) throw new BadRequestException('Another trade group with this name already exists');
      e.name = dto.name;
    }

    return this.repo.save(e);
  }

  async remove(id: string) {
    const e = await this.repo.findOne({ where: { id } });
    if (!e) throw new NotFoundException('Trade group not found');
    await this.repo.softDelete(id);
    return { deleted: true };
  }

  async restore(id: string) {
    const e = await this.repo.findOne({ where: { id }, withDeleted: true });
    if (!e) throw new NotFoundException('Trade group not found');
    await this.repo.restore(id);
    return { restored: true };
  }
}
