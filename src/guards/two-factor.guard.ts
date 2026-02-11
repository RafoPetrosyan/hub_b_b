import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { REQUIRES_2FA_KEY } from '../decorators/controller/requires-2fa.decorator';
import { User2FAMode } from '../modules/business/modules/user/enum/user-tfa-mode.enum';
import { EmailService } from '../modules/common/modules/notify/email.service';
import { SmsService } from '../modules/common/modules/notify/sms.service';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../modules/business/modules/user/entities/user.entity';
import { Repository } from 'typeorm';
import { VerificationCode } from '../modules/business/modules/verification-code/entities/verification-code.entity';
import { UserRole } from '../modules/auth';
import { UserToken } from '../modules/business/modules/user-token/entities/user-token.entity';
import { Request } from 'express';

@Injectable()
export class TwoFactorGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
    private emailService: EmailService,
    private smsService: SmsService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(VerificationCode)
    private verificationCodeRepository: Repository<VerificationCode>,
    @InjectRepository(UserToken)
    private readonly userTokenRepository: Repository<UserToken>,
  ) {
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requires2FA = this.reflector.get<boolean>(
      REQUIRES_2FA_KEY,
      context.getHandler(),
    );

    if (!requires2FA) return true;

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException();
    }
    try {
      const payload = await this.jwtService.verifyAsync(token);

      // Check if token is revoked in database
      const tokenRecord = await this.userTokenRepository.findOne({
        where: {
          token,
          type: 'access',
        },
      });

      if (!tokenRecord || tokenRecord.is_revoked) {
        throw new UnauthorizedException();
      }

      // Check if token has expired
      if (tokenRecord.expires_at < new Date()) {
        throw new UnauthorizedException();
      }

      request['userId'] = payload.id;
      request['userRole'] = payload.role as UserRole;
      request['user2fa'] = payload.tfa as User2FAMode;
    } catch (error) {
      throw new UnauthorizedException();
    }

    const tfa_mode = request.user2fa;
    const user_id = request.userId;

    // User does not have 2FA enabled → allow
    if (!tfa_mode) return true;

    const tfaToken = request.headers['x-2fa-token'];
    if (!tfaToken) {
      const user = await this.userRepository.findOneBy({ id: user_id });
      if (!user) return false;

      let verificationCode = Math.floor(
        100000 + Math.random() * 900000,
      ).toString();
      verificationCode = '111111';

      const expiryDate = new Date();
      // Use method-specific timeout: 1 minute for email, 3 minutes for SMS
      const timeoutMinutes = tfa_mode === User2FAMode.EMAIL
        ? this.emailService.getCodeTimeoutMinutes()
        : this.smsService.getCodeTimeoutMinutes();
      expiryDate.setMinutes(expiryDate.getMinutes() + timeoutMinutes);

      const verificationCodeEntity = this.verificationCodeRepository.create({
        user_id: user.id,
        code: verificationCode,
        method: 'email',
        expires_at: expiryDate,
        is_used: false,
      });
      await this.verificationCodeRepository.save(verificationCodeEntity);

      await this.emailService.sendVerificationCode(
        user.email,
        verificationCode,
      );

      throw new ForbiddenException({
        code: '2FA_REQUIRED',
        message: 'Two-factor authentication required',
      });
    }

    try {
      const payload = this.jwtService.verify(tfaToken);
      if (payload.sub !== user_id) {
        throw new Error();
      }
      return true;
    } catch {
      throw new ForbiddenException({
        code: '2FA_INVALID',
        message: 'Invalid or expired 2FA token',
      });
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
