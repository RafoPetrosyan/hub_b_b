import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TradeService } from './trade.service';
import { TradeController } from './trade.controller';
import { CommonTradeModule as BaseTradeModule } from '../../../common/modules/trade/trade.module';

@Module({
  imports: [BaseTradeModule],
  controllers: [TradeController],
  providers: [TradeService],
  exports: [TradeService],
})
export class TradeModule {}


