import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../user/user.module';
import { StaffService } from './staff.service';
import { StaffController } from './staff.controller';
import { User } from '../user/entities/user.entity';
import { Location } from '../location/entities/location.entity';

@Module({
  imports: [
    UserModule,
    TypeOrmModule.forFeature([User, Location]),
  ],
  providers: [StaffService],
  exports: [StaffService],
  controllers: [StaffController],
})
export class StaffModule {
}
