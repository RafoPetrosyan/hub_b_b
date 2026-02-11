import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserToken } from './entities/user-token.entity';
import { UserTokenService } from './user-token.service';
import { TradeController } from './user-token.controller';
import { JwtModule } from '@nestjs/jwt';
import { config as dotenvConfig } from 'dotenv';

dotenvConfig({ path: '.env' });

@Global()
@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '24h' },
    }),
    TypeOrmModule.forFeature([UserToken]),
  ],
  providers: [UserTokenService],
  controllers: [TradeController],
  exports: [TypeOrmModule, UserTokenService],
})
export class UserTokenModule {
}

