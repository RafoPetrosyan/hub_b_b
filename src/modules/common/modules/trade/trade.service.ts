import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trade } from './entities/trade.entity';
import { TradeGroup } from './entities/trade-group.entity';

@Injectable()
export class TradeService {
  constructor(
    @InjectRepository(Trade)
    private readonly tradeRepository: Repository<Trade>,
    @InjectRepository(TradeGroup)
    private readonly tradeGroupRepository: Repository<TradeGroup>,
  ) {
  }

  async list() {
    return await this.tradeGroupRepository.find({
      relations: {
        trades: true
      },
      order: { created_at: 'DESC' },
    });
  }
}
