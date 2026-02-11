import { Body, Controller, Get, HttpCode, HttpStatus, Param, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { NotificationSettingsService } from './notification-settings.service';
import { UpdateNotificationSettingDto } from './dto/update-notification-setting.dto';
import { UpdateMasterDto } from './dto/update-master.dto';
import { UpdateGlobalDto } from './dto/update-global.dto';
import { GetNotificationSettingsResponseDto } from './dto/get-notification-settings-response.dto';
import { UpdateNotificationSettingResponseDto } from './dto/update-notification-setting-response.dto';
import { UpdateMasterResponseDto } from './dto/update-master-response.dto';
import { UpdateGlobalResponseDto } from './dto/update-global-response.dto';
import { NotificationCategoryListItemDto } from './dto/list-notifications-response.dto';
import { AuthGuard } from '../../../auth';
import { CompanyTenantGuard } from '../../../../guards/company-tenant.guard';

@ApiTags('company notification-settings')
@ApiBearerAuth('JWT-auth')
@Controller('api/notification-settings')
@UseGuards(AuthGuard, CompanyTenantGuard)
export class NotificationSettingsController {
  constructor(private readonly notificationSettingsService: NotificationSettingsService) {
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get user notification settings',
    description: 'Returns grouped notifications with user-specific per-notification settings and master settings',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification settings retrieved successfully',
    type: GetNotificationSettingsResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  async getSettings(@Req() req: any) {
    const userId = req.userId;
    return this.notificationSettingsService.getSettingsForUser(userId);
  }

  @Put('notification/:alias')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update notification setting',
    description: 'Update email, phone, or push notification preferences for a specific notification type by alias',
  })
  @ApiParam({
    name: 'alias',
    description: 'Notification alias/slug (e.g., "new-appointment")',
    example: 'new-appointment',
  })
  @ApiBody({ type: UpdateNotificationSettingDto })
  @ApiResponse({
    status: 200,
    description: 'Notification setting updated successfully',
    type: UpdateNotificationSettingResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 404,
    description: 'Notification not found',
  })
  async updateNotification(
    @Req() req: any,
    @Param('alias') alias: string,
    @Body() dto: UpdateNotificationSettingDto,
  ) {
    const userId = req.userId;
    return this.notificationSettingsService.updateNotificationSetting(userId, alias, dto);
  }

  @Put('master')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update master notification toggle',
    description: 'Enable or disable all notifications with a master toggle. This does not change individual notification settings.',
  })
  @ApiBody({ type: UpdateMasterDto })
  @ApiResponse({
    status: 200,
    description: 'Master toggle updated successfully',
    type: UpdateMasterResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  async updateMaster(@Req() req: any, @Body() dto: UpdateMasterDto) {
    const userId = req.userId;
    return this.notificationSettingsService.updateMaster(userId, dto);
  }

  @Put('global')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update global notification settings',
    description: 'Update global settings including digest frequency (off, hourly, daily, weekly) and quiet hours when notifications should not be sent',
  })
  @ApiBody({ type: UpdateGlobalDto })
  @ApiResponse({
    status: 200,
    description: 'Global settings updated successfully',
    type: UpdateGlobalResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid digest frequency or quiet hours format',
  })
  async updateGlobal(@Req() req: any, @Body() dto: UpdateGlobalDto) {
    const userId = req.userId;
    return this.notificationSettingsService.updateGlobal(userId, dto);
  }

  @Get('list')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List all notifications',
    description: 'Get a list of all available notifications grouped by category without user-specific settings. Useful for displaying available notification types.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of notifications retrieved successfully',
    type: [NotificationCategoryListItemDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  async listAll() {
    return this.notificationSettingsService.listAllNotificationsGrouped();
  }
}
