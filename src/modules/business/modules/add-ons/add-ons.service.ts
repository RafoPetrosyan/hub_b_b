import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import Stripe from 'stripe';
import {
  CompanySubscription,
  CompanySubscriptionStatus,
} from '../company/modules/stripe-subscriptions/entities/company-subscription.entity';
import { CompanyAddOn } from './entities/add-on.entity';
import { AddOn } from '../../../common/modules/add-ons/entities/add-on.entity';
import { PlanOptionAddOn } from '../../../common/modules/add-ons/entities/plan-option-addon.entity';
import { Company } from '../company/entities/company.entity';
import { StripeSubscriptionsService } from '../company/modules/stripe-subscriptions/stripe-subscriptions.service';

const STRIPE_API_VERSION = '2026-01-28.clover';

@Injectable()
export class AddOnsService {
  private readonly logger = new Logger(AddOnsService.name);
  private readonly stripe: Stripe | null;

  constructor(
    @InjectRepository(AddOn)
    private readonly addOnRepo: Repository<AddOn>,
    @InjectRepository(PlanOptionAddOn)
    private readonly planOptionAddOnRepo: Repository<PlanOptionAddOn>,
    @InjectRepository(CompanyAddOn)
    private readonly companyAddOnRepo: Repository<CompanyAddOn>,
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
    @InjectRepository(CompanySubscription)
    private readonly companySubscriptionRepo: Repository<CompanySubscription>,
    private readonly stripeSubscriptionsService: StripeSubscriptionsService,
    private readonly dataSource: DataSource,
  ) {
    const key = process.env.STRIPE_SECRET_KEY ?? null;
    this.stripe = key ? new Stripe(key, { apiVersion: STRIPE_API_VERSION }) : null;
  }

  /**
   * Enable multiple add-ons for a company:
   * - create company_addons rows (idempotent)
   * - if company has an ACTIVE Stripe subscription, attach subscription.items for add-ons that have stripe_price_id
   * - persist stripe_subscription_item_id into company_addons rows
   *
   * Returns list of companyAddOn entities after operation.
   */
  async enableForCompany(companyId: string, addonIds: string[]): Promise<CompanyAddOn[]> {
    if (!addonIds || !Array.isArray(addonIds) || addonIds.length === 0) {
      throw new BadRequestException('addonIds array is required');
    }

    const addons = await this.addOnRepo.findBy(addonIds.map(id => ({ id })));
    const foundIds = new Set(addons.map(a => a.id));
    const missing = addonIds.filter(id => !foundIds.has(id));
    if (missing.length) {
      throw new NotFoundException(`Add-ons not found: ${missing.join(', ')}`);
    }

    return await this.addOnRepo.manager.transaction(async (manager) => {
      const companyAddOnRepo = manager.getRepository(CompanyAddOn);
      const savedRows: CompanyAddOn[] = [];

      for (const addon of addons) {
        let row = await companyAddOnRepo.findOne({ where: { company_id: companyId, addon_id: addon.id } });
        if (!row) {
          row = companyAddOnRepo.create({
            company_id: companyId,
            addon_id: addon.id,
            stripe_product_id: addon.stripe_product_id ?? null,
            stripe_subscription_item_id: null,
          });
          row = await companyAddOnRepo.save(row);
        } else {
          if (!row.stripe_product_id && addon.stripe_product_id) {
            row.stripe_product_id = addon.stripe_product_id;
            row = await companyAddOnRepo.save(row);
          }
        }
        savedRows.push(row);
      }

      if (!this.stripe) {
        this.logger.debug('Stripe not configured; skipping subscription item creation');
        return savedRows;
      }

      const activeSub = await manager.getRepository(CompanySubscription).findOne({
        where: { company_id: companyId, status: CompanySubscriptionStatus.ACTIVE },
      });

      if (!activeSub || !activeSub.stripe_subscription_id) {
        this.logger.debug('No active subscription found for company; skipping Stripe subscription item attach');
        return savedRows;
      }

      let subscriptionObj;
      try {
        subscriptionObj = await this.stripe.subscriptions.retrieve(activeSub.stripe_subscription_id, { expand: ['items'] });
      } catch (err) {
        this.logger.warn(`Failed to retrieve Stripe subscription ${activeSub.stripe_subscription_id}: ${err.message}`);
        return savedRows;
      }

      const existingPriceIds = new Set<string>(
        (subscriptionObj.items?.data ?? []).map((it) => it.price?.id).filter(Boolean),
      );

      const planPrices = activeSub.plan_id
        ? await this.getPlanOptionAddonPrices(activeSub.plan_id, savedRows.map((row) => row.addon_id))
        : new Map<string, string | null>();

      for (const row of savedRows) {
        const priceId = planPrices.get(row.addon_id) ?? row.stripe_product_id;
        if (!priceId) {
          continue;
        }

        const existingItem = (subscriptionObj.items?.data ?? []).find((it) => it.price?.id === priceId);
        if (existingItem) {
          if (!row.stripe_subscription_item_id) {
            row.stripe_subscription_item_id = existingItem.id;
            await companyAddOnRepo.save(row);
          }
          continue;
        }

        if (row.stripe_subscription_item_id) continue;

        try {
          const idempotencyKey = `company_${companyId}_addon_${row.addon_id}_attach_${Date.now()}`;
          const createdItem = await this.stripe.subscriptionItems.create(
            {
              subscription: activeSub.stripe_subscription_id,
              price: priceId,
              quantity: 1,
            },
            { idempotencyKey },
          );

          row.stripe_subscription_item_id = createdItem.id;
          row.stripe_product_id = createdItem.price?.id ?? row.stripe_product_id;
          await companyAddOnRepo.save(row);
        } catch (err) {
          this.logger.warn(`Failed to attach add-on ${row.addon_id} to subscription ${activeSub.stripe_subscription_id}: ${err.message}`);
        }
      }

      return await companyAddOnRepo.find({ where: { company_id: companyId, addon_id: In(addonIds) } });
    });
  }

