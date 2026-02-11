import { Body, Controller, HttpCode, HttpStatus, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInUserDto } from './dto/sign-in-user.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LogoutResponseDto } from './dto/logout-response.dto';
import { Login2FAConfirmDto } from './dto/login-2fa-confirm.dto';
import { AuthLogin2faResendDto } from './dto/auth-login-2fa-resend.dto';
import { AuthGuard } from './auth.guard';

@ApiTags('admin auth')
@Controller('api/admin/auth')
export class AuthController {
  constructor(private authService: AuthService) {
  }

  @Post('sign-in')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sign in user',
    description: 'Authenticate user with email and password. If 2FA is enabled, returns 2FA_REQUIRED error with user_id. Use /api/admin/auth/2fa/confirm to complete login.',
  })
  @ApiBody({ type: SignInUserDto })
  @ApiResponse({
    status: 200,
    description: 'User successfully authenticated',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '2FA required - If user has 2FA enabled, returns error with user_id. Invalid email or password.',
  })
  signIn(@Body() signInDto: SignInUserDto, @Request() req: any) {
    return this.authService.signIn(signInDto, req);
  }

  @Post('sign-up')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sign up new user',
    description: 'Register a new user account',
  })
  @ApiBody({ type: SignUpDto })
  @ApiResponse({
    status: 200,
    description: 'User successfully registered',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Email is already in use',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
  })
  signUp(@Body() signUpDto: SignUpDto, @Request() req: any) {
    return this.authService.signUp(signUpDto, req);
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Logout user',
    description:
      'Revokes access and refresh tokens, preventing their future use',
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
    return this.authService.logout(token);
  }

  @Post('2fa/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Confirm 2FA code for login',
    description: 'Verify the 2FA code sent during login. Returns access and refresh tokens upon successful verification. Used when sign-in endpoint returns 2FA_REQUIRED error.',
  })
  @ApiBody({ type: Login2FAConfirmDto })
  @ApiResponse({
    status: 200,
    description: '2FA code verified successfully. User logged in.',
    type: AuthResponseDto,
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
    return this.authService.confirmLogin2FA(dto, req);
  }

  @Post('2fa/resend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resend 2FA code for login',
    description: 'Resends the 2FA verification code via email or SMS based on user\'s 2FA mode. Used when the original code was not received or has expired.',
  })
  @ApiBody({ type: AuthLogin2faResendDto })
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
  resendLogin2FA(@Body() dto: AuthLogin2faResendDto, @Request() req: any) {
    return this.authService.resendLogin2FA(dto, req);
  }

  private extractTokenFromHeader(request: any): string {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
