import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {
  }

  @Get('health')
  @ApiOperation({
    summary: 'Health check',
    description: 'Returns a simple hello message to verify the API is running',
  })
  @ApiResponse({
    status: 200,
    description: 'API is running',
    schema: {
      type: 'string',
      example: 'Hello World!',
    },
  })
  getHello(): string {
    return this.appService.getHello();
  }
}
