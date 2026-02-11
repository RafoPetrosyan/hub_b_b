import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { plainToClass } from 'class-transformer';
import { GetAccountDto } from './dto/get-account.dto';
import { User } from '../user/entities/user.entity';
import { UpdateAccountProfileDto } from './dto/update-account-profile.dto';
import { ChangePasswordRequestDto } from './dto/change-password-request.dto';
import Helpers from '../../../../utils/helpers';
import { TfaChangeRequestDto } from './dto/tfa-change-request.dto';
import { VerificationCode } from '../verification-code/entities/verification-code.entity';
import { EmailService } from '../../../common/modules/notify/email.service';
import { SmsService } from '../../../common/modules/notify/sms.service';
import { JwtService } from '@nestjs/jwt';
import { UserToken } from '../user-token/entities/user-token.entity';
import { getDeviceType, getIpAddress } from '../../../../utils/request-helpers';
import { Media } from '../../../common/modules/media/media.entity';
import { AuthService } from '../../../auth/auth.service';
import { UploadService } from '../../../common/modules/upload/upload.service';

@Injectable()
export class AccountService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Media)
    private readonly mediaRepository: Repository<Media>,
    @InjectRepository(VerificationCode)
    private readonly verificationCodeRepository: Repository<VerificationCode>,
    private dataSource: DataSource,
    private emailService: EmailService,
    private smsService: SmsService,
    private jwtService: JwtService,
    private authService: AuthService,
    private uploadService: UploadService,
  ) {
  }

  async getProfile(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Account Not Found');
    }

    const profilePicture = await user.getProfilePicture?.();
    const logo = profilePicture ? await this.uploadService.getFileUrl(profilePicture) : null;

    return {
      ...plainToClass(GetAccountDto, { ...user, logo }, { excludeExtraneousValues: true }),
    };
  }

  async updateProfile(dto: UpdateAccountProfileDto, id: string) {
    return this.dataSource.transaction(async (tx) => {
      const userRepository = tx.getRepository(User);
      const user = await this.userRepository.findOne({
        where: { id },
      });
      if (!user) {
        throw new NotFoundException('Account Not Found');
      }

      const { first_name, last_name, phone, email, logo } = dto;

      if (first_name !== undefined) {
        user.first_name = first_name;
      }
      if (last_name !== undefined) {
        user.last_name = last_name;
      }
      if (phone !== undefined && phone !== user.phone) {
        // Check if phone is already in use by another user
        if (phone) {
          const existingPhoneUser = await userRepository.findOne({
            where: { phone },
          });
          if (existingPhoneUser && existingPhoneUser.id !== id) {
            throw new ConflictException('Phone number is already in use');
          }
        }
        user.phone = phone;
      }
      if (email !== undefined && email !== user.email) {
        if (email) {
          const existingEmailUser = await userRepository.findOne({
            where: { email },
          });
          if (existingEmailUser && existingEmailUser.id !== id) {
            throw new ConflictException('Email is already in use');
          }
        }
        user.email = email;
      }

      await userRepository.save(user);

      let updatedLogo: string | null = null;
      if (logo) {
        const updatedMedia = await this.changeUserProfilePicture(
          user,
          logo,
          tx.getRepository(Media),
        );
        updatedLogo = updatedMedia ? await this.uploadService.getFileUrl(updatedMedia) : null;
      } else {
        const currentProfilePicture = await user.getProfilePicture?.();
        updatedLogo = currentProfilePicture ? await this.uploadService.getFileUrl(currentProfilePicture) : null;
      }

      return plainToClass(
        GetAccountDto,
        { ...user, logo: updatedLogo },
        { excludeExtraneousValues: true },
      );
    });
  }

  async changePassword(dto: ChangePasswordRequestDto, req: any) {
    return this.dataSource.transaction(async (tx) => {
      const userRepository = tx.getRepository(User);

      const user = await userRepository.findOne({
        where: { id: req.userId },
      });

      if (!user) {
        throw new NotFoundException('User Not Found');
      }

      const { old_password, password } = dto;

      const correctPassword = await Helpers.comparePassword(old_password, user.password_hash);
      if (!correctPassword) {
        throw new NotFoundException('Invalid password');
      }

      if (user.tfa_mode) {
        const tfaToken = req.headers['x-2fa-token'];
        if (!tfaToken) {
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

          await this.emailService.sendVerificationCode(
            user.email,
            verificationCode,
          );
          return {
            code: '2FA_REQUIRED',
            message: 'Twa factor authentication is required',
          };
        } else {
          try {
            const payload = this.jwtService.verify(tfaToken);
            console.log(payload);
            if (payload.sub !== user.id) {
              throw new Error();
            }

          } catch {
            throw new ForbiddenException({
              code: '2FA_INVALID',
              message: 'Invalid or expired 2FA token',
            });
          }
        }
      }

      user.password_hash = await Helpers.hashPassword(password);
      await userRepository.save(user);
      const token = this.extractTokenFromHeader(req);
      return this.authService.logout(token);

      return { success: true };
    });
  }

  changeTfaMode(dto: TfaChangeRequestDto, userId: string) {
    return this.dataSource.transaction(async (tx) => {
      const userRepository = tx.getRepository(User);

      const user = await userRepository.findOneBy({ id: userId });
      if (!user) {
        throw new NotFoundException('User Not Found');
      }

      user.tfa_mode = dto.mode;
      await userRepository.save(user);

      return { success: true };
    });
  }

  async verify2faCode(id: string, code: string, req: any) {
    return this.dataSource.transaction(async (tx) => {
      const verificationCodesRepository = tx.getRepository(VerificationCode);
      const userTokenRepository = tx.getRepository(UserToken);

      const verificationCode = await verificationCodesRepository.findOne({
        where: { user_id: id, code: code, is_used: false },
        order: { created_at: 'DESC' },
      });

      if (!verificationCode || verificationCode.expires_at < new Date()) {
        throw new UnauthorizedException('Verification Code expired');
      }
      const ipAddress = req ? getIpAddress(req) : undefined;
      const deviceType = req
        ? getDeviceType(req.headers['user-agent'])
        : undefined;

      verificationCode.is_used = true;
      await verificationCodesRepository.save(verificationCode);
      const token = this.jwtService.sign(
        { sub: id, type: '2fa' },
        { expiresIn: '5m' },
      );
      const expiryDate = new Date();
      expiryDate.setMinutes(expiryDate.getMinutes() + 5);
      const tfaTokenEntity = userTokenRepository.create({
        user_id: String(id),
        token: token,
        type: 'refresh',
        expires_at: expiryDate,
        is_revoked: false,
        ip_address: ipAddress,
        device_type: deviceType,
      });
      await userTokenRepository.save(tfaTokenEntity);

      return { token };
    });
  }

  async resend2faCode(user_id: string, tfa_mode: 'email' | 'phone') {
    return this.dataSource.transaction(async (tx) => {
      const verificationCodeRepository = tx.getRepository(VerificationCode);

      const user = await this.userRepository.findOneBy({ id: user_id });
      if (!user) return false;

      let verificationCode = Math.floor(
        100000 + Math.random() * 900000,
      ).toString();
      verificationCode = '111111';

      const expiryDate = new Date();
      // Use method-specific timeout: 1 minute for email, 3 minutes for SMS
      const timeoutMinutes = tfa_mode === 'email'
        ? this.emailService.getCodeTimeoutMinutes()
        : this.smsService.getCodeTimeoutMinutes();
      expiryDate.setMinutes(expiryDate.getMinutes() + timeoutMinutes);

      const verificationCodeEntity = verificationCodeRepository.create({
        user_id: user.id,
        code: verificationCode,
        method: tfa_mode,
        expires_at: expiryDate,
        is_used: false,
      });
      await verificationCodeRepository.save(verificationCodeEntity);

      if (tfa_mode === 'email') {
        await this.emailService.sendVerificationCode(
          user.email,
          verificationCode,
        );
      } else if (tfa_mode === 'phone') {
        await this.smsService.sendVerificationCode(
          user.phone,
          verificationCode,
        );
      }
    });
  }

  private async changeUserProfilePicture(
    user: User,
    profile_picture: string,
    mediaRepository: Repository<Media> = this.mediaRepository,
  ) {
    const owner_id = user.id;
    const owner_type = 'User';

    const qb = mediaRepository.createQueryBuilder('media')
      .where('media.filename = :profile_picture', { profile_picture })
      .orWhere('media.url = :profile_picture', { profile_picture })
      .orWhere('media.file_path = :profile_picture', { profile_picture });

    if (/^\d+$/.test(profile_picture)) {
      qb.orWhere('media.id = :mediaId', { mediaId: Number(profile_picture) });
    }

    const media = await qb.getOne();

    if (!media) {
      throw new NotFoundException('Profile picture media not found');
    }

    media.owner_id = owner_id;
    media.owner_type = owner_type;
    media.collection = 'profile_picture';

    return await mediaRepository.save(media);
  }

  private extractTokenFromHeader(request: any): string {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
