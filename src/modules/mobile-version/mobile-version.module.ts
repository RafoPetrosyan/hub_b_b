import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MobileVersion } from './entities/mobile-version.entity';
import { MobileVersionService } from './mobile-version.service';
import { MobileVersionAdminController, MobileVersionPublicController } from './mobile-version.controller';

@Module({
  imports: [TypeOrmModule.forFeature([MobileVersion])],
  controllers: [MobileVersionAdminController, MobileVersionPublicController],
  providers: [MobileVersionService],
  exports: [MobileVersionService],
})
export class MobileVersionModule {
}
