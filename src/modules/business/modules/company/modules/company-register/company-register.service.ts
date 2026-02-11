import { ConflictException, Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { Company } from '../../entities/company.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../../user/entities/user.entity';
import { RegisterRequestDto } from './dto/register-request.dto';
import Helpers from '../../../../../../utils/helpers';
import { UserStatusEnum } from '../../../user/enum/user-status.enum';
import { UnifiedRegisterResponseDto } from './dto/unified-register-response.dto';
import { VerificationCode } from '../../../verification-code/entities/verification-code.entity';
import { EmailService } from '../../../../../common/modules/notify/email.service';
import { GetSlugResponseDto } from './dto/get-slug-response.dto';
import { UserToken } from '../../../user-token/entities/user-token.entity';
import { getDeviceType, getIpAddress } from '../../../../../../utils/request-helpers';
import { UserRole } from '../../../../../auth';
import { Media } from '../../../../../common/modules/media/media.entity';
import { SmsService } from '../../../../../common/modules/notify/sms.service';
import { Trade } from '../../../../../common/modules/trade/entities/trade.entity';
import { CompanyBooking } from '../company-profile/entities/company-booking.entity';

@Injectable()
export class CompanyRegisterService {
  constructor(
    @InjectRepository(Company)
    private readonly businessRepository: Repository<Company>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Trade)
    private readonly tradeRepository: Repository<Trade>,
    @InjectRepository(VerificationCode)
    private readonly verificationCodeRepository: Repository<VerificationCode>,
    @InjectRepository(Media)
    private readonly mediaRepository: Repository<Media>,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
    private dataSource: DataSource,
  ) {
  }

  /**
   * Unified registration flow - creates user, company, and sends verification code
   */
  async register(dto: RegisterRequestDto, request: any): Promise<UnifiedRegisterResponseDto> {
    return this.dataSource.transaction(async (tx) => {
      const {
        first_name,
        last_name,
        email,
        password,
      } = dto;

      const userRepository = tx.getRepository(User);
      const companyRepository = tx.getRepository(Company);
      const companyBookingRepository = tx.getRepository(CompanyBooking);
      const userTokenRepository = tx.getRepository(UserToken);

      const existingUser = await userRepository.findOne({
        where: { email },
      });
      if (existingUser) {
        throw new ConflictException('Email is already in use');
      }

      const hashedPassword = await Helpers.hashPassword(password);

      const company = await companyRepository.save(companyRepository.create({
        email
      }));
      await companyBookingRepository.save(
        companyBookingRepository.create({
          company_id: company.id,
          subdomain: null,
          custom_subdomain: null,
        }),
      );
      let newUser = userRepository.create({
        first_name,
        last_name,
        email,
        password_hash: hashedPassword,
        role: UserRole.BUSINESS_ADMIN,
        status: UserStatusEnum.INACTIVE,
        company_id: company.id,
      });
      newUser = await userRepository.save(newUser);

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
        userTokenRepository,
      );


      return {
        user_id: newUser.id,
        access_token: accessToken,
        refresh_token: refreshToken,
        message: 'Registration successful.',
      };
    });
  }

  async checkSlugAvailability(name: string): Promise<GetSlugResponseDto> {
    const subdomain = await this.generateSubdomain(
      name,
      this.businessRepository,
    );

    return {
      available: `${subdomain}.beautyhub.com`,
    };
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

  public async generateSubdomain(
    companyName: string,
    businessRepository: Repository<Company>,
  ): Promise<string> {
    let baseSubdomain = companyName
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9]/g, '');

    if (!baseSubdomain) {
      baseSubdomain = 'company';
    }

    let subdomain = baseSubdomain;
    let counter = 1;
    let existingBusiness = await businessRepository.findOne({
      where: { subdomain },
    });

    while (existingBusiness) {
      subdomain = `${baseSubdomain}-${counter}`;
      existingBusiness = await businessRepository.findOne({
        where: { subdomain },
      });
      counter++;
    }

    return subdomain;
  }

  private async changeUserProfilePicture(user: User, profile_picture: string) {
    const owner_id = user.id;
    const owner_type = 'User';

    const media = await this.mediaRepository.createQueryBuilder('media')
      .where('media.filename = ' + profile_picture)
      .orWhere('media.url = ' + profile_picture)
      .orWhere('media.file_path = ' + profile_picture)
      .orWhere('media.id = ' + profile_picture)
      .getOne();

    media.owner_id = owner_id;
    media.owner_type = owner_type;

    return await this.mediaRepository.save(media);
  }

  private async changeCompanyLogo(company: Company, profile_picture: string) {
    const owner_id = company.id;
    const owner_type = 'Company';

    const media = await this.mediaRepository.createQueryBuilder('media')
      .where('media.filename = \'' + profile_picture + '\'')
      .orWhere('media.url = \'' + profile_picture + '\'')
      .orWhere('media.file_path = \'' + profile_picture + '\'')
      .getOne();

    media.owner_id = String(owner_id);
    media.owner_type = owner_type;

    return await this.mediaRepository.save(media);
  }
}