  /**
   * Disable add-on for company:
   * - If subscription_item exists in Stripe, remove it
   * - Delete the company_addon row
   */
  async disableForCompany(companyId: string, addonId: string) {
    return await this.addOnRepo.manager.transaction(async (manager) => {
      const companyAddOnRepo = manager.getRepository(CompanyAddOn);
      const row = await companyAddOnRepo.findOne({ where: { company_id: companyId, addon_id: addonId } });
      if (!row) throw new NotFoundException('Company add-on not found');

      if (row.stripe_subscription_item_id && this.stripe) {
        try {
          await this.stripe.subscriptionItems.del(row.stripe_subscription_item_id);
        } catch (err) {
          this.logger.warn(`Failed to detach subscription item ${row.stripe_subscription_item_id}: ${err.message}`);
        }
      }

      await companyAddOnRepo.delete(row.id);
      return { deleted: true };
    });
  }

  /**
   * List enabled add-ons for company (local DB snapshot)
   */
  async listForCompany(companyId: string) {
    return this.companyAddOnRepo.find({ where: { company_id: companyId } });
  }

  /**
   * Attaches ALL enabled addons (for company) to the ACTIVE Stripe subscription.
   * - Only attaches addons that have a Stripe recurring price id (addon.stripe_price_id).
   * - Skips ones already attached (CompanyAddOn.stripe_subscription_item_id present).
   * - Uses idempotency keys.
   */
  async attachEnabledAddonsToStripeSubscription(companyId: string, planOptionId?: string | null) {
    const stripe = this.requireStripe();

    const sub = await this.getActiveSubscription(companyId);
    if (!sub?.stripe_subscription_id) {
      throw new BadRequestException('Company has no active Stripe subscription');
    }

    // Load enabled company addons + their addon data (need stripe_price_id)
    const companyAddons = await this.companyAddOnRepo.find({
      where: { company_id: companyId } as any,
      relations: ['addon'],
    });

    const effectivePlanId = planOptionId ?? sub.plan_id ?? null;
    const planPrices = effectivePlanId
      ? await this.getPlanOptionAddonPrices(effectivePlanId, companyAddons.map((ca) => ca.addon_id))
      : new Map<string, string | null>();

    const attachable = companyAddons.filter((ca) => {
      const priceId = planPrices.get(ca.addon_id) ?? (ca as any).addon?.stripe_price_id ?? null;
      if (!priceId) return false; // no recurring billing in Stripe for this addon
      if (ca.stripe_subscription_item_id) return false; // already attached
      return true;
    });

    if (attachable.length === 0) {
      return { attached: 0, skipped: companyAddons.length };
    }

    let attached = 0;

    await this.dataSource.transaction(async (tx) => {
      const txCompanyAddOnRepo = tx.getRepository(CompanyAddOn);

      for (const ca of attachable) {
        const priceId = (planPrices.get(ca.addon_id) ?? (ca as any).addon.stripe_price_id) as string;

        try {
          const item = await stripe.subscriptionItems.create(
            {
              subscription: sub.stripe_subscription_id,
              price: priceId,
              quantity: 1,
              metadata: {
                company_id: String(companyId),
                addon_id: String(ca.addon_id),
              },
            },
            {
              idempotencyKey: `subitem_add_${sub.stripe_subscription_id}_${priceId}_${companyId}_${ca.addon_id}`,
            },
          );

          await txCompanyAddOnRepo.update(
            { id: ca.id } as any,
            { stripe_subscription_item_id: item.id } as any,
          );

          attached += 1;
        } catch (err: any) {
          // If Stripe says it already exists, you still want to avoid duplicates:
          // Stripe doesn't provide a perfect "already exists" error for subscription items; keep it conservative.
          this.logger.warn(
            `Failed to attach addon ${ca.addon_id} (price ${priceId}) to subscription ${sub.stripe_subscription_id}: ${err?.message}`,
          );
        }
      }
    });

    return { attached };
  }

