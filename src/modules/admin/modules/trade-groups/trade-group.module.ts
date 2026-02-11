import { Module } from '@nestjs/common';
import { TradeGroupService } from './trade-group.service';
import { TradeGroupController } from './trade-group.controller';
import { CommonTradeModule as CommonTradeModule } from '../../../common/modules/trade/trade.module';

@Module({
  imports: [
    CommonTradeModule
  ],
  controllers: [TradeGroupController],
  providers: [TradeGroupService]
})
export class TradeGroupModule {}
