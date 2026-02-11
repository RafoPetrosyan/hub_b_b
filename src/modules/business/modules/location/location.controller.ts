import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LocationService } from './location.service';
import { AuthGuard, Roles, RolesGuard, UserRole } from '../../../auth';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { GetLocationDto } from './dto/get-location.dto';

@ApiTags('company location')
@Controller('api/location')
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.BUSINESS_ADMIN)
@ApiBearerAuth('JWT-auth')
export class LocationController {
  constructor(private readonly locationService: LocationService) {
  }

  @Get()
  @ApiOperation({
    summary: 'Get all locations',
    description:
      'Retrieves a list of all locations. Returns empty array for Provider role. Managers only see their assigned location. Admins and Super Admins see all locations.',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved locations',
    type: [GetLocationDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  findAll(@Req() req) {
    return this.locationService.findAll(req.userId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.BUSINESS_ADMIN, UserRole.MANAGER, UserRole.PROVIDER)
  @ApiOperation({
    summary: 'Get location by ID',
    description:
      'Retrieves a specific location by its ID. Managers can only access their assigned location.',
  })
  @ApiParam({
    name: 'id',
    description: 'Location UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved location',
    type: GetLocationDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions or access denied',
  })
  @ApiResponse({
    status: 404,
    description: 'Location not found',
  })
  findOne(
    @Param('id') id: string,
    @Req() req,
  ) {
    return this.locationService.findOne(id, req.userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new location',
    description:
      'Creates a new location for the company. If is_primary is true, all other primary locations for the same company will be set to non-primary.',
  })
  @ApiBody({ type: CreateLocationDto })
  @ApiResponse({
    status: 201,
    description: 'Location successfully created',
    type: GetLocationDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Validation error',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  create(
    @Body() dto: CreateLocationDto,
    @Req() req,
  ) {
    return this.locationService.create(dto, req.userId);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update location',
    description:
      'Updates an existing location. Managers can only update their assigned location. If is_primary is changed, other primary locations for the same company will be updated accordingly.',
  })
  @ApiParam({
    name: 'id',
    description: 'Location UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({ type: UpdateLocationDto })
  @ApiResponse({
    status: 200,
    description: 'Location successfully updated',
    type: GetLocationDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Validation error',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions or access denied',
  })
  @ApiResponse({
    status: 404,
    description: 'Location not found',
  })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateLocationDto,
    @Req() req,
  ) {
    return this.locationService.update(id, dto, req.userId);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete location',
    description:
      'Deletes a location. Primary locations cannot be deleted. Managers can only delete their assigned location.',
  })
  @ApiParam({
    name: 'id',
    description: 'Location UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Location successfully deleted',
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          example: 'deleted',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Cannot delete primary location',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions or access denied',
  })
  @ApiResponse({
    status: 404,
    description: 'Location not found',
  })
  remove(
    @Param('id') id: string,
    @Req() req,
  ) {
    return this.locationService.remove(id, req.userId);
  }
}
