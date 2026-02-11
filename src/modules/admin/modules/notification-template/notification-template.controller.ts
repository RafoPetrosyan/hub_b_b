import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard, Roles, RolesGuard, UserRole } from '../../../auth';
import { NotificationTemplateService } from './notification-template.service';
import { UpdateNotificationTemplateDto } from './dto/update-notification-template.dto';
import { CreateNotificationTemplateDto } from './dto/create-notification-template.dto';
import {
  GetNotificationTemplateDto,
  GetNotificationVariableDto,
} from '../../../business/modules/notification-template/dto/get-notification-template.dto';
import { AssignVariableToTypeDto } from './dto/assign-variable-to-type.dto';
import { NotificationType } from '../../../business/modules/notification-template/enum/notification-type.enum';

@ApiTags('admin notification-templates')
@ApiBearerAuth('JWT-auth')
@Controller('api/admin/notification-templates')
export class NotificationTemplateController {
  constructor(
    private readonly notificationTemplateService: NotificationTemplateService,
  ) {
  }

  @Get()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({
    summary: 'List all base notification templates',
    description:
      'Retrieves all base notification templates (admin only). These templates are used as defaults for all companies.',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved notification templates',
    type: [GetNotificationTemplateDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  list() {
    return this.notificationTemplateService.list();
  }

  @Get('types')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  listTypes() {
    return this.notificationTemplateService.listTypes();
  }

  @Get(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get base notification template by ID',
    description:
      'Retrieves a specific base notification template with its variables (admin only).',
  })
  @ApiParam({
    name: 'id',
    description: 'Template unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved notification template',
    type: GetNotificationTemplateDto,
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
    description: 'Template not found',
  })
  get(@Param('id') id: string) {
    return this.notificationTemplateService.getOne(id);
  }

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new base notification template',
    description:
      'Creates a new base notification template (admin only). The template type must be unique.',
  })
  @ApiBody({ type: CreateNotificationTemplateDto })
  @ApiResponse({
    status: 201,
    description: 'Successfully created notification template',
    type: GetNotificationTemplateDto,
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
  @ApiResponse({
    status: 409,
    description: 'Conflict - Template type already exists',
  })
  create(@Body() dto: CreateNotificationTemplateDto, @Req() req) {
    return this.notificationTemplateService.create(dto, req.userId);
  }

  @Put(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update base notification template',
    description: 'Updates an existing base notification template (admin only).',
  })
  @ApiParam({
    name: 'id',
    description: 'Template unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({ type: UpdateNotificationTemplateDto })
  @ApiResponse({
    status: 200,
    description: 'Successfully updated notification template',
    type: GetNotificationTemplateDto,
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
  @ApiResponse({
    status: 404,
    description: 'Template not found',
  })
  update(@Param('id') id: string, @Body() dto: UpdateNotificationTemplateDto) {
    return this.notificationTemplateService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete base notification template',
    description: 'Soft deletes a base notification template (admin only).',
  })
  @ApiParam({
    name: 'id',
    description: 'Template unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully deleted notification template',
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
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Template not found',
  })
  delete(@Param('id') id: string) {
    return this.notificationTemplateService.remove(id);
  }

  @Post('assign')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Assign variable to notification type',
    description:
      'Assigns a notification variable to a specific notification type (admin only).',
  })
  @ApiBody({ type: AssignVariableToTypeDto })
  @ApiResponse({
    status: 200,
    description: 'Successfully assigned variable to type',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'assigned' },
        variable: { $ref: '#/components/schemas/GetNotificationVariableDto' },
        type: { $ref: '#/components/schemas/NotificationType' },
      },
    },
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
  @ApiResponse({
    status: 404,
    description: 'Variable or notification type not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Variable already assigned to this type',
  })
  assignToType(@Body() dto: AssignVariableToTypeDto) {
    return this.notificationTemplateService.assignVariableToType(
      dto.variableId,
      dto.type,
    );
  }

  @Post('unassign')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Unassign variable from notification type',
    description:
      'Removes a notification variable from a specific notification type (admin only).',
  })
  @ApiBody({ type: AssignVariableToTypeDto })
  @ApiResponse({
    status: 200,
    description: 'Successfully unassigned variable from type',
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          example: 'unassigned',
        },
      },
    },
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
  @ApiResponse({
    status: 404,
    description: 'Variable, notification type, or assignment not found',
  })
  unassignFromType(@Body() dto: AssignVariableToTypeDto) {
    return this.notificationTemplateService.unassignVariableFromType(
      dto.variableId,
      dto.type,
    );
  }

  @Get('variables/by-type')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({
    summary: 'List notification variables by type',
    description:
      'Retrieves all notification variables available for a specific notification type (admin only).',
  })
  @ApiQuery({
    name: 'type',
    description: 'Notification type key',
    enum: NotificationType,
    example: NotificationType.USER_WELCOME,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved notification variables',
    type: [GetNotificationVariableDto],
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid notification type',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  listByType(@Query('type') type: NotificationType) {
    return this.notificationTemplateService.listVariablesByType(type);
  }
}
