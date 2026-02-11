import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { UserToken } from './entities/user-token.entity';
import { Repository } from 'typeorm';
import { getDeviceType, getIpAddress } from '../../../../utils/request-helpers';
import { User2FAMode } from '../user/enum/user-tfa-mode.enum';

@Injectable()
export class UserTokenService {
  constructor(
    @InjectRepository(UserToken)
    private readonly userTokenRepository: Repository<UserToken>,
    private readonly jwtService: JwtService,
  ) {
  }

  async refreshTokens(refreshToken: string, request: any) {
    try {
      const payload = this.jwtService.verify(refreshToken);

      const ipAddress = request ? getIpAddress(request) : undefined;
      const deviceType = request
        ? getDeviceType(request.headers['user-agent'])
        : undefined;
      const dbRefreshToken = await this.userTokenRepository.findOneBy({
        type: 'refresh',
        token: refreshToken,
      });
      const oldAccessToken = await this.userTokenRepository.findOne({
        where: {
          type: 'access',
          user_id: dbRefreshToken.user_id,
          device_type: dbRefreshToken.device_type,
          ip_address: dbRefreshToken.ip_address,
          is_revoked: false,
        },
        order: { created_at: 'DESC' },
      });
      oldAccessToken.is_revoked = true;
      await this.userTokenRepository.save(oldAccessToken);

      const accessToken = await this.createAccessToken(
        payload.id,
        payload.role,
        payload.tfa,
        ipAddress,
        deviceType,
      );

      return { accessToken };
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      console.log(e);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Creates access token and stores it in database
   */
  private async createAccessToken(
    userId: string | number,
    role: string,
    tfa_mode: User2FAMode,
    ipAddress?: string,
    deviceType?: string,
  ): Promise<string> {
    const payload = {
      id: userId,
      role,
      tfa: tfa_mode,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15h',
    });

    const now = new Date();
    const accessTokenExpiry = new Date(now.getTime() + 15 * 60 * 60 * 1000); // 15 hours

    const accessTokenEntity = this.userTokenRepository.create({
      user_id: String(userId),
      token: accessToken,
      type: 'access',
      expires_at: accessTokenExpiry,
      is_revoked: false,
      ip_address: ipAddress,
      device_type: deviceType,
    });
    await this.userTokenRepository.save(accessTokenEntity);

    return accessToken;
  }
}
