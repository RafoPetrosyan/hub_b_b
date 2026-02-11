// db/seeders/1769162728253-subscription-plans.ts
import { Seeder } from 'typeorm-extension';
import { DataSource } from 'typeorm';
import Stripe from 'stripe';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Tier } from '../../modules/common/modules/subscription-plans/entities/tier.entity';
import { PlanOption } from '../../modules/common/modules/subscription-plans/entities/plan-option.entity';
import { PlanPrice } from '../../modules/common/modules/subscription-plans/entities/plan-price.entity';
import { AddOn } from '../../modules/common/modules/add-ons/entities/add-on.entity';
import { PlanOptionAddOn } from '../../modules/common/modules/add-ons/entities/plan-option-addon.entity';

const STRIPE_API_VERSION = '2026-01-28.clover';

type BenefitNode = { name: string; children?: { name: string }[] };

function readJson<T>(filename: string): T {
  const raw = readFileSync(join(__dirname, filename), 'utf-8');
  return JSON.parse(raw) as T;
}

function normalizeBenefits(input: any): BenefitNode[] {
  if (!Array.isArray(input)) return [];
  const result: BenefitNode[] = [];

  for (const item of input) {
    if (typeof item === 'string') {
      const name = (item as string).trim();
      if (name) result.push({ name });
      continue;
    }

    if (!item || typeof item !== 'object') continue;
    const name = String(item.name ?? '').trim();
    if (!name) continue;

    const childrenRaw = Array.isArray(item.children) ? item.children : [];
    const children = childrenRaw
      .map((child: any) => {
        if (typeof child === 'string') {
          const childName = child.trim();
          return childName ? { name: childName } : null;
        }
        if (child && typeof child === 'object') {
          const childName = String(child.name ?? '').trim();
          return childName ? { name: childName } : null;
        }
        return null;
      })
      .filter(Boolean) as { name: string }[];

    result.push(children.length ? { name, children } : { name });
  }

  return result;
}

