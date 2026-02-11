import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceService } from './service.service';
import { ServiceController } from './service.controller';
import { BaseService } from './entities/base-service.entity';
import { BusinessService } from './entities/business-service.entity';
import { BaseSpecialization } from '../../../specialization/entities/specialization.entity';
import { Trade } from '../../../common/modules/trade/entities/trade.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BaseService, BusinessService, BaseSpecialization, Trade])],
  controllers: [ServiceController],
  providers: [ServiceService],
  exports: [ServiceService, TypeOrmModule],
})
export class ServiceModule {
}

