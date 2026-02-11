import { Body, Controller, HttpCode, HttpStatus, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CompanyLoginService } from './company-login.service';
import { LoginRequestDto } from './dto/login-request.dto';
import { ForgetPasswordRequestDto } from './dto/forget-password-request.dto';
import { VerifyForgetPasswordRequestDto } from './dto/verify-forget-password-request.dto';
import { ResetPasswordRequestDto } from './dto/reset-password-request.dto';
import { LogoutResponseDto } from './dto/logout-response.dto';
import { Login2FAConfirmDto } from './dto/login-2fa-confirm.dto';
import { Login2FAResendDto } from './dto/login-2fa-resend.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { AuthGuard } from '../../../../../auth';

@ApiTags('company login')
@Controller('api/login')
export class CompanyLoginController {
  constructor(private companyLoginService: CompanyLoginService) {
  }

  @Post('')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login user',
    description: 'Authenticate user with username (email or phone) and password. If 2FA is enabled, returns 2FA_REQUIRED error with user_id. Use /api/login/2fa/confirm to complete login.',
  })
  @ApiBody({ type: LoginRequestDto })
  @ApiResponse({
    status: 200,
    description: 'User successfully authenticated',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '2FA required - If user has 2FA enabled, returns error with user_id. Invalid credentials or validation error.',
  })
  login(@Body() requestDto: LoginRequestDto, @Request() req: any) {
    return this.companyLoginService.login(requestDto, req);
  }

  @Post('forget-password')
  @HttpCode(HttpStatus.OK)
  forgetPassword(@Body() requestDto: ForgetPasswordRequestDto) {
    return this.companyLoginService.forgetPassword(requestDto);
  }

  @Post('forget-password/verify')
  @HttpCode(HttpStatus.OK)
  forgetPasswordVerifyCode(@Body() requestDto: VerifyForgetPasswordRequestDto) {
    return this.companyLoginService.verifyForgetPasswordCode(requestDto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() requestDto: ResetPasswordRequestDto) {
    return this.companyLoginService.resetPassword(requestDto);
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Logout user',
    description: 'Revokes access and refresh tokens, preventing their future use',
  })
  @ApiResponse({
    status: 200,
    description: 'User successfully logged out',
    type: LogoutResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  logout(@Request() req: any) {
    const token = this.extractTokenFromHeader(req);
    return this.companyLoginService.logout(token);
  }

  @Post('2fa/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Confirm 2FA code for login',
    description: 'Verify the 2FA code sent during login. Returns access and refresh tokens upon successful verification. Used when login endpoint returns 2FA_REQUIRED error.',
  })
  @ApiBody({ type: Login2FAConfirmDto })
  @ApiResponse({
    status: 200,
    description: '2FA code verified successfully. User logged in.',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired verification code, or 2FA not enabled',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  confirmLogin2FA(@Body() dto: Login2FAConfirmDto, @Request() req: any) {
    return this.companyLoginService.confirmLogin2FA(dto, req);
  }

  @Post('2fa/resend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resend 2FA code for login',
    description: 'Resends the 2FA verification code via email or SMS based on user\'s 2FA mode. Used when the original code was not received or has expired.',
  })
  @ApiBody({ type: Login2FAResendDto })
  @ApiResponse({
    status: 200,
    description: '2FA code resent successfully',
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
    status: 400,
    description: '2FA is not enabled for this user',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  resendLogin2FA(@Body() dto: Login2FAResendDto, @Request() req: any) {
    return this.companyLoginService.resendLogin2FA(dto, req);
  }

  private extractTokenFromHeader(request: any): string {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
