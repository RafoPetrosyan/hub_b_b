import { Module } from '@nestjs/common';
import { config as dotenvConfig } from 'dotenv';
import { UserModule } from '../user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { LocationService } from './location.service';
import { LocationController } from './location.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Location } from './entities/location.entity';
import { LocationAddress } from './entities/location-address.entity';
import { LocationWorkingHours } from './entities/location-working-hours.entity';

dotenvConfig({ path: '.env' });

@Module({
  imports: [
    UserModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '24h' },
    }),
    TypeOrmModule.forFeature([Location, LocationAddress, LocationWorkingHours]),
  ],
  providers: [LocationService, UserService],
  controllers: [LocationController],
  exports: [LocationService],
})
export class LocationModule {
}
