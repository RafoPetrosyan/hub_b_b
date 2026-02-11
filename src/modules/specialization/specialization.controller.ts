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
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SpecializationService } from './specialization.service';
import { CreateBaseSpecializationDto } from './dto/create-specialization.dto';
import { UpdateBaseSpecializationDto } from './dto/update-specialization.dto';
import { GetBaseSpecializationDto } from './dto/get-specialization.dto';
import { CreateBusinessSpecializationDto } from './dto/create-business-specialization.dto';
import { UpdateBusinessSpecializationDto } from './dto/update-business-specialization.dto';
import { GetBusinessSpecializationDto } from './dto/get-business-specialization.dto';
import { AuthGuard, Roles, RolesGuard, UserRole } from '../auth';

@ApiTags('specializations')
@ApiBearerAuth('JWT-auth')
@Controller('api/specializations')
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class SpecializationController {
  constructor(
    private readonly specializationService: SpecializationService,
  ) {
  }

  // Base Specialization endpoints
  @Get('base')
  @ApiOperation({
    summary: 'Get all base specializations',
    description: 'Retrieve a list of all base specializations, optionally filtered by trade ID (Super Admin only)',
  })
  @ApiQuery({
    name: 'tradeId',
    required: false,
    type: Number,
    description: 'Filter specializations by trade ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'List of base specializations retrieved successfully',
    type: [GetBaseSpecializationDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Super Admin role required',
  })
  findAllBaseSpecializations(@Query('tradeId') tradeId?: number) {
    return this.specializationService.findAllBaseSpecializations(tradeId);
  }

  @Get('base/:id')
  @ApiOperation({
    summary: 'Get base specialization by ID',
    description: 'Retrieve a specific base specialization by its ID (Super Admin only)',
  })
  @ApiParam({
    name: 'id',
    description: 'Base specialization UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Base specialization retrieved successfully',
    type: GetBaseSpecializationDto,
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
    description: 'Base specialization not found',
  })
  findOneBaseSpecialization(@Param('id', ParseUUIDPipe) id: string) {
    return this.specializationService.findOneBaseSpecialization(id);
  }

  @Post('base')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new base specialization',
    description: 'Create a new base specialization (Super Admin only)',
  })
  @ApiResponse({
    status: 201,
    description: 'Base specialization created successfully',
    type: GetBaseSpecializationDto,
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
    description: 'Trade not found',
  })
  createBaseSpecialization(
    @Body() createBaseSpecializationDto: CreateBaseSpecializationDto,
  ) {
    return this.specializationService.createBaseSpecialization(
      createBaseSpecializationDto,
    );
  }

  @Patch('base/:id')
  @ApiOperation({
    summary: 'Update a base specialization',
    description: 'Update an existing base specialization (Super Admin only)',
  })
  @ApiParam({
    name: 'id',
    description: 'Base specialization UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Base specialization updated successfully',
    type: GetBaseSpecializationDto,
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
    description: 'Base specialization or Trade not found',
  })
  updateBaseSpecialization(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBaseSpecializationDto: UpdateBaseSpecializationDto,
  ) {
    return this.specializationService.updateBaseSpecialization(
      id,
      updateBaseSpecializationDto,
    );
  }

  @Delete('base/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a base specialization',
    description: 'Delete a base specialization by ID (Super Admin only)',
  })
  @ApiParam({
    name: 'id',
    description: 'Base specialization UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 204,
    description: 'Base specialization deleted successfully',
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
    description: 'Base specialization not found',
  })
  removeBaseSpecialization(@Param('id', ParseUUIDPipe) id: string) {
    return this.specializationService.removeBaseSpecialization(id);
  }

  // Business Specialization endpoints
  @Get('business')
  @ApiOperation({
    summary: 'Get all business specializations',
    description: 'Retrieve a list of all business specializations (Super Admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of business specializations retrieved successfully',
    type: [GetBusinessSpecializationDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Super Admin role required',
  })
  findAllBusinessSpecializations() {
    return this.specializationService.findAllBusinessSpecializations();
  }

  @Get('business/:id')
  @ApiOperation({
    summary: 'Get business specialization by ID',
    description: 'Retrieve a specific business specialization by its ID (Super Admin only)',
  })
  @ApiParam({
    name: 'id',
    description: 'Business specialization UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Business specialization retrieved successfully',
    type: GetBusinessSpecializationDto,
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
    description: 'Business specialization not found',
  })
  findOneBusinessSpecialization(@Param('id', ParseUUIDPipe) id: string) {
    return this.specializationService.findOneBusinessSpecialization(id);
  }

  @Post('business')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new business specialization',
    description: 'Create a new business specialization (Super Admin only)',
  })
  @ApiResponse({
    status: 201,
    description: 'Business specialization created successfully',
    type: GetBusinessSpecializationDto,
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
    description: 'Business or Base specialization not found',
  })
  createBusinessSpecialization(
    @Body() createBusinessSpecializationDto: CreateBusinessSpecializationDto,
  ) {
    return this.specializationService.createBusinessSpecialization(
      createBusinessSpecializationDto,
    );
  }

  @Patch('business/:id')
  @ApiOperation({
    summary: 'Update a business specialization',
    description: 'Update an existing business specialization (Super Admin only)',
  })
  @ApiParam({
    name: 'id',
    description: 'Business specialization UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Business specialization updated successfully',
    type: GetBusinessSpecializationDto,
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
    description: 'Business specialization, Business, or Base specialization not found',
  })
  updateBusinessSpecialization(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBusinessSpecializationDto: UpdateBusinessSpecializationDto,
  ) {
    return this.specializationService.updateBusinessSpecialization(
      id,
      updateBusinessSpecializationDto,
    );
  }

  @Delete('business/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a business specialization',
    description: 'Delete a business specialization by ID (Super Admin only)',
  })
  @ApiParam({
    name: 'id',
    description: 'Business specialization UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 204,
    description: 'Business specialization deleted successfully',
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
    description: 'Business specialization not found',
  })
  removeBusinessSpecialization(@Param('id', ParseUUIDPipe) id: string) {
    return this.specializationService.removeBusinessSpecialization(id);
  }
}
