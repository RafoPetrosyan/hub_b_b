import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Param,
  Patch,
  Delete,
  HttpCode,
  ParseBoolPipe, UseGuards,
} from '@nestjs/common';
import { CreateTradeGroupDto } from './dto/create-trade-group.dto';
import { UpdateTradeGroupDto } from './dto/update-trade-group.dto';
import { TradeGroupService } from './trade-group.service';
import { AuthGuard, Roles, RolesGuard, UserRole } from '../../../auth';
import { ApiTags } from '@nestjs/swagger';

@Controller('api/admin/trade-group')
@ApiTags('admin trade-group')
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
export class TradeGroupController {
  constructor(private readonly tradeGroupService: TradeGroupService) {}

  @Post()
  async create(@Body() dto: CreateTradeGroupDto) {
    return this.tradeGroupService.create(dto);
  }

  @Get()
  async list(@Query('q') q?: string, @Query('includeDeleted', ParseBoolPipe) includeDeleted?: boolean) {
    return this.tradeGroupService.findAll({ q, includeDeleted });
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.tradeGroupService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateTradeGroupDto) {
    return this.tradeGroupService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(200)
  async remove(@Param('id') id: string) {
    return this.tradeGroupService.remove(id);
  }

  @Post(':id/restore')
  async restore(@Param('id') id: string) {
    return this.tradeGroupService.restore(id);
  }
}
