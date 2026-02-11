import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CacheService } from './cache.service';

@ApiTags('common items')
@Controller('api/items')
export class ItemsController {
  constructor(private readonly cacheService: CacheService) {
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get item by ID',
    description: 'Retrieve an item by ID. If cached, returns cached value; otherwise fetches from DB and caches it.',
  })
  @ApiParam({
    name: 'id',
    description: 'Item identifier',
    example: 'item-123',
  })
  @ApiResponse({
    status: 200,
    description: 'Item retrieved successfully',
    schema: {
      type: 'string',
      example: 'Cached: Item item-123 from DB',
    },
  })
  async getItem(@Param('id') id: string): Promise<string> {
    const cachedItem = await this.cacheService.getCache(id);
    if (cachedItem) {
      return `Cached: ${cachedItem}`;
    }

    const fetchedItem = `Item ${id} from DB`;
    await this.cacheService.setCache(id, fetchedItem, 3600);
    return fetchedItem;
  }
}
