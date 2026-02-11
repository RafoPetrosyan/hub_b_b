import { Module } from '@nestjs/common';
import { config as dotenvConfig } from 'dotenv';
import { UserModule } from '../../../user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { CompanyLoginService } from './company-login.service';
import { CompanyLoginController } from './company-login.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from '../../entities/company.entity';
import { User } from '../../../user/entities/user.entity';
import { NotifyModule } from '../../../../../common/modules/notify/notify.module';
import { VerificationCodeModule } from '../../../verification-code/verification-code.module';
import { PasswordResetModule } from '../../../../../common/modules/password-reset/password-reset.module';
import { UserTokenModule } from '../../../user-token/user-token.module';
import { UserToken } from '../../../user-token/entities/user-token.entity';
import { AuthModule } from '../../../../../auth/auth.module';

dotenvConfig({ path: '.env' });

@Module({
  imports: [
    UserModule,
    NotifyModule,
    VerificationCodeModule,
    PasswordResetModule,
    UserTokenModule,
    AuthModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '24h' },
    }),
    TypeOrmModule.forFeature([Company, User, UserToken]),
  ],
  providers: [CompanyLoginService],
  controllers: [CompanyLoginController],
  exports: [CompanyLoginService],
})
export class CompanyLoginModule {
}
