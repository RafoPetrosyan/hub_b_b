import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AddOn } from './entities/add-on.entity';
import { AddOnsService } from './add-ons.service';
import { AddOnsController } from './add-ons.controller';
import { PlanOptionAddOn } from './entities/plan-option-addon.entity';
import { CompanyAddOn } from '../../../business/modules/add-ons/entities/add-on.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AddOn, PlanOptionAddOn, CompanyAddOn])],
  providers: [AddOnsService],
  controllers: [AddOnsController],
  exports: [AddOnsService, TypeOrmModule],
})
export class CommonAddOnsModule {}
