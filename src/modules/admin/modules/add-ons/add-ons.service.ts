import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import Stripe from 'stripe';
import { AddOn } from '../../../common/modules/add-ons/entities/add-on.entity';
import { PlanOptionAddOn } from '../../../common/modules/add-ons/entities/plan-option-addon.entity';
import { CompanyAddOn } from '../../../business/modules/add-ons/entities/add-on.entity';
import { PlanOption } from '../../../common/modules/subscription-plans/entities/plan-option.entity';
import {
  CompanySubscription,
  CompanySubscriptionStatus,
} from '../../../business/modules/company/modules/stripe-subscriptions/entities/company-subscription.entity';
import { SetAddonForPlanDto } from './dto/set-addon-for-plan.dto';
import { CreateAddOnDto } from './dto/create-add-on.dto';

const STRIPE_API_VERSION = '2026-01-28.clover';

@Injectable()
export class AddOnsService {
  private readonly logger = new Logger(AddOnsService.name);
  private readonly stripe: Stripe | null;

  constructor(
    @InjectRepository(AddOn) private readonly addonRepo: Repository<AddOn>,
    @InjectRepository(PlanOptionAddOn) private readonly planOptionAddOnRepo:
    Repository<PlanOptionAddOn>,
    @InjectRepository(CompanyAddOn) private readonly companyAddOnRepo:
    Repository<CompanyAddOn>,
    @InjectRepository(PlanOption) private readonly planOptionRepo:
    Repository<PlanOption>,
    @InjectRepository(CompanySubscription) private readonly companySubscriptionRepo: Repository<CompanySubscription>,
  ) {
    const key = process.env.STRIPE_SECRET_KEY ?? null;
    this.stripe = key ? new Stripe(key, {
      apiVersion: STRIPE_API_VERSION as
        any,
    }) : null;
  }

  private slugify(input: string) {
    return input.toString().trim().toLowerCase().replace(/[^a-z0-9]+/g,
      '-').replace(/^-+|-+$/g, '');
  }

  async create(dto: CreateAddOnDto) {
    const slug = dto.slug ? this.slugify(dto.slug) : await
      this.ensureUniqueSlug(dto.name);
    const exists = await this.addonRepo.findOne({ where: { slug } });
    if (exists) throw new BadRequestException('Add-on with this slug exists');
    const row = this.addonRepo.create({
      name: dto.name, description:
        dto.description ?? null,
      detailed_description: dto.detailed_description ?? null,
      best_for: dto.best_for ?? null,
      benefits: dto.benefits ?? null,
      slug, price_cents: Number(dto.price_cents ?? 0),
      currency: dto.currency ?? 'USD',
    });
    const saved = await this.addonRepo.save(row);
// optionally create Stripe product here (best-effort)
    if (this.stripe) {
      try {
        const prod = await this.stripe.products.create({
          name: saved.name,
          description: saved.description ?? undefined, metadata: {
            addon_id:
            saved.id,
          },
        });
        saved.stripe_product_id = prod.id;
        await this.addonRepo.save(saved);
      } catch (err) {
        this.logger.warn('Stripe product creation failed for addon: ' + (err as
          any).message);
      }
    }
    return saved;
  }

  private async ensureUniqueSlug(base: string) {
    let slug = this.slugify(base);
    if (!slug) slug = 'addon';
    let candidate = slug;
    let idx = 0;
    while (await this.addonRepo.findOne({ where: { slug: candidate } })) {
      idx++;
      candidate = `${slug}-${idx}`;
    }
    return candidate;
  }

  async setAddOnForPlanOption(planOptionId: string, dto: SetAddonForPlanDto) {
    const plan = await this.planOptionRepo.findOne({
      where: {
        id:
        planOptionId,
      },
    });
    if (!plan) throw new NotFoundException('Plan not found');
    const addon = await this.addonRepo.findOne({ where: { id: dto.addon_id } });
    if (!addon) throw new NotFoundException('Add-on not found');
    return this.planOptionAddOnRepo.manager.transaction(async (manager) => {
      const repo = manager.getRepository(PlanOptionAddOn);
      let row = await repo.findOne({
        where: {
          plan_option_id: planOptionId,
          addon_id: dto.addon_id,
        },
      });
      if (!row) row = repo.create({
        plan_option_id: planOptionId, addon_id:
        dto.addon_id,
      });
      row.included = !!dto.included;
      if (row.included) {
        row.price_cents = null;
        row.currency = null;
        row.stripe_price_id = null;
        row = await repo.save(row);
        return row;
      }
      if (typeof dto.price_cents === 'undefined' && typeof row.price_cents ===
        'undefined') throw new BadRequestException('price_cents required when not included');
      if (typeof dto.price_cents !== 'undefined') row.price_cents =
        Number(dto.price_cents);
      row.currency = dto.currency ?? row.currency ?? 'USD';
      // ensure addon has stripe product
      if (this.stripe && row.price_cents != null) {
        let stripeProductId = addon.stripe_product_id;
        if (!stripeProductId) {
          const p = await this.stripe.products.create({
            name: addon.name,
            description: addon.description ?? undefined, metadata: {
              addon_id:
              addon.id,
            },
          });
          stripeProductId = p.id;
          await manager.getRepository(AddOn).update(addon.id, {
            stripe_product_id: stripeProductId,
          });
        }
        const stripePrice = await this.stripe.prices.create({
          product:
          stripeProductId, unit_amount: Number(row.price_cents), currency:
            (row.currency ?? 'USD').toLowerCase(), recurring: { interval: 'month' },
          metadata: { addon_id: addon.id, plan_option_id: planOptionId },
        });
        row.stripe_price_id = stripePrice.id;
      }
      row = await repo.save(row);
      return row;
    });
  }

