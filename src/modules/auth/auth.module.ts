import { Module } from '@nestjs/common';
import { config as dotenvConfig } from 'dotenv';
import { AuthService } from './auth.service';
import { UserModule } from '../business/modules/user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { RolesGuard } from './guards/roles.guard';
import { AuthGuard } from './auth.guard';
import { UserTokenModule } from '../business/modules/user-token/user-token.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VerificationCode } from '../business/modules/verification-code/entities/verification-code.entity';

dotenvConfig({ path: '.env' });

@Module({
  imports: [
    UserModule,
    UserTokenModule,
    TypeOrmModule.forFeature([VerificationCode]),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '24h' },
    }),
  ],
  providers: [AuthService, RolesGuard, AuthGuard],
  controllers: [AuthController],
  exports: [AuthService, RolesGuard, AuthGuard],
})
export class AuthModule {
}
