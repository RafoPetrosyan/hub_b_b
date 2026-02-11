import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { FormTemplateModule } from './modules/form-template/form-template.module';
import { SpecializationModule } from './modules/specialization/specialization.module';
import { TwoFactorGuard } from './guards/two-factor.guard';
import { APP_GUARD } from '@nestjs/core';
import { User } from './modules/business/modules/user/entities/user.entity';
import { Company } from './modules/business/modules/company/entities/company.entity';
import { AdminModule } from './modules/admin/admin.module';
import { BusinessModule } from './modules/business/business.module';
import { CommonModule } from './modules/common/common.module';
import { VerificationCode } from './modules/business/modules/verification-code/entities/verification-code.entity';
import { MobileVersionModule } from './modules/mobile-version/mobile-version.module';
import { typeormConfig } from './db/data-source';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [typeormConfig],
    }),
    TypeOrmModule.forRootAsync({
      imports: [],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) =>
        configService.get('typeorm'),
    }),
    // ValkeyModule.forRootAsync({
    //   imports: [ConfigModule],
    //   inject: [ConfigService],
    //   useFactory: (configService: ConfigService) => ({
    //     host: configService.get('VALKEY_HOST'),
    //     port: configService.get('VALKEY_PORT'),
    //     password: configService.get('VALKEY_PASSWORD'),
    //     keyPrefix: configService.get('VALKEY_PREFIX'),
    //     tls: {}
    //   }),
    // }),
    AdminModule,
    BusinessModule,
    CommonModule,
    AuthModule,
    FormTemplateModule,
    SpecializationModule,
    MobileVersionModule,
    TypeOrmModule.forFeature([Company, User, VerificationCode]),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: TwoFactorGuard,
    },
  ],
})
export class AppModule {
}
