import {
  Controller,
  Get,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TradeService } from './trade.service';
import { GetTradeDto } from './dto/get-trade.dto';

@ApiTags('common trades')
@Controller('api/trades')
export class TradeController {
  constructor(private readonly tradeService: TradeService) {
  }

  @Get()
  @ApiOperation({
    summary: 'Get all trades',
    description: 'Retrieve a list of all trades',
  })
  @ApiResponse({
    status: 200,
    description: 'List of trades retrieved successfully',
    type: [GetTradeDto],
  })
  list() {
    return this.tradeService.list();
  }
}
