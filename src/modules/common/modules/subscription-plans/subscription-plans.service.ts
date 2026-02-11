import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { GetSubscriptionPlanDto } from './dto/get-subscription-plan.dto';
import { PlanOption } from './entities/plan-option.entity';

@Injectable()
export class SubscriptionPlansService {
  constructor(
    @InjectRepository(PlanOption)
    private readonly planRepo: Repository<PlanOption>,
  ) {
  }

  async listPlans(admin = false) {
    const where = admin ? {} : { is_active: true };
    return this.planRepo.find({
      where,
      relations: [], order: {
        prices: {
          price_cents: 'ASC'
        }
      }
    })
  }

  async listPlansByDuration(admin = false): Promise<GetSubscriptionPlanDto[]> {
    const where = {};

    if (!admin) {
      where['is_active'] = true;
    }
    const plans =
      await this.planRepo.find({
        order: {
          prices: {
            price_cents: 'ASC',
            interval: 'ASC'
          },
        },
        where
      });

    return plans.map(plan => plainToInstance(GetSubscriptionPlanDto, plan, {
      excludeExtraneousValues: true
    }))
  }

  async listPlansByTier(tier_id: string): Promise<GetSubscriptionPlanDto[]> {
    const plans =
      await this.planRepo.find({
        order: {
          prices: {
            price_cents: 'ASC',
            interval: 'ASC'
          },
        },
        where: {
          tier_id
        }
      });

    return plans.map(plan => plainToInstance(GetSubscriptionPlanDto, plan, {
      excludeExtraneousValues: true
    }));
  }

}
