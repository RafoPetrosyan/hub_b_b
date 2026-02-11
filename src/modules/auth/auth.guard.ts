import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { UserRole } from './types/user-role.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserToken } from '../business/modules/user-token/entities/user-token.entity';
import { User2FAMode } from '../business/modules/user/enum/user-tfa-mode.enum';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    @InjectRepository(UserToken)
    private readonly userTokenRepository: Repository<UserToken>,
  ) {
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
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
        throw new UnauthorizedException('Token has been revoked');
      }

      // Check if token has expired
      if (tokenRecord.expires_at < new Date()) {
        throw new UnauthorizedException('Token has expired');
      }

      request['userId'] = payload.id;
      request['userRole'] = payload.role as UserRole;
      request['user2fa'] = payload.tfa as User2FAMode;
      request['userCompany'] = payload.company_id as number;
      request['userLocation'] = payload.location_id as string;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException();
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
