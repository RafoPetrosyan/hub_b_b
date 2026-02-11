import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { plainToClass } from 'class-transformer';
import { User } from '../../../user/entities/user.entity';
import Helpers from '../../../../../../utils/helpers';
import { GetUserDto } from '../../../user/dto/get-user.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { LoginRequestDto } from './dto/login-request.dto';
import { ForgetPasswordRequestDto } from './dto/forget-password-request.dto';
import { ForgetPasswordResponseDto } from './dto/forget-password-response.dto';
import { VerifyForgetPasswordRequestDto } from './dto/verify-forget-password-request.dto';
import { VerifyForgetPasswordResponseDto } from './dto/verify-forget-password-response.dto';
import { ResetPasswordRequestDto } from './dto/reset-password-request.dto';
import { ResetPasswordResponseDto } from './dto/reset-password-response.dto';
import { EmailService } from '../../../../../common/modules/notify/email.service';
import { SmsService } from '../../../../../common/modules/notify/sms.service';
import { InjectRepository } from '@nestjs/typeorm';
import { VerificationCode } from '../../../verification-code/entities/verification-code.entity';
import { PasswordReset } from '../../../../../common/modules/password-reset/entities/password-reset.entity';
import { UserToken } from '../../../user-token/entities/user-token.entity';
import { Request } from 'express';
import { getDeviceType, getIpAddress } from '../../../../../../utils/request-helpers';
import { UserStatusEnum } from '../../../user/enum/user-status.enum';
import { Login2FAConfirmDto } from './dto/login-2fa-confirm.dto';
import { Onboarding } from '../../../onboarding/entities/onboarding.entity';
import { GetOnboardingDto } from '../../../onboarding/dto/get-onboarding.dto';

