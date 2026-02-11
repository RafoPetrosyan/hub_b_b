import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AddOn } from './entities/add-on.entity';
import { PlanOptionAddOn } from './entities/plan-option-addon.entity';
import { CompanyAddOn } from '../../../business/modules/add-ons/entities/add-on.entity';

@Injectable()
export class AddOnsService {
  constructor(
    @InjectRepository(AddOn)
    private readonly repo: Repository<AddOn>,
    @InjectRepository(PlanOptionAddOn)
    private readonly planOptionAddOnRepo: Repository<PlanOptionAddOn>,
    @InjectRepository(CompanyAddOn)
    private readonly companyAddOnRepo: Repository<CompanyAddOn>,
  ) {}

  async findAll() {
    return await this.repo.find({
      order: {
        created_at: 'ASC'
      }
    });
  }

  async listForPlanOption(planOptionId: string) {
    return this.planOptionAddOnRepo.find({
      where: { plan_option_id: planOptionId },
      relations: ['addon'],
      order: { created_at: 'ASC' },
    });
  }

  listForCompany(companyId: string) {
    return this.repo
      .createQueryBuilder('addon')
      .innerJoin(CompanyAddOn, 'company_addon', 'company_addon.addon_id = addon.id')
      .where('company_addon.company_id = :companyId', { companyId })
      .orderBy('addon.created_at', 'ASC')
      .getMany();
  }
}
