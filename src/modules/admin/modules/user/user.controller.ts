import { Controller, Get, HttpCode, HttpStatus, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { GetCurrentAdminDto } from './dto/get-current-admin.dto';
import { AuthGuard, Roles, RolesGuard, UserRole } from '../../../auth';

@ApiTags('admin user')
@Controller('api/admin/user')
export class UserController {
  constructor(
    private readonly userService: UserService,
  ) {
  }

  @Get('current')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get current admin',
    description:
      'Retrieves account information',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieve data',
    type: GetCurrentAdminDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  getCurrent(@Req() req) {
    return this.userService.getCurrent(req.userId);
  }
}
