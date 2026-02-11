import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SpecializationService } from './specialization.service';
import { SpecializationController } from './specialization.controller';
import { BaseSpecialization } from './entities/specialization.entity';
import { BusinessSpecialization } from './entities/business-specialization.entity';
import { Company } from '../business/modules/company/entities/company.entity';
import { Trade } from '../common/modules/trade/entities/trade.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BaseSpecialization, BusinessSpecialization, Trade, Company])],
  controllers: [SpecializationController],
  providers: [SpecializationService],
  exports: [SpecializationService],
})
export class SpecializationModule {
}

