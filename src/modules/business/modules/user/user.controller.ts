import { Controller, Get, HttpCode, HttpStatus, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../../auth';
import { UserService } from './user.service';
import { GetCurrentUserDto } from './dto/get-current-user.dto';
import { CompanyTenantGuard } from '../../../../guards/company-tenant.guard';

@ApiTags('company user')
@Controller('api/user')
export class UserController {
  constructor(
    private readonly userService: UserService,
  ) {
  }

  @Get('current')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get current user',
    description:
      'Retrieves account information',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieve data',
    type: GetCurrentUserDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  getCurrent(@Req() req) {
    return this.userService.getCurrent(req.userId);
  }
}
