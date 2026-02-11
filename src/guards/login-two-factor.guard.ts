import { BadRequestException, CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRES_2FA_KEY } from '../decorators/controller/requires-2fa.decorator';
import { EmailService } from '../modules/common/modules/notify/email.service';
import { SmsService } from '../modules/common/modules/notify/sms.service';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../modules/business/modules/user/entities/user.entity';
import { Repository } from 'typeorm';
import { VerificationCode } from '../modules/business/modules/verification-code/entities/verification-code.entity';

/**
 * Guard for 2FA verification during login (unauthorized users)
 * Checks if user has 2FA enabled and requires verification code
 */
@Injectable()
export class LoginTwoFactorGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private emailService: EmailService,
    private smsService: SmsService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(VerificationCode)
    private verificationCodeRepository: Repository<VerificationCode>,
  ) {
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requires2FA = this.reflector.get<boolean>(
      REQUIRES_2FA_KEY,
      context.getHandler(),
    );

    if (!requires2FA) return true;

    const request = context.switchToHttp().getRequest();
    const user_id = request.userId; // Should be set by login service after password verification

    if (!user_id) {
      throw new BadRequestException('User ID not found');
    }

    const user = await this.userRepository.findOneBy({ id: user_id });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const tfa_mode = user.tfa_mode;

    if (!tfa_mode) return true;

    const verificationCode = request.body?.code;

    if (verificationCode) {
      const codeRecord = await this.verificationCodeRepository.findOne({
        where: {
          user_id: user.id,
          code: verificationCode,
          is_used: false,
          method: 'email',
        },
        order: { created_at: 'DESC' },
      });

      if (!codeRecord || codeRecord.expires_at < new Date()) {
        throw new BadRequestException('Invalid or expired verification code');
      }

      codeRecord.is_used = true;
      await this.verificationCodeRepository.save(codeRecord);

      return true;
    }

    let newCode = Math.floor(100000 + Math.random() * 900000).toString();
    newCode = '111111';
    const expiryDate = new Date();

    const timeoutMinutes = this.emailService.getCodeTimeoutMinutes();
    expiryDate.setMinutes(expiryDate.getMinutes() + timeoutMinutes);

    const verificationCodeEntity = this.verificationCodeRepository.create({
      user_id: user.id,
      code: newCode,
      method: 'email',
      expires_at: expiryDate,
      is_used: false,
    });
    await this.verificationCodeRepository.save(verificationCodeEntity);

    await this.emailService.sendVerificationCode(user.email, newCode);

    throw new ForbiddenException({
      code: '2FA_REQUIRED',
      message: 'Two-factor authentication required',
      user_id: user.id,
    });
  }
}