  async enableForCompany(companyId: string, addonIds: string[]) {
    if (!Array.isArray(addonIds) || addonIds.length === 0) throw new
    BadRequestException('addonIds required');
    const addons = await this.addonRepo.findBy({ id: In(addonIds) });
    const foundIds = new Set(addons.map(a => a.id));
    const missing = addonIds.filter(id => !foundIds.has(id));
    if (missing.length) throw new NotFoundException(`Add-ons not found: ${missing.join(', ')}`);
    return this.addonRepo.manager.transaction(async (manager) => {
      const companyAddOnRepo = manager.getRepository(CompanyAddOn);
      const savedRows: CompanyAddOn[] = [];
      for (const addon of addons) {
        let row = await companyAddOnRepo.findOne({
          where: {
            company_id:
            companyId, addon_id: addon.id,
          },
        });
        if (!row) {
          row = companyAddOnRepo.create({
            company_id: companyId, addon_id:
            addon.id,
            stripe_product_id: addon.stripe_product_id ?? null,
          });
          row = await companyAddOnRepo.save(row);
        } else {
          if (!row.stripe_product_id && addon.stripe_product_id) {
            row.stripe_product_id = addon.stripe_product_id;
            row = await
              companyAddOnRepo.save(row);
          }
        }
        savedRows.push(row);
      }
      if (!this.stripe) return savedRows;
      const activeSub = await
        manager.getRepository(CompanySubscription).findOne({
          where: {
            company_id: companyId,
            status: CompanySubscriptionStatus.ACTIVE,
          },
        });
      if (!activeSub || !activeSub.stripe_subscription_id) return savedRows;
      let subscriptionObj;
      try {
        subscriptionObj = await
          this.stripe.subscriptions.retrieve(activeSub.stripe_subscription_id, {
            expand:
              ['items'],
          });
      } catch (err) {
        this.logger.warn('Failed to retrieve stripe subscription: ' + err.message);
        return savedRows;
      }
      const existingPriceIds = new Set((subscriptionObj.items?.data ??
        []).map((it: any) => it.price?.id).filter(Boolean));
      for (const row of savedRows) {
        if (!row.stripe_product_id) continue;
        if (existingPriceIds.has(row.stripe_product_id)) continue;
        try {
          const createdItem = await this.stripe.subscriptionItems.create({
            subscription: activeSub.stripe_subscription_id,
            plan: row.stripe_product_id,
          }, { idempotencyKey: `company_${companyId}_addon_${row.addon_id}_${Date.now()}` });
          row.stripe_subscription_item_id = createdItem.id;
          await companyAddOnRepo.save(row);
        } catch (err) {
          this.logger.warn(`Failed to attach addon ${row.addon_id}: ${err.message}`);
        }
      }
      return await companyAddOnRepo.find({ where: { company_id: companyId, addon_id: In(addonIds) } });
    });
  }

  async disableForCompany(companyId: string, addonIds: string[]) {
    return this.addonRepo.manager.transaction(async (manager) => {
      const companyAddOnRepo = manager.getRepository(CompanyAddOn);
      const addons = await this.addonRepo.findBy({ id: In(addonIds) });
      if (!addons || addons.length === 0) throw new NotFoundException('Company add-on not found');
      for (let row of addons) {
        if (row.stripe_product_id && this.stripe) {
          try {
            await
              this.stripe.products.del(row.stripe_product_id);
          } catch (err) {
            this.logger.warn('Failed to detach subscription item: ' + err.message);
          }
        }
        await companyAddOnRepo.delete(row.id);
      }
      return { deleted: true };
    });
  }

  async listForCompany(companyId: string) {
    return this.companyAddOnRepo.find({ where: { company_id: companyId } });
  }

  async delete(addonId: string) {
    if (!(await this.addonRepo.exists({where: {id: addonId}}))) {
      throw new NotFoundException('Add-on not found');
    }

    await this.addonRepo.delete(addonId);

    return { deleted: true };
  }
}
