import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { plainToClass } from 'class-transformer';
import { User } from '../business/modules/user/entities/user.entity';
import Helpers from '../../utils/helpers';
import { GetUserDto } from '../business/modules/user/dto/get-user.dto';
import { SignInUserDto } from './dto/sign-in-user.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { UserToken } from '../business/modules/user-token/entities/user-token.entity';
import { Request } from 'express';
import { getDeviceType, getIpAddress } from '../../utils/request-helpers';
import { EmailService } from '../common/modules/notify/email.service';
import { SmsService } from '../common/modules/notify/sms.service';
import { VerificationCode } from '../business/modules/verification-code/entities/verification-code.entity';
import { Login2FAConfirmDto } from './dto/login-2fa-confirm.dto';
import { AuthLogin2faResendDto } from './dto/auth-login-2fa-resend.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserToken)
    private readonly userTokenRepository: Repository<UserToken>,
    @InjectRepository(VerificationCode)
    private readonly verificationCodeRepository: Repository<VerificationCode>,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
    private readonly dataSource: DataSource,
  ) {
  }

  async signUp(createUserDto: SignUpDto, request?: Request) {
    const { first_name, last_name, email, password } = createUserDto;

    const existingUser = await this.userRepository
      .createQueryBuilder('user')
      .where('user.email = :email', { email })
      .getOne();
    if (existingUser) {
      throw new ConflictException('Email is already in use');
    }

    const hashPassword = await Helpers.hashPassword(password);
    const newUser = this.userRepository.create({
      first_name,
      last_name,
      email,
      password_hash: hashPassword,
    });

    await this.userRepository.save(newUser);

    const ipAddress = request ? getIpAddress(request) : undefined;
    const deviceType = request
      ? getDeviceType(request.headers['user-agent'])
      : undefined;
    const { accessToken, refreshToken } = await this.createTokens(
      newUser.id,
      newUser.role,
      newUser.tfa_mode,
      newUser.company_id,
      newUser.location_id,
      ipAddress,
      deviceType,
    );

    return {
      user: plainToClass(GetUserDto, newUser, {
        excludeExtraneousValues: true,
      }),
      accessToken,
      refreshToken,
    };
  }

  async signIn(createUserDto: SignInUserDto, request?: Request) {
    const { email, password, code } = createUserDto;
    const user = await this.userRepository.findOne({
      where: { email },
    });
    if (!user) {
      throw new BadRequestException('Invalid Email or Password');
    }

    const isPasswordValid = await Helpers.comparePassword(
      password,
      user.password_hash,
    );
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid Email or Password');
    }

    if (user.tfa_mode) {
      if (!code) {
        let verificationCode = Math.floor(
          100000 + Math.random() * 900000,
        ).toString();
        verificationCode = '111111';

        const expiryDate = new Date();
        // Use method-specific timeout: 1 minute for email, 3 minutes for SMS
        const timeoutMinutes = this.emailService.getCodeTimeoutMinutes();
        expiryDate.setMinutes(expiryDate.getMinutes() + timeoutMinutes);

        const verificationCodeEntity = this.verificationCodeRepository.create({
          user_id: user.id,
          code: verificationCode,
          method: 'email',
          expires_at: expiryDate,
          is_used: false,
        });
        await this.verificationCodeRepository.save(verificationCodeEntity);

        if (user.tfa_mode) {
          await this.emailService.sendVerificationCode(
            user.email,
            verificationCode,
          );
        }

        throw new BadRequestException({
          code: '2FA_REQUIRED',
          message: 'Two-factor authentication required',
          user_id: user.id,
        });
      }

      const codeRecord = await this.verificationCodeRepository.findOne({
        where: {
          user_id: user.id,
          code: code,
          is_used: false,
        },
        order: { created_at: 'DESC' },
      });

      if (!codeRecord || codeRecord.expires_at < new Date()) {
        throw new BadRequestException('Invalid or expired verification code');
      }

      codeRecord.is_used = true;
      await this.verificationCodeRepository.save(codeRecord);
    }

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
    );

    return {
      user: plainToClass(GetUserDto, user, { excludeExtraneousValues: true }),
      accessToken,
      refreshToken,
    };
  }

  /**
   * Logs out user by revoking their tokens
   */
  async logout(token: string): Promise<{ message: string }> {
    // Verify and decode the token
    try {
      this.jwtService.verify(token);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }

    // Find the access token in database
    const accessToken = await this.userTokenRepository.findOne({
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
    await this.userTokenRepository.save(accessToken);

    // Find and revoke the associated refresh token
    // Look for refresh token with same user, IP, and device type, created around the same time
    const refreshToken = await this.userTokenRepository.findOne({
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
        await this.userTokenRepository.save(refreshToken);
      }
    }

    return { message: 'Logged out successfully' };
  }

  /**
   * Confirm 2FA code during login (for unauthorized users)
   */
  async confirmLogin2FA(
    dto: Login2FAConfirmDto,
    request?: Request,
  ) {
    return this.dataSource.transaction(async (tx) => {
      const { user_id, code } = dto;
      const userRepository = tx.getRepository(User);
      const verificationCodeRepository = tx.getRepository(VerificationCode);
      const userTokenRepository = tx.getRepository(UserToken);

      const user = await userRepository.findOneBy({ id: user_id });
      if (!user) {
        throw new BadRequestException('User not found');
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

      return {
        user: plainToClass(GetUserDto, user, { excludeExtraneousValues: true }),
        accessToken,
        refreshToken,
      };
    });
  }

  /**
   * Resend 2FA code during login (for unauthorized users)
   */
  async resendLogin2FA(dto: AuthLogin2faResendDto, request?: Request): Promise<{ success: boolean }> {
    return this.dataSource.transaction(async (tx) => {
      const { user_id } = dto;
      const userRepository = tx.getRepository(User);
      const verificationCodeRepository = tx.getRepository(VerificationCode);

      const user = await userRepository.findOneBy({ id: user_id });
      if (!user) {
        throw new BadRequestException('User not found');
      }

      if (!user.tfa_mode) {
        throw new BadRequestException('2FA is not enabled for this user');
      }

      let verificationCode = Math.floor(
        100000 + Math.random() * 900000,
      ).toString();
      verificationCode = '111111';

      const expiryDate = new Date();
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
    ipAddress?: string,
    deviceType?: string,
    userTokenRepository?: Repository<UserToken>,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const tokenRepo = userTokenRepository || this.userTokenRepository;
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
    const refreshTokenExpiry = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const accessTokenEntity = tokenRepo.create({
      user_id: String(userId),
      token: accessToken,
      type: 'access',
      expires_at: accessTokenExpiry,
      is_revoked: false,
      ip_address: ipAddress,
      device_type: deviceType,
    });
    await tokenRepo.save(accessTokenEntity);

    const refreshTokenEntity = tokenRepo.create({
      user_id: String(userId),
      token: refreshToken,
      type: 'refresh',
      expires_at: refreshTokenExpiry,
      is_revoked: false,
      ip_address: ipAddress,
      device_type: deviceType,
    });
    await tokenRepo.save(refreshTokenEntity);

    return { accessToken, refreshToken };
  }
}
