import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ServiceService } from './service.service';
import { CreateBaseServiceDto } from './dto/create-base-service.dto';
import { UpdateBaseServiceDto } from './dto/update-base-service.dto';
import { CreateBusinessServiceDto } from './dto/create-business-service.dto';
import { UpdateBusinessServiceDto } from './dto/update-business-service.dto';
import { GetBaseServiceDto } from './dto/get-base-service.dto';
import { GetBusinessServiceDto } from './dto/get-business-service.dto';
import { AuthGuard, Roles, RolesGuard, UserRole } from '../../../auth';

@ApiTags('admin services')
@ApiBearerAuth('JWT-auth')
@Controller('api/services')
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {
  }

  // Base Service endpoints
  @Get('base')
  @ApiOperation({
    summary: 'Get all base polymorph',
    description: 'Retrieve a list of all base polymorph, optionally filtered by specialization ID (Super Admin only)',
  })
  @ApiQuery({
    name: 'specializationId',
    required: false,
    type: String,
    description: 'Filter polymorph by specialization ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'List of base polymorph retrieved successfully',
    type: [GetBaseServiceDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Super Admin role required',
  })
  findAllBaseServices(@Query('specializationId') specializationId?: string) {
    return this.serviceService.findAllBaseServices(specializationId);
  }

  @Get('base/:id')
  @ApiOperation({
    summary: 'Get base service by ID',
    description: 'Retrieve a specific base service by its ID (Super Admin only)',
  })
  @ApiParam({
    name: 'id',
    description: 'Base service UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Base service retrieved successfully',
    type: GetBaseServiceDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Super Admin role required',
  })
  @ApiResponse({
    status: 404,
    description: 'Base service not found',
  })
  findOneBaseService(@Param('id', ParseUUIDPipe) id: string) {
    return this.serviceService.findOneBaseService(id);
  }

  @Post('base')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new base service',
    description: 'Create a new base service (Super Admin only)',
  })
  @ApiResponse({
    status: 201,
    description: 'Base service created successfully',
    type: GetBaseServiceDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Super Admin role required',
  })
  createBaseService(
    @Body() createBaseServiceDto: CreateBaseServiceDto,
    @Request() req: any,
  ) {
    return this.serviceService.createBaseService(
      createBaseServiceDto,
      req.userId,
    );
  }

  @Patch('base/:id')
  @ApiOperation({
    summary: 'Update a base service',
    description: 'Update an existing base service (Super Admin only)',
  })
  @ApiParam({
    name: 'id',
    description: 'Base service UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Base service updated successfully',
    type: GetBaseServiceDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Super Admin role required',
  })
  @ApiResponse({
    status: 404,
    description: 'Base service not found',
  })
  updateBaseService(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBaseServiceDto: UpdateBaseServiceDto,
  ) {
    return this.serviceService.updateBaseService(id, updateBaseServiceDto);
  }

  @Delete('base/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a base service',
    description: 'Delete a base service by ID (Super Admin only)',
  })
  @ApiParam({
    name: 'id',
    description: 'Base service UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 204,
    description: 'Base service deleted successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Super Admin role required',
  })
  @ApiResponse({
    status: 404,
    description: 'Base service not found',
  })
  removeBaseService(@Param('id', ParseUUIDPipe) id: string) {
    return this.serviceService.removeBaseService(id);
  }

  // Business Service endpoints
  @Get('business')
  @ApiOperation({
    summary: 'Get all business polymorph',
    description: 'Retrieve a list of all business polymorph (Super Admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of business polymorph retrieved successfully',
    type: [GetBusinessServiceDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Super Admin role required',
  })
  findAllBusinessServices() {
    return this.serviceService.findAllBusinessServices();
  }

  @Get('company/:id')
  @ApiOperation({
    summary: 'Get business service by ID',
    description: 'Retrieve a specific business service by its ID (Super Admin only)',
  })
  @ApiParam({
    name: 'id',
    description: 'Business service UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Business service retrieved successfully',
    type: GetBusinessServiceDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Super Admin role required',
  })
  @ApiResponse({
    status: 404,
    description: 'Business service not found',
  })
  findOneBusinessService(@Param('id', ParseUUIDPipe) id: string) {
    return this.serviceService.findOneBusinessService(id);
  }

  @Post('business')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new business service',
    description: 'Create a new business service (Super Admin only)',
  })
  @ApiResponse({
    status: 201,
    description: 'Business service created successfully',
    type: GetBusinessServiceDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Super Admin role required',
  })
  createBusinessService(@Body() createBusinessServiceDto: CreateBusinessServiceDto) {
    return this.serviceService.createBusinessService(createBusinessServiceDto);
  }

  @Patch('company/:id')
  @ApiOperation({
    summary: 'Update a business service',
    description: 'Update an existing business service (Super Admin only)',
  })
  @ApiParam({
    name: 'id',
    description: 'Business service UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Business service updated successfully',
    type: GetBusinessServiceDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Super Admin role required',
  })
  @ApiResponse({
    status: 404,
    description: 'Business service not found',
  })
  updateBusinessService(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBusinessServiceDto: UpdateBusinessServiceDto,
  ) {
    return this.serviceService.updateBusinessService(
      id,
      updateBusinessServiceDto,
    );
  }

  @Delete('company/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a business service',
    description: 'Delete a business service by ID (Super Admin only)',
  })
  @ApiParam({
    name: 'id',
    description: 'Business service UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 204,
    description: 'Business service deleted successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Super Admin role required',
  })
  @ApiResponse({
    status: 404,
    description: 'Business service not found',
  })
  removeBusinessService(@Param('id', ParseUUIDPipe) id: string) {
    return this.serviceService.removeBusinessService(id);
  }
}

