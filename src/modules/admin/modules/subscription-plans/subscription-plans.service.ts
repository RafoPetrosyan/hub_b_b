import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { Tier } from '../../../common/modules/subscription-plans/entities/tier.entity';
import { PlanOption } from '../../../common/modules/subscription-plans/entities/plan-option.entity';
import { PlanPrice } from '../../../common/modules/subscription-plans/entities/plan-price.entity';
import { PlanOptionAddOn } from '../../../common/modules/add-ons/entities/plan-option-addon.entity';
import { CreatePlanOptionDto } from './dto/create-plan-option.dto';
import { SetAddonForPlanDto } from '../add-ons/dto/set-addon-for-plan.dto';

const STRIPE_API_VERSION = '2026-01-28.clover';

@Injectable()
export class SubscriptionPlansService {
  private readonly logger = new Logger(SubscriptionPlansService.name);
  private readonly stripe: Stripe | null;

  constructor(
    @InjectRepository(Tier) private readonly tierRepo: Repository<Tier>,
    @InjectRepository(PlanOption) private readonly optionRepo:
    Repository<PlanOption>,
    @InjectRepository(PlanPrice) private readonly priceRepo:
    Repository<PlanPrice>,
    @InjectRepository(PlanOptionAddOn) private readonly planOptionAddOnRepo:
    Repository<PlanOptionAddOn>,
  ) {
    const key = process.env.STRIPE_SECRET_KEY ?? null;
    this.stripe = key ? new Stripe(key, {
      apiVersion: STRIPE_API_VERSION,
    }) : null;
  }

  async listTiers() {
    return this.tierRepo.find({ order: { name: 'ASC' }, relations: { plans: true } });
  }

  async createPlanOption(dto: CreatePlanOptionDto) {
    const tier = await this.tierRepo.findOne({ where: { id: dto.tier_id } });
    if (!tier) throw new NotFoundException('Tier not found');

    const opt = this.optionRepo.create(dto);
    const saved = await this.optionRepo.save(opt);
    if (this.stripe) {
      try {
        const product = await this.stripe.products.create({
          name: saved.name,
          description: saved.description ?? undefined, metadata: {
            plan_option_id:
            saved.id,
          },
        });
        saved.stripe_product_id = product.id;
        await this.optionRepo.save(saved);
      } catch (err) {
        this.logger.warn('Stripe product creation failed for plan option: ' +
          err.message);
      }
    }
    return this.optionRepo.findOne({
      where: { id: saved.id }, relations:
        ['prices', 'plan_option_addons'],
    });
  }

  async createPlanPrice(dto: {
    plan_option_id: string; interval:
      'monthly' | 'yearly'; price_cents: number; currency?: string
  }) {
    const option = await this.optionRepo.findOne({
      where: {
        id:
        dto.plan_option_id,
      },
    });
    if (!option) throw new NotFoundException('Plan option not found');
    const p = this.priceRepo.create({
      plan_option_id: dto.plan_option_id,
      interval: dto.interval, price_cents: dto.price_cents, currency: dto.currency ??
        'USD',
    });
    const saved = await this.priceRepo.save(p);
    if (this.stripe && option.stripe_product_id) {
      try {
        const stripePrice = await this.stripe.prices.create({
          product:
          option.stripe_product_id, unit_amount: Number(saved.price_cents), currency:
            (saved.currency ?? 'USD').toLowerCase(), recurring: {
            interval: dto.interval
            === 'monthly' ? 'month' : 'year',
          },
        });
        saved.stripe_price_id = stripePrice.id;
        await this.priceRepo.save(saved);
      } catch (err) {
        this.logger.warn('Failed creating stripe price: ' + err.message);
      }
    }
    return saved;
  }

  async setAddOnsForPlanOption(planOptionId: string, settings: Array<SetAddonForPlanDto>) {
    const opt = await this.optionRepo.findOne({ where: { id: planOptionId } });
    if (!opt) throw new NotFoundException('Plan option not found');
    return this.planOptionAddOnRepo.manager.transaction(async (manager) => {
      const repo = manager.getRepository(PlanOptionAddOn);
      const results = [];
      for (const s of settings) {
        let row = await repo.findOne({
          where: {
            plan_option_id: planOptionId,
            addon_id: s.addon_id,
          },
        });
        if (!row) row = repo.create({
          plan_option_id: planOptionId, addon_id:
          s.addon_id,
        });
        row.included = !!s.included;
        if (row.included) {
          row.price_cents = null;
          row.currency = null;
          row.stripe_price_id =
            null;
        } else {
          row.price_cents = typeof s.price_cents !== 'undefined' ?
            Number(s.price_cents) : row.price_cents;
          row.currency = s.currency ?? row.currency ?? 'USD';
        }
        const saved = await repo.save(row);
        results.push(saved);
      }
      return results;
    });
  }
}
