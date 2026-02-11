import { Body, Controller, Get, HttpCode, HttpStatus, Post, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../../auth';
import { AccountService } from './account.service';
import { GetAccountDto } from './dto/get-account.dto';
import { UpdateAccountProfileDto } from './dto/update-account-profile.dto';
import { ChangePasswordRequestDto } from './dto/change-password-request.dto';
import { ChangePasswordResponseDto } from './dto/change-password-response.dto';
import { TfaChangeRequestDto } from './dto/tfa-change-request.dto';
import { TfaChangeResponseDto } from './dto/tfa-change-response.dto';
import { Confirm2FARequestDto } from './dto/confirm-2fa-request.dto';
import { Confirm2FAResponseDto } from './dto/confirm-2fa-response.dto';
import { Resend2FAResponseDto } from './dto/resend-2fa-response.dto';
import { JwtService } from '@nestjs/jwt';
import { CompanyTenantGuard } from '../../../../guards/company-tenant.guard';
import { Resend2FARequestDto } from './dto/resend-2fa-request.dto';
import { Request } from 'express';

@ApiTags('company account')
@Controller('api/account')
export class AccountController {
  constructor(
    private readonly accountService: AccountService,
    private readonly jwtService: JwtService,
  ) {
  }

  @Get('profile')
  @UseGuards(AuthGuard, CompanyTenantGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get account profile',
    description:
      'Retrieves account information',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieve data',
    type: GetAccountDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  getProfile(@Req() req) {
    return this.accountService.getProfile(req.userId);
  }

  @Put('profile')
  @UseGuards(AuthGuard, CompanyTenantGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update account profile',
    description:
      'Updates user account information (first name, last name, phone, email, logo). All fields are optional - only provided fields will be updated.',
  })
  @ApiBody({ type: UpdateAccountProfileDto })
  @ApiResponse({
    status: 200,
    description: 'Successfully updated account profile data',
    type: GetAccountDto,
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
    status: 404,
    description: 'User not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Phone number or email already in use',
  })
  updateProfile(@Body() dto: UpdateAccountProfileDto, @Req() req) {
    return this.accountService.updateProfile(dto, req.userId);
  }

  @Post('change-password')
  @UseGuards(AuthGuard, CompanyTenantGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'X-2FA-Token',
    description: '2FA token obtained from /account/2fa/confirm endpoint. Required only if user has 2FA enabled (EMAIL or PHONE mode).',
    required: false,
    schema: {
      type: 'string',
      example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    },
  })
  @ApiOperation({
    summary: 'Change user password',
    description:
      'Changes user password with the old password confirmation. Requires 2FA verification if user has 2FA enabled.',
  })
  @ApiBody({ type: ChangePasswordRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Successfully changed password',
    type: ChangePasswordResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: '2FA required - If user has 2FA enabled, X-2FA-Token header is required. If missing, a verification code will be sent.',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid old password or validation error',
  })
  changePassword(@Body() dto: ChangePasswordRequestDto, @Req() req: Request) {
    return this.accountService.changePassword(dto, req);
  }

  @Post('2fa')
  @UseGuards(AuthGuard, CompanyTenantGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Change user 2FA mode',
    description:
      'Changes user two-factor authentication mode. Options: INACTIVE (disable), EMAIL (code sent via email), or PHONE (code sent via SMS).',
  })
  @ApiBody({ type: TfaChangeRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Successfully changed 2FA mode',
    type: TfaChangeResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid mode or validation error',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  tfaModeChange(@Body() dto: TfaChangeRequestDto, @Req() req) {
    return this.accountService.changeTfaMode(dto, req.userId);
  }

  @Post('2fa/confirm')
  @UseGuards(AuthGuard, CompanyTenantGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Confirm 2FA verification code',
    description:
      'Verify the 6-digit code sent via email or SMS. Returns a 2FA token that must be included in the X-2FA-Token header for protected endpoints. Token expires in 5 minutes.',
  })
  @ApiBody({ type: Confirm2FARequestDto })
  @ApiResponse({
    status: 200,
    description: '2FA code verified successfully. Returns a 2FA token for use in X-2FA-Token header.',
    type: Confirm2FAResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid or expired verification code',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found or no pending verification code',
  })
  async confirm2FA(
    @Req() req,
    @Body() dto: Confirm2FARequestDto,
  ) {
    await this.accountService.verify2faCode(req.userId, dto.code, req);

    const token = this.jwtService.sign(
      { sub: req.userId, type: '2fa' },
      { expiresIn: '5m' },
    );

    return { twoFaToken: token };
  }

  @Post('2fa/resend')
  @UseGuards(AuthGuard, CompanyTenantGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Resend 2FA verification code',
    description:
      'Resends the 2FA verification code via email or SMS based on the user\'s current 2FA mode. Useful when the original code was not received or has expired. Code expires in 1 minute (email) or 3 minutes (SMS).',
  })
  @ApiBody({ type: Resend2FARequestDto })
  @ApiResponse({
    status: 200,
    description: '2FA code resent successfully',
    type: Resend2FAResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found or 2FA is not enabled',
  })
  async resend2FA(@Body() dto: Resend2FARequestDto, @Req() req) {
    await this.accountService.resend2faCode(req.userId, dto.method);

    return { success: true };
  }
}
