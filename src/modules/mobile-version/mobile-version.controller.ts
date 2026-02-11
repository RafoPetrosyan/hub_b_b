import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MobileVersionService } from './mobile-version.service';
import { CreateMobileVersionDto } from './dto/create-mobile-version.dto';
import { UpdateMobileVersionDto } from './dto/update-mobile-version.dto';
import { MobileVersionResponseDto } from './dto/get-mobile-version-response.dto';
import { GetLatestVersionResponseDto } from './dto/get-latest-version-response.dto';
import { AuthGuard, Roles, RolesGuard, UserRole } from '../auth';

@ApiTags('admin mobile-version')
@ApiBearerAuth('JWT-auth')
@Controller('api/admin/mobile-version')
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.BUSINESS_ADMIN)
export class MobileVersionAdminController {
  constructor(private readonly mobileVersionService: MobileVersionService) {
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create mobile version',
    description: 'Create a new mobile app version entry with version number, release date, force update flag, and release notes',
  })
  @ApiBody({ type: CreateMobileVersionDto })
  @ApiResponse({
    status: 201,
    description: 'Mobile version created successfully',
    type: MobileVersionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Version already exists or validation error',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions (Admin or Business Admin required)',
  })
  async create(@Body() dto: CreateMobileVersionDto) {
    return this.mobileVersionService.create(dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List all mobile versions',
    description: 'Get a list of all mobile app versions ordered by release date (newest first)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of mobile versions retrieved successfully',
    type: [MobileVersionResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions (Admin or Business Admin required)',
  })
  async list() {
    return this.mobileVersionService.findAll();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get mobile version by ID',
    description: 'Retrieve a specific mobile app version by its ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Mobile version UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Mobile version retrieved successfully',
    type: MobileVersionResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions (Admin or Business Admin required)',
  })
  @ApiResponse({
    status: 404,
    description: 'Mobile version not found',
  })
  async get(@Param('id', ParseUUIDPipe) id: string) {
    return this.mobileVersionService.findOne(id);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update mobile version',
    description: 'Update an existing mobile app version. All fields are optional - only provided fields will be updated.',
  })
  @ApiParam({
    name: 'id',
    description: 'Mobile version UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({ type: UpdateMobileVersionDto })
  @ApiResponse({
    status: 200,
    description: 'Mobile version updated successfully',
    type: MobileVersionResponseDto,
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
    description: 'Forbidden - Insufficient permissions (Admin or Business Admin required)',
  })
  @ApiResponse({
    status: 404,
    description: 'Mobile version not found',
  })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateMobileVersionDto) {
    return this.mobileVersionService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete mobile version',
    description: 'Delete a mobile app version by ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Mobile version UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 204,
    description: 'Mobile version deleted successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions (Admin or Business Admin required)',
  })
  @ApiResponse({
    status: 404,
    description: 'Mobile version not found',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.mobileVersionService.remove(id);
    return;
  }
}

@ApiTags('common mobile-version')
@Controller('api/mobile-version')
export class MobileVersionPublicController {
  constructor(private readonly mobileVersionService: MobileVersionService) {
  }

  @Get('')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get latest mobile version and newer versions',
    description: `Get the latest mobile app version and all versions newer than the current app version (if provided).

**Behavior:**
- Returns the latest version by release date
- If \`current_version\` is provided, also returns all versions newer than it
- If any version between \`current_version\` and \`latest\` has \`is_force=true\`, then \`latest.is_force\` will be set to \`true\`
- If \`current_version\` matches an existing version, comparison is done by release date
- If \`current_version\` doesn't match any version, semantic version comparison is used
- The \`newer\` array is sorted by release date (oldest first)

**Use cases:**
- Check if app update is available
- Determine if forced update is required
- Get list of versions to upgrade through`,
  })
  @ApiQuery({
    name: 'current_version',
    description: 'Current app version installed on the device (optional). If provided, the response will include all versions released after this version. Format: semantic versioning (e.g., "1.0.0")',
    required: false,
    example: '1.0.0',
  })
  @ApiResponse({
    status: 200,
    description: 'Latest mobile version and newer versions retrieved successfully',
    type: GetLatestVersionResponseDto,
  })
  async latest(@Query('current_version') current?: string) {
    return await this.mobileVersionService.getLatestAndNewer(current);
  }
}