@Injectable()
export class CompanyLoginService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(VerificationCode)
    private readonly verificationCodeRepository: Repository<VerificationCode>,
    @InjectRepository(PasswordReset)
    private readonly passwordResetRepository: Repository<PasswordReset>,
    @InjectRepository(UserToken)
    private readonly userTokenRepository: Repository<UserToken>,
    private readonly jwtService: JwtService,
    private dataSource: DataSource,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
  ) {
  }

  /**
   * Authorize user if username and password combination is correct
   */
  async login(
    dto: LoginRequestDto,
    request?: Request,
  ): Promise<LoginResponseDto> {
    return this.dataSource.transaction(async (tx) => {
      const { username, password } = dto;
      const userRepository = tx.getRepository(User);
      const userTokenRepository = tx.getRepository(UserToken);
      const onboardingRepository = tx.getRepository(Onboarding);

      const user = await userRepository
        .createQueryBuilder('user')
        .where('user.email = :username OR user.phone = :username', {
          username,
        })
        .leftJoinAndSelect('user.company', 'company')
        .leftJoinAndSelect('user.onboardings', 'onboardings')
        .getOne();

      if (!user) {
        throw new NotFoundException('Incorrect credentials');
      }

      const isSamePassword = await Helpers.comparePassword(
        password,
        user.password_hash,
      );

      if (!isSamePassword) {
        throw new NotFoundException('Incorrect credentials');
      }

      const ipAddress = request ? getIpAddress(request) : undefined;
      const deviceType = request
        ? getDeviceType(request.headers['user-agent'])
        : undefined;

      const verificationCodeRepository = this.verificationCodeRepository;
      const code = dto.code;

      if (user.tfa_mode) {
        if (!code) {
          let verificationCode = Math.floor(
            100000 + Math.random() * 900000,
          ).toString();
          verificationCode = '111111';

          const expiryDate = new Date();
          const timeoutMinutes = this.emailService.getCodeTimeoutMinutes();
          expiryDate.setMinutes(expiryDate.getMinutes() + timeoutMinutes);

          const verificationCodeEntity = verificationCodeRepository.create({
            user_id: user.id,
            code: verificationCode,
            method: 'email',
            expires_at: expiryDate,
            is_used: false,
          });
          await verificationCodeRepository.save(verificationCodeEntity);

          await this.emailService.sendVerificationCode(
            user.email,
            verificationCode,
          );

          throw new BadRequestException({
            code: '2FA_REQUIRED',
            message: 'Two-factor authentication required',
            user_id: user.id,
          });
        }

        const codeRecord = await verificationCodeRepository.findOne({
          where: {
            user_id: user.id,
            code: code,
            is_used: false,
            method: 'email',
          },
          order: { created_at: 'DESC' },
        });

        if (!codeRecord || codeRecord.expires_at < new Date()) {
          throw new BadRequestException('Invalid or expired verification code');
        }

        codeRecord.is_used = true;
        await verificationCodeRepository.save(codeRecord);
      }

      const { accessToken, refreshToken } = await this.createTokens(
        user.id,
        user.role,
        user.tfa_mode,
        user.company_id,
        user.location_id,
        ipAddress,
        deviceType,
        userTokenRepository,
      );
      const dashboardUrl = user.company && user.company?.subdomain
        ? `https://${user.company?.subdomain}.beautyhub.com/dashboard`
        : undefined;

      const result = {
        user: plainToClass(GetUserDto, user, {
          excludeExtraneousValues: true,
        }),
        subdomain: user.company?.subdomain ?? undefined,
        dashboardUrl,
        accessToken,
        refreshToken,
      }

      const onboardings = user.onboardings ?? [];

      if (
        (!user.company &&
        onboardings?.length === 0) ||
        (onboardings?.length <= 1 && onboardings?.[0]?.completed === false)
      ) {
        const onboarding = onboardings[0] ?? null;

        if (onboarding) {
          result['onboarding'] = plainToClass(GetOnboardingDto, onboarding, {
            excludeExtraneousValues: true,
          });
        } else {
          result['onboarding'] = {
            currentStep: 1,
          }
        }
      }

      return result;
    });
  }

  /**
   * Sends a 6-digit verification code to the user's email if the username exists
   */
  async forgetPassword(
    dto: ForgetPasswordRequestDto,
  ): Promise<ForgetPasswordResponseDto> {
    return this.dataSource.transaction(async (tx) => {
      const { username } = dto;
      const userRepository = tx.getRepository(User);
      const verificationCodeRepository = tx.getRepository(VerificationCode);

      const user = await userRepository
        .createQueryBuilder('user')
        .where('user.email = :username OR user.phone = :username', {
          username,
        })
        .getOne();

      const response: ForgetPasswordResponseDto = {
        success: true,
        message:
          'Verification code has been sent if this email address exists in system',
      };

      if (user && user.email) {
        let verificationCode = Math.floor(
          100000 + Math.random() * 900000,
        ).toString();
        verificationCode = '111111';

        const expiryDate = new Date();
        // Use email timeout (1 minute) for password reset
        expiryDate.setMinutes(expiryDate.getMinutes() + this.emailService.getCodeTimeoutMinutes());

        const verificationCodeEntity = verificationCodeRepository.create({
          user_id: user.id,
          code: verificationCode,
          method: 'email',
          expires_at: expiryDate,
          is_used: false,
        });
        await verificationCodeRepository.save(verificationCodeEntity);

        await this.emailService.sendVerificationCode(
          user.email,
          verificationCode,
        );
      }

      return response;
    });
  }

  /**
   * Verifies the code sent to user's email and returns a reset token
   */
  async verifyForgetPasswordCode(
    dto: VerifyForgetPasswordRequestDto,
  ): Promise<VerifyForgetPasswordResponseDto> {
    return this.dataSource.transaction(async (tx) => {
      const { username, code } = dto;
      const userRepository = tx.getRepository(User);
      const verificationCodeRepository = tx.getRepository(VerificationCode);
      const passwordResetRepository = tx.getRepository(PasswordReset);

      const user = await userRepository
        .createQueryBuilder('user')
        .where('user.email = :username OR user.phone = :username', {
          username,
        })
        .getOne();

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const verificationCode = await verificationCodeRepository.findOne({
        where: {
          user_id: user.id,
          code,
          is_used: false,
        },
        order: { created_at: 'DESC' },
      });

      if (!verificationCode) {
        throw new BadRequestException(
          'No verification code found. Please request a new code.',
        );
      }

      if (verificationCode.expires_at < new Date()) {
        throw new BadRequestException(
          'Verification code has expired. Please request a new code.',
        );
      }

      verificationCode.is_used = true;
      await verificationCodeRepository.save(verificationCode);

      const resetToken = this.jwtService.sign(
        {
          id: user.id,
          type: 'password_reset',
        },
        {
          expiresIn: '15h',
        },
      );

      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15);

      const passwordReset = passwordResetRepository.create({
        user_id: user.id,
        token: resetToken,
        expires_at: expiresAt,
        is_used: false,
      });
      await passwordResetRepository.save(passwordReset);

      return {
        resetToken,
      };
    });
  }

  /**
   * Resets the user's password using the reset token
   */
  async resetPassword(
    dto: ResetPasswordRequestDto,
  ): Promise<ResetPasswordResponseDto> {
    return this.dataSource.transaction(async (tx) => {
      const { resetToken, password } = dto;
      const userRepository = tx.getRepository(User);
      const passwordResetRepository = tx.getRepository(PasswordReset);

      let decoded: any;
      try {
        decoded = this.jwtService.verify(resetToken);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        throw new UnauthorizedException('Invalid or expired reset token');
      }

      if (decoded.type !== 'password_reset') {
        throw new UnauthorizedException('Invalid reset token');
      }

      const passwordReset = await passwordResetRepository.findOne({
        where: {
          token: resetToken,
          is_used: false,
        },
      });

      if (!passwordReset) {
        throw new UnauthorizedException('Invalid or already used reset token');
      }

      if (passwordReset.expires_at < new Date()) {
        throw new UnauthorizedException('Reset token has expired');
      }

      const user = await userRepository.findOne({
        where: { id: decoded.id },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      user.password_hash = await Helpers.hashPassword(password);
      await userRepository.save(user);

      passwordReset.is_used = true;
      await passwordResetRepository.save(passwordReset);

      return {
        success: true,
        message: 'Password reset successfully',
      };
    });
  }

  /**
   * Logs out user by revoking their tokens
   */
  async logout(token: string): Promise<{ message: string }> {
    return this.dataSource.transaction(async (tx) => {
      const userTokenRepository = tx.getRepository(UserToken);

      // Verify and decode the token
      let decoded: any;
      try {
        decoded = this.jwtService.verify(token);
      } catch (error) {
        throw new UnauthorizedException('Invalid token');
      }

      // Find the access token in database
      const accessToken = await userTokenRepository.findOne({
        where: {
          token,
          type: 'access',
          is_revoked: false,
        },
      });

      if (!accessToken) {
        // Token might already be revoked or not found, but we'll still return success
        return { message: 'Logged out successfully' };
      }

      // Revoke the access token
      accessToken.is_revoked = true;
      await userTokenRepository.save(accessToken);

      // Find and revoke the associated refresh token
      // Look for refresh token with same user, IP, and device type, created around the same time
      const refreshToken = await userTokenRepository.findOne({
        where: {
          user_id: accessToken.user_id,
          type: 'refresh',
          is_revoked: false,
          ip_address: accessToken.ip_address,
          device_type: accessToken.device_type,
        },
        order: { created_at: 'DESC' },
      });

      if (refreshToken) {
        // Check if refresh token was created within 1 minute of access token (same session)
        const timeDiff = Math.abs(
          refreshToken.created_at.getTime() - accessToken.created_at.getTime(),
        );
        if (timeDiff < 60000) {
          // Within 1 minute
          refreshToken.is_revoked = true;
          await userTokenRepository.save(refreshToken);
        }
      }

      return { message: 'Logged out successfully' };
    });
  }

  /**
   * Confirm 2FA code during login (for unauthorized users)
   */
  async confirmLogin2FA(
    dto: Login2FAConfirmDto,
    request?: Request,
  ): Promise<LoginResponseDto> {
    return this.dataSource.transaction(async (tx) => {
      const { user_id, code } = dto;
      const userRepository = tx.getRepository(User);
      const verificationCodeRepository = tx.getRepository(VerificationCode);
      const userTokenRepository = tx.getRepository(UserToken);

      const user = await userRepository.findOne({ where: { id: user_id }, relations: ['company'] });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (!user.tfa_mode) {
        throw new BadRequestException('2FA is not enabled for this user');
      }

      const codeRecord = await verificationCodeRepository.findOne({
        where: {
          user_id: user.id,
          code: code,
          is_used: false,
          method: dto.method,
        },
        order: { created_at: 'DESC' },
      });

      if (!codeRecord || codeRecord.expires_at < new Date()) {
        throw new BadRequestException('Invalid or expired verification code');
      }

      codeRecord.is_used = true;
      await verificationCodeRepository.save(codeRecord);

      const ipAddress = request ? getIpAddress(request) : undefined;
      const deviceType = request
        ? getDeviceType(request.headers['user-agent'])
        : undefined;

      const { accessToken, refreshToken } = await this.createTokens(
        user.id,
        user.role,
        user.tfa_mode,
        user.company_id,
        user.location_id,
        ipAddress,
        deviceType,
        userTokenRepository,
      );

      const dashboardUrl = user.company
        ? `https://${user.company.subdomain}.beautyhub.com/dashboard`
        : 'https://beautyhub.com/dashboard';

      return {
        user: plainToClass(GetUserDto, user, {
          excludeExtraneousValues: true,
        }),
        dashboardUrl,
        subdomain: user.company.subdomain,
        accessToken,
        refreshToken,
      };
    });
  }

  /**
   * Resend 2FA code during login (for unauthorized users)
   */
  async resendLogin2FA(dto: { user_id: string, method: 'email' | 'phone' }, request?: Request): Promise<{
    success: boolean
  }> {
    return this.dataSource.transaction(async (tx) => {
      const { user_id } = dto;
      const userRepository = tx.getRepository(User);
      const verificationCodeRepository = tx.getRepository(VerificationCode);

      const user = await userRepository.findOneBy({ id: user_id });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (!user.tfa_mode) {
        throw new BadRequestException('2FA is not enabled for this user');
      }

      let verificationCode = Math.floor(
        100000 + Math.random() * 900000,
      ).toString();
      verificationCode = '111111';

      const expiryDate = new Date();
      // Use method-specific timeout: 1 minute for email, 3 minutes for SMS
      const timeoutMinutes = dto.method === 'email'
        ? this.emailService.getCodeTimeoutMinutes()
        : this.smsService.getCodeTimeoutMinutes();
      expiryDate.setMinutes(expiryDate.getMinutes() + timeoutMinutes);

      const verificationCodeEntity = verificationCodeRepository.create({
        user_id: user.id,
        code: verificationCode,
        method: dto.method,
        expires_at: expiryDate,
        is_used: false,
      });
      await verificationCodeRepository.save(verificationCodeEntity);

      if (dto.method === 'email') {
        await this.emailService.sendVerificationCode(
          user.email,
          verificationCode,
        );
      } else if (dto.method === 'phone') {
        if (!user.phone) {
          throw new BadRequestException('User does not have phone number');
        }
        await this.smsService.sendVerificationCode(
          user.phone,
          verificationCode,
        );
      }

      return { success: true };
    });
  }

  /**
   * Creates access and refresh tokens and stores them in database
   */
  private async createTokens(
    userId: string | number,
    role: string,
    tfa_mode: boolean,
    company_id: string,
    location_id: string,
    ipAddress: string | undefined,
    deviceType: string | undefined,
    userTokenRepository: Repository<UserToken>,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = {
      id: userId,
      role,
      tfa: tfa_mode,
      company_id,
      location_id,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15h',
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
    });

    const now = new Date();
    const accessTokenExpiry = new Date(now.getTime() + 15 * 60 * 60 * 1000); // 15 hours
    const refreshTokenExpiry = new Date(
      now.getTime() + 7 * 24 * 60 * 60 * 1000,
    ); // 7 days

    const accessTokenEntity = userTokenRepository.create({
      user_id: String(userId),
      token: accessToken,
      type: 'access',
      expires_at: accessTokenExpiry,
      is_revoked: false,
      ip_address: ipAddress,
      device_type: deviceType,
    });
    await userTokenRepository.save(accessTokenEntity);

    const refreshTokenEntity = userTokenRepository.create({
      user_id: String(userId),
      token: refreshToken,
      type: 'refresh',
      expires_at: refreshTokenExpiry,
      is_revoked: false,
      ip_address: ipAddress,
      device_type: deviceType,
    });
    await userTokenRepository.save(refreshTokenEntity);

    return { accessToken, refreshToken };
  }
}
