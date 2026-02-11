import { Body, Controller, Get, HttpCode, HttpStatus, Param, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { NotificationTemplateService } from './notification-template.service';
import { UpdateCompanyNotificationTemplateDto } from './dto/update-company-notification-template.dto';
import { AuthGuard, Roles, RolesGuard, UserRole } from '../../../auth';
import { GetCompanyNotificationTemplateDto, GetNotificationVariableDto } from './dto/get-notification-template.dto';
import { NotificationType } from './enum/notification-type.enum';

@ApiTags('company notification-templates')
@ApiBearerAuth('JWT-auth')
@Controller('api/company/notification-templates')
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.BUSINESS_ADMIN)
export class NotificationTemplateController {
  constructor(
    private readonly notificationTemplateService: NotificationTemplateService,
  ) {
  }

  @Get()
  @ApiOperation({
    summary: 'List all notification templates for company',
    description:
      'Retrieves all notification templates available for the company, including customized templates.',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved notification templates',
    type: [GetCompanyNotificationTemplateDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  async list(@Req() req) {
    return this.notificationTemplateService.listForCompany(
      req.userId,
      req.userCompany,
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get notification template by ID',
    description:
      'Retrieves a specific notification template with its variables. Returns company customization if exists, otherwise returns base template.',
  })
  @ApiParam({
    name: 'id',
    description: 'Template unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved notification template',
    type: GetCompanyNotificationTemplateDto,
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
  async getOne(@Param('id') id: string, @Req() req) {
    return this.notificationTemplateService.getForCompany(id, req.userCompany);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update company notification template',
    description:
      'Creates or updates a company-specific customization of a base notification template. Variables used in the body must be defined in the base template.',
  })
  @ApiParam({
    name: 'id',
    description: 'Base template unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({ type: UpdateCompanyNotificationTemplateDto })
  @ApiResponse({
    status: 200,
    description: 'Successfully updated company template',
    type: GetCompanyNotificationTemplateDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Validation error or invalid variables used',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions or variable not allowed',
  })
  @ApiResponse({
    status: 404,
    description: 'Base template not found',
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCompanyNotificationTemplateDto,
    @Req() req,
  ) {
    return this.notificationTemplateService.updateCompanyTemplate(
      id,
      req.userCompany,
      req.userId,
      dto,
    );
  }

  @Put(':id/reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset template to base version',
    description:
      'Removes company-specific customization and reverts the template to the base version.',
  })
  @ApiParam({
    name: 'id',
    description: 'Company template unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully reset template to base version',
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          example: 'reset',
        },
        message: {
          type: 'string',
          example: 'Template reset to base version',
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
    description: 'Company template not found',
  })
  async resetToBase(@Param('id') id: string, @Req() req) {
    return this.notificationTemplateService.resetToBase(id, req.userCompany);
  }

  @Get('variables/:type')
  @ApiOperation({
    summary: 'List notification variables by type',
    description:
      'Retrieves all notification variables available for a specific notification type.',
  })
  @ApiParam({
    name: 'type',
    description: 'Notification type key',
    enum: NotificationType,
    example: NotificationType.USER_WELCOME,
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
  listVariablesByType(@Param('type') type: NotificationType) {
    return this.notificationTemplateService.listVariablesByType(type);
  }
}
