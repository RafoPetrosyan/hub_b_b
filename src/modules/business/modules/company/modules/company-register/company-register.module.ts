import { Module } from '@nestjs/common';
import { config as dotenvConfig } from 'dotenv';
import { UserModule } from '../../../user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { CompanyRegisterService } from './company-register.service';
import { CompanyRegisterController } from './company-register.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from '../../entities/company.entity';
import { VerificationCodeModule } from '../../../verification-code/verification-code.module';
import { NotifyModule } from '../../../../../common/modules/notify/notify.module';
import { UploadModule } from '../../../../../common/modules/upload/upload.module';
import { Trade } from '../../../../../common/modules/trade/entities/trade.entity';

dotenvConfig({ path: '.env' });

@Module({
  imports: [
    UserModule,
    VerificationCodeModule,
    NotifyModule,
    UploadModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '24h' },
    }),
    TypeOrmModule.forFeature([Company, Trade]),
  ],
  providers: [CompanyRegisterService],
  controllers: [CompanyRegisterController],
  exports: [CompanyRegisterService],
})
export class CompanyRegisterModule {
}