  async attachAddonsToSubscription(
    companyId: string,
    dto: { addon_ids: string[]; stripe_subscription_id?: string | null; plan_id?: string | null },
  ) {
    if (!dto.addon_ids?.length) return { attached: 0 };

    // Ensure enabled rows exist
    await this.enableForCompany(companyId, dto.addon_ids);

    const stripe = this.requireStripe();

    const activeSub = await this.getActiveSubscription(companyId);
    const stripeSubId =
      dto.stripe_subscription_id ??
      activeSub?.stripe_subscription_id ??
      null;

    if (!stripeSubId) {
      throw new BadRequestException('No Stripe subscription to attach add-ons to');
    }

    // Load companyAddons for given ids with addon relation
    const companyAddons = await this.companyAddOnRepo.find({
      where: { company_id: companyId, addon_id: In(dto.addon_ids as any) } as any,
      relations: ['addon'],
    });

    const planOptionId = dto.plan_id ?? activeSub?.plan_id ?? null;
    const planPrices = planOptionId
      ? await this.getPlanOptionAddonPrices(planOptionId, companyAddons.map((ca) => ca.addon_id))
      : new Map<string, string | null>();

    const attachable = companyAddons.filter((ca) => {
      const priceId = planPrices.get(ca.addon_id) ?? (ca as any).addon?.stripe_price_id ?? null;
      if (!priceId) return false;
      if (ca.stripe_subscription_item_id) return false;
      return true;
    });

    let attached = 0;

    await this.dataSource.transaction(async (tx) => {
      const txCompanyAddOnRepo = tx.getRepository(CompanyAddOn);

      for (const ca of attachable) {
        const priceId = (planPrices.get(ca.addon_id) ?? ca.addon.stripe_product_id) as string;

        try {
          const item = await stripe.subscriptionItems.create(
            {
              subscription: stripeSubId,
              price: priceId,
              quantity: 1,
              metadata: {
                company_id: String(companyId),
                addon_id: String(ca.addon_id),
              },
            },
            {
              idempotencyKey: `subitem_add_${stripeSubId}_${priceId}_${companyId}_${ca.addon_id}`,
            },
          );

          await txCompanyAddOnRepo.update(
            { id: ca.id },
            { stripe_subscription_item_id: item.id },
          );

          attached += 1;
        } catch (err: any) {
          this.logger.warn(
            `Failed to attach addon ${ca.addon_id} (price ${priceId}) to subscription ${stripeSubId}: ${err?.message}`,
          );
        }
      }
    });

    return { attached };
  }

  private requireStripe(): Stripe {
    const stripe = this.stripeSubscriptionsService.stripe as (Stripe | undefined);
    if (!stripe) throw new BadRequestException('Stripe is not configured');
    return stripe;
  }

  private async getActiveSubscription(companyId: string) {
    const sub =
      (await this.companySubscriptionRepo.findOne({
        where: { company_id: companyId, status: CompanySubscriptionStatus.ACTIVE },
        order: { created_at: 'DESC' },
      })) ??
      (await this.companySubscriptionRepo.findOne({
        where: { company_id: companyId, status: CompanySubscriptionStatus.TRIALING },
        order: { created_at: 'DESC' },
      }));

    if (!sub) throw new NotFoundException('Company subscription not found');
    return sub;
  }

  private async getPlanOptionAddonPrices(planOptionId: string, addonIds: string[]) {
    const rows = await this.planOptionAddOnRepo.find({
      where: { plan_option_id: planOptionId, addon_id: In(addonIds) },
    });
    const map = new Map<string, string | null>();
    for (const row of rows) {
      map.set(row.addon_id, row.stripe_price_id ?? null);
    }
    return map;
  }
}
