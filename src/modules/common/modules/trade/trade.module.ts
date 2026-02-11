import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TradeService } from './trade.service';
import { TradeController } from './trade.controller';
import { Trade } from './entities/trade.entity';
import { TradeGroup } from './entities/trade-group.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Trade, TradeGroup])],
  controllers: [TradeController],
  providers: [TradeService],
  exports: [TradeService, TypeOrmModule],
})
export class CommonTradeModule {}


