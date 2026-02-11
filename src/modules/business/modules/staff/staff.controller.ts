import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseArrayPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard, Roles, RolesGuard, UserRole } from '../../../auth';
import { StaffService } from './staff.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { GetStaffDto } from './dto/get-staff.dto';
import { GetStaffCountDto } from './dto/get-staff-count.dto';
import { CompanyTenantGuard } from '../../../../guards/company-tenant.guard';

@ApiTags('company staff')
@ApiBearerAuth('JWT-auth')
@Controller('api/staff')
@UseGuards(AuthGuard, RolesGuard, CompanyTenantGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.BUSINESS_ADMIN, UserRole.MANAGER)
export class StaffController {
  constructor(private readonly staffService: StaffService) {
  }

  @Get('')
  @ApiOperation({
    summary: 'Get all staff members',
    description:
      'Retrieves a filtered list of all staff members. Managers only see staff from their location. Super Admins, Admins, and Business Admins see all staff from their company. Results can be filtered by search term, location, and role.',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search term to filter staff by name or email (case-insensitive partial match)',
    example: 'john',
    type: String,
  })
  @ApiQuery({
    name: 'location_id',
    required: false,
    description: 'Location UUID to filter staff by specific location',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: String,
  })
  @ApiQuery({
    name: 'role',
    required: false,
    description: 'Filter staff by role',
    enum: UserRole,
    example: UserRole.MANAGER,
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved staff members',
    type: [GetStaffDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  async getStaffList(
    @Req() req: any,
    @Query('search') search?: string,
    @Query('location_id') location_id?: string,
    @Query('role') role?: UserRole,
  ) {
    return this.staffService.findAll(req, {
      search,
      location_id,
      role,
    });
  }

  @Get('count')
  @ApiOperation({
    summary: 'Get staff count statistics',
    description:
      'Retrieves count statistics of staff members grouped by role. Returns total count and counts for BUSINESS_ADMIN, MANAGER, and PROVIDER roles. Managers only see counts for their location. Super Admins, Admins, and Business Admins see counts for their entire company.',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved staff count statistics',
    type: [GetStaffCountDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  public getStaffCount(@Req() req: any) {
    return this.staffService.findCounts(req);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get staff member by ID',
    description:
      'Retrieves a specific staff member by their ID. Managers can only access staff from their location.',
  })
  @ApiParam({
    name: 'id',
    description: 'Staff member UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved staff member',
    type: GetStaffDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Staff member not found',
  })
  async getStaffById(@Param('id') id: string, @Req() req: any) {
    return this.staffService.findById(id, req);
  }

  @Post('')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new staff member',
    description:
      'Creates a new staff member. Super Admins, Admins, and Business Admins can create staff in any location. Managers can only create staff in their own location.',
  })
  @ApiBody({ type: CreateStaffDto })
  @ApiResponse({
    status: 201,
    description: 'Staff member successfully created',
    type: GetStaffDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Validation error or user already exists',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions or cannot assign this role',
  })
  async createStaff(@Body() dto: CreateStaffDto, @Req() req: any) {
    return this.staffService.createStaff(dto, req);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update staff member',
    description:
      'Updates an existing staff member. Super Admins, Admins, and Business Admins can change staff location. Managers cannot change staff location and can only update staff in their own location.',
  })
  @ApiParam({
    name: 'id',
    description: 'Staff member UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({ type: UpdateStaffDto })
  @ApiResponse({
    status: 200,
    description: 'Staff member successfully updated',
    type: GetStaffDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Validation error or user already exists',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions or cannot assign this role',
  })
  @ApiResponse({
    status: 404,
    description: 'Staff member not found',
  })
  async updateStaff(@Param('id') id: string, @Body() dto: UpdateStaffDto, @Req() req: any) {
    return this.staffService.updateStaff(id, dto, req);
  }

  @Delete('/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete staff member',
    description:
      'Deletes a staff member. Managers can only delete staff from their own location.',
  })
  @ApiParam({
    name: 'id',
    description: 'Staff member UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Staff member successfully deleted',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          example: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Staff member not found',
  })
  async deleteStaff(@Param('id') id: string, @Req() req: any) {
    return this.staffService.deleteStaff(id, req);
  }

  @Delete('/')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete multiple staff members',
    description:
      'Deletes multiple staff members by their IDs. Managers can only delete staff from their own location.',
  })
  @ApiQuery({
    name: 'ids',
    description: 'Array of staff member UUIDs',
    type: [String],
    example: ['123e4567-e89b-12d3-a456-426614174000', '223e4567-e89b-12d3-a456-426614174001'],
  })
  @ApiResponse({
    status: 200,
    description: 'Staff members successfully deleted',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          example: true,
        },
        deleted: {
          type: 'number',
          example: 2,
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Staff members not found',
  })
  async deleteBatchStaff(@Query('ids', ParseArrayPipe) ids: string[], @Req() req: any) {
    return this.staffService.deleteBatchStaff(ids, req);
  }
}
