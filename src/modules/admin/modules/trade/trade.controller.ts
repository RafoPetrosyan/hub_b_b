import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TradeService } from './trade.service';
import { CreateTradeDto } from './dto/create-trade.dto';
import { UpdateTradeDto } from './dto/update-trade.dto';
import { GetTradeDto } from './dto/get-trade.dto';
import { AuthGuard } from '../../../auth';

@ApiTags('admin trades')
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
  findAll() {
    return this.tradeService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get trade by ID',
    description: 'Retrieve a specific trade by its ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Trade UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Trade retrieved successfully',
    type: GetTradeDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Trade not found',
  })
  findOne(@Param('id') id: number) {
    return this.tradeService.findOne(id);
  }

  @Post()
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Create a new trade',
    description: 'Create a new trade (requires authentication)',
  })
  @ApiResponse({
    status: 201,
    description: 'Trade created successfully',
    type: GetTradeDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
  })
  create(@Body() createTradeDto: CreateTradeDto, @Request() req: any) {
    return this.tradeService.create(createTradeDto, req.userCompany);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update a trade',
    description: 'Update an existing trade (requires authentication)',
  })
  @ApiParam({
    name: 'id',
    description: 'Trade UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Trade updated successfully',
    type: GetTradeDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Trade not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  update(
    @Param('id') id: number,
    @Body() updateTradeDto: UpdateTradeDto,
    @Request() req: any,
  ) {
    return this.tradeService.update(
      id,
      updateTradeDto,
      req.userCompany,
      req.userRole,
    );
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Delete a trade',
    description: 'Delete a trade by ID (requires authentication)',
  })
  @ApiParam({
    name: 'id',
    description: 'Trade UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 204,
    description: 'Trade deleted successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Trade not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  remove(@Param('id') id: number, @Request() req: any) {
    return this.tradeService.remove(id, req.userCompany, req.userRole);
  }
}
