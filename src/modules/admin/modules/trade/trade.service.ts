import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToClass } from 'class-transformer';
import { CreateTradeDto } from './dto/create-trade.dto';
import { UpdateTradeDto } from './dto/update-trade.dto';
import { GetTradeDto } from './dto/get-trade.dto';
import { UserRole } from '../../../auth';
import { Trade } from '../../../common/modules/trade/entities/trade.entity';
import { TradeGroup } from '../../../common/modules/trade/entities/trade-group.entity';

@Injectable()
export class TradeService {
  constructor(
    @InjectRepository(Trade)
    private readonly tradeRepository: Repository<Trade>,
    @InjectRepository(TradeGroup)
    private readonly tradeGroupRepository: Repository<TradeGroup>,
  ) {
  }

  async findAll(): Promise<GetTradeDto[]> {
    return await this.tradeRepository.find({
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: number): Promise<GetTradeDto> {
    const trade = await this.tradeRepository.findOne({
      where: { id },
    });
    if (!trade) {
      throw new NotFoundException('Trade not found');
    }
    return plainToClass(GetTradeDto, trade, { excludeExtraneousValues: true });
  }

  async create(
    createTradeDto: CreateTradeDto,
    userCompany: string,
  ): Promise<GetTradeDto> {
    const group = await this.tradeGroupRepository.findOne({
      where: { id: createTradeDto.group_id },
    });
    if (!group) {
      throw new NotFoundException('Trade group not found');
    }

    const existing = await this.tradeRepository.findOne({
      where: { name: createTradeDto.name, group_id: createTradeDto.group_id },
    });
    if (existing) {
      throw new BadRequestException('Trade with this name already exists in the group');
    }

    const trade = this.tradeRepository.create({
      ...createTradeDto,
      creator_company_id: userCompany,
    });
    const savedTrade = await this.tradeRepository.save(trade);
    return plainToClass(GetTradeDto, savedTrade, {
      excludeExtraneousValues: true,
    });
  }

  async update(
    id: number,
    updateTradeDto: UpdateTradeDto,
    userCompany: string,
    userRole: UserRole,
  ): Promise<GetTradeDto> {
    const trade = await this.tradeRepository.findOne({
      where: { id },
    });
    if (!trade) {
      throw new NotFoundException('Trade not found');
    }
    if (userRole !== UserRole.SUPER_ADMIN && trade.creator_company_id !== userCompany) {
      throw new ForbiddenException('You can only update your own trades');
    }
    if (updateTradeDto.group_id) {
      const group = await this.tradeGroupRepository.findOne({
        where: { id: updateTradeDto.group_id },
      });
      if (!group) {
        throw new NotFoundException('Trade group not found');
      }
    }

    const nextName = updateTradeDto.name ?? trade.name;
    const nextGroupId = updateTradeDto.group_id ?? trade.group_id;
    const existing = await this.tradeRepository.findOne({
      where: { name: nextName, group_id: nextGroupId },
    });
    if (existing && existing.id !== trade.id) {
      throw new BadRequestException('Trade with this name already exists in the group');
    }

    Object.assign(trade, updateTradeDto);
    const updatedTrade = await this.tradeRepository.save(trade);
    return plainToClass(GetTradeDto, updatedTrade, {
      excludeExtraneousValues: true,
    });
  }

  async remove(id: number, userCompany: string, userRole: UserRole): Promise<void> {
    const trade = await this.tradeRepository.findOne({
      where: { id },
    });
    if (!trade) {
      throw new NotFoundException('Trade not found');
    }
    if (userRole !== UserRole.SUPER_ADMIN && trade.creator_company_id !== userCompany) {
      throw new ForbiddenException('You can only delete your own trades');
    }
    await this.tradeRepository.remove(trade);
  }
}