export default class SubscriptionPlans implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    const tierRepo = dataSource.getRepository(Tier);
    const optionRepo = dataSource.getRepository(PlanOption);
    const priceRepo = dataSource.getRepository(PlanPrice);
    const addOnRepo = dataSource.getRepository(AddOn);
    const planOptionAddOnRepo = dataSource.getRepository(PlanOptionAddOn);

    const tiers = readJson<Array<any>>('tiers.json');
    const addOns = readJson<Array<any>>('add-ons.json');
    const planOptions = readJson<Array<any>>('subscription-plan-options.json');

    // --- 1) Seed tiers ---
    for (const t of tiers) {
      if (!t?.key) continue;
      const existing = await tierRepo.findOne({ where: { key: t.key } });
      const payload = {
        key: String(t.key),
        name: String(t.name ?? t.key),
        description: t.description ?? null,
        benefits: normalizeBenefits(t.benefits),
        max_users: typeof t.max_users === 'number' ? t.max_users : null,
        max_locations: typeof t.max_locations === 'number' ? t.max_locations : null,
      };
      if (!existing) {
        await tierRepo.save(tierRepo.create(payload));
      } else {
        await tierRepo.update(existing.id, payload as any);
      }
    }

    // --- 2) Seed add-ons ---
    for (const a of addOns) {
      const slug = String(a.slug ?? a.key ?? '').trim();
      if (!slug) continue;
      const existing = await addOnRepo.findOne({ where: { slug } });
      const payload = {
        name: String(a.name ?? slug),
        description: a.description ?? a.detailed_description ?? null,
        detailed_description: a.detailed_description ?? null,
        best_for: a.best_for ?? null,
        benefits: normalizeBenefits(a.benefits),
        slug,
        price_cents: Number(a.price_cents ?? 0),
        currency: a.currency ?? 'USD',
      };
      if (!existing) {
        await addOnRepo.save(addOnRepo.create(payload));
      } else {
        await addOnRepo.update(existing.id, payload as any);
      }
    }

    // --- 3) Seed plan options + prices ---
    for (const p of planOptions) {
      const tierKeyRaw = String(p.tier ?? '').replace(/[{}]/g, '').trim().toLowerCase();
      const tierKey = tierKeyRaw === 'enterprice' ? 'enterprise' : tierKeyRaw;
      if (!tierKey) continue;

      const tier = await tierRepo.findOne({ where: { key: tierKey } });
      if (!tier) {
        console.warn(`Tier not found for key: ${tierKey} (plan option: ${p.key})`);
        continue;
      }

      const key = String(p.key ?? '').trim();
      if (!key) continue;

      const existing = await optionRepo.findOne({ where: { tier_id: tier.id, key } });
      const stripeProductId = p.stripe_product_id && p.stripe_product_id !== '{generated}'
        ? String(p.stripe_product_id)
        : null;

      const payload = {
        tier_id: tier.id,
        key,
        name: String(p.name ?? key),
        description: p.description ?? null,
        benefits: normalizeBenefits(p.benefits),
        is_active: typeof p.is_active === 'boolean' ? p.is_active : true,
        stripe_product_id: stripeProductId,
      };

      let option: PlanOption;
      if (!existing) {
        option = optionRepo.create({
          ...payload,
          extra_practitioner_price_cents: null,
          website_included: false,
          website_price_monthly_cents: null,
          website_price_yearly_cents: null,
          educator_upgrade_monthly_cents: null,
        });
        option = await optionRepo.save(option);
      } else {
        await optionRepo.update(existing.id, payload);
        option = (await optionRepo.findOne({ where: { id: existing.id } }))!;
      }

      const monthlyCents = Number(p.monthly_cents ?? 0);
      let monthly = await priceRepo.findOne({ where: { plan_option_id: option.id, interval: 'monthly' } });
      if (!monthly) {
        monthly = priceRepo.create({
          plan_option_id: option.id,
          interval: 'monthly',
          price_cents: monthlyCents,
          currency: p.currency ?? 'USD',
        });
        await priceRepo.save(monthly);
      } else {
        monthly.price_cents = monthlyCents;
        monthly.currency = p.currency ?? monthly.currency ?? 'USD';
        await priceRepo.save(monthly);
      }

      if (typeof p.yearly_cents_multiplier !== 'undefined' && p.yearly_cents_multiplier !== null) {
        const yearlyTotal = Math.round(monthlyCents * Number(p.yearly_cents_multiplier) * 12);
        let yearly = await priceRepo.findOne({ where: { plan_option_id: option.id, interval: 'yearly' } });
        if (!yearly) {
          yearly = priceRepo.create({
            plan_option_id: option.id,
            interval: 'yearly',
            price_cents: yearlyTotal,
            currency: p.currency ?? 'USD',
          });
          await priceRepo.save(yearly);
        } else {
          yearly.price_cents = yearlyTotal;
          yearly.currency = p.currency ?? yearly.currency ?? 'USD';
          await priceRepo.save(yearly);
        }
      }
    }

    // --- 4) Seed plan option add-ons (from add-ons.json) ---
    const optionRows = await optionRepo.find();
    const addOnRows = await addOnRepo.find();
    const addOnBySlug = new Map(addOnRows.map((a) => [a.slug, a]));
    for (const a of addOns) {
      const slug = String(a.slug ?? a.key ?? '').trim();
      if (!slug) continue;
      const addon = addOnBySlug.get(slug);
      if (!addon) continue;
      const priceCents = Number(a.price_cents ?? addon.price_cents ?? 0);
      const currency = a.currency ?? addon.currency ?? 'USD';

      for (const opt of optionRows) {
        let row = await planOptionAddOnRepo.findOne({
          where: { plan_option_id: opt.id, addon_id: addon.id },
        });
        if (!row) {
          row = planOptionAddOnRepo.create({
            plan_option_id: opt.id,
            addon_id: addon.id,
          });
        }
        row.included = false;
        row.price_cents = priceCents;
        row.currency = currency;
        row = await planOptionAddOnRepo.save(row);
      }
    }

    // --- 5) Stripe synchronization (only if STRIPE_SECRET_KEY provided) ---
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      console.log('STRIPE_SECRET_KEY not set — skipping Stripe sync.');
      return;
    }

    const stripe = new Stripe(stripeKey, { apiVersion: STRIPE_API_VERSION as any });

    // Helper to create product for a plan option if missing (idempotent by DB check)
    async function ensurePlanOptionProduct(opt: PlanOption) {
      if (opt.stripe_product_id) return opt.stripe_product_id;
      try {
        const product = await stripe.products.create({
          name: opt.name,
          description: opt.description ?? undefined,
          metadata: { plan_option_id: opt.id, tier_id: opt.tier_id },
        }, { idempotencyKey: `product_planoption_${opt.id}` });
        await optionRepo.update(opt.id, { stripe_product_id: product.id } as any);
        return product.id;
      } catch (err) {
        console.warn('Failed to create stripe product for plan option', opt.id, (err as any).message);
        return null;
      }
    }

    async function ensurePlanPriceStripe(priceRow: PlanPrice, planOptionProductId: string | null) {
      if (!planOptionProductId) return null;
      if (priceRow.stripe_price_id) return priceRow.stripe_price_id;
      try {
        const stripePrice = await stripe.prices.create({
          product: planOptionProductId,
          unit_amount: Number(priceRow.price_cents),
          currency: (priceRow.currency ?? 'USD').toLowerCase(),
          recurring: { interval: priceRow.interval === 'monthly' ? 'month' : 'year' },
          metadata: { plan_price_id: priceRow.id, plan_option_id: priceRow.plan_option_id },
        }, { idempotencyKey: `price_planprice_${priceRow.id}` });
        await priceRepo.update(priceRow.id, { stripe_price_id: stripePrice.id } as any);
        return stripePrice.id;
      } catch (err) {
        console.warn('Failed to create stripe price for plan price', priceRow.id, (err as any).message);
        return null;
      }
    }

    const allPlanOptions = await optionRepo.find();
    for (const opt of allPlanOptions) {
      const productId = await ensurePlanOptionProduct(opt);
      const prices = await priceRepo.find({ where: { plan_option_id: opt.id } });
      for (const p of prices) {
        await ensurePlanPriceStripe(p, productId);
      }
    }

    const allAddons = await addOnRepo.find();
    for (const addon of allAddons) {
      if (!addon.stripe_product_id) {
        try {
          const prod = await stripe.products.create({
            name: addon.name,
            description: addon.description ?? undefined,
            metadata: { addon_id: addon.id },
          }, { idempotencyKey: `product_addon_${addon.id}` });
          await addOnRepo.update(addon.id, { stripe_product_id: prod.id } as any);
          addon.stripe_product_id = prod.id;
        } catch (err) {
          console.warn('Failed to create stripe product for addon', addon.id, (err as any).message);
        }
      }
    }

    const poaRows = await planOptionAddOnRepo.find();
    for (const poa of poaRows) {
      if (poa.included) continue;
      if (!poa.price_cents) continue;
      const addon = await addOnRepo.findOne({ where: { id: poa.addon_id } });
      if (!addon) continue;
      if (!addon.stripe_product_id) {
        try {
          const prod = await stripe.products.create({
            name: addon.name,
            description: addon.description ?? undefined,
            metadata: { addon_id: addon.id },
          }, { idempotencyKey: `product_addon_${addon.id}` });
          await addOnRepo.update(addon.id, { stripe_product_id: prod.id } as any);
          addon.stripe_product_id = prod.id;
        } catch (err) {
          console.warn('Failed to create stripe product for addon during plan-option-addon syncing', addon.id, (err as any).message);
          continue;
        }
      }

      if (poa.stripe_price_id) continue;

      try {
        const stripePrice = await stripe.prices.create({
          product: addon.stripe_product_id!,
          unit_amount: Number(poa.price_cents),
          currency: (poa.currency ?? 'USD').toLowerCase(),
          recurring: { interval: 'month' },
          metadata: { plan_option_addon_id: poa.id, plan_option_id: poa.plan_option_id, addon_id: poa.addon_id },
        }, { idempotencyKey: `price_planoption_addon_${poa.id}` });
        await planOptionAddOnRepo.update(poa.id, { stripe_price_id: stripePrice.id } as any);
      } catch (err) {
        console.warn('Failed to create stripe price for plan_option_addon', poa.id, (err as any).message);
      }
    }

    console.log('Seeder + Stripe sync finished.');
  }
}
