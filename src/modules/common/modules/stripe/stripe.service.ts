import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { config as dotenvConfig } from 'dotenv';

const STRIPE_API_VERSION = '2026-01-28.clover';

dotenvConfig({ path: '.env' });

export type ProductPricePair = { product: Stripe.Product; price: Stripe.Price };
export type CouponPromoResult = {
  coupon: Stripe.Coupon;
  promotionCode?: Stripe.PromotionCode | null;
};

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  readonly stripe: Stripe | null;

  constructor() {
    const key = process.env.STRIPE_SECRET_KEY || null;
    if (!key) {
      this.logger.warn('StripeService: STRIPE_SECRET_KEY is not set — running in DB-only mode');
      this.stripe = null;
      return;
    }

    // Use any cast for apiVersion to avoid TypeScript mismatch with local installed types.
    this.stripe = new Stripe(key, { apiVersion: STRIPE_API_VERSION as any });
    this.logger.log(`StripePlanSyncService: initialized (apiVersion=${STRIPE_API_VERSION})`);
  }

  /**
   * Create Stripe Product + Price for a plan.
   * - planId used for idempotency for product creation.
   * - price idempotency uses timestamp so repeated price creations produce new prices.
   */
  async createProductAndPrice(params: {
    planId: string;
    name: string;
    description?: string | null;
    priceCents: number;
    currency?: string;
    durationUnit?: 'day' | 'month' | 'year';
    durationCount?: number;
    metadata?: Record<string, any> | null;
  }): Promise<ProductPricePair> {
    const stripe = this.requireStripe();
    const {
      planId,
      name,
      description,
      priceCents,
      currency = 'usd',
      durationUnit,
      durationCount = 1,
      metadata,
    } = params;

    try {
      // product creation (idempotent by planId)
      const product = await stripe.products.create(
        {
          name,
          description: description ?? undefined,
          metadata: metadata ?? undefined,
        },
        { idempotencyKey: `product_create_plan_${planId}` },
      );

      // price payload
      const pricePayload: Stripe.PriceCreateParams = {
        product: product.id,
        unit_amount: Number(priceCents),
        currency: (currency || 'usd').toLowerCase(),
      };

      if (durationUnit) {
        pricePayload.recurring = {
          interval: this.mapDurationUnitToStripeInterval(durationUnit) as Stripe.PriceCreateParams.Recurring.Interval,
          interval_count: durationCount,
        };
      }

      const price = await stripe.prices.create(pricePayload, {
        // price idempotency key includes timestamp to allow multiple prices over time
        idempotencyKey: `price_create_plan_${planId}_${Date.now()}`,
      });

      this.logger.log(`Stripe product+price created for plan ${planId}: product=${product.id} price=${price.id}`);
      return { product, price };
    } catch (err) {
      this.logger.error('createProductAndPrice failed', err as any);
      throw new InternalServerErrorException('Stripe create product/price failed: ' + (err as any).message);
    }
  }

  /**
   * Update Stripe Product name/description/metadata.
   * Does not touch prices (prices are immutable).
   */
  async updateProduct(params: {
    stripeProductId: string;
    name?: string;
    description?: string | null;
    metadata?: Record<string, any> | null;
  }): Promise<Stripe.Product> {
    const stripe = this.requireStripe();
    const { stripeProductId, name, description, metadata } = params;

    try {
      const updated = await stripe.products.update(stripeProductId, {
        name,
        description: description ?? undefined,
        metadata: metadata ?? undefined,
      });
      this.logger.log(`Stripe product updated: ${stripeProductId}`);
      return updated;
    } catch (err) {
      this.logger.error('updateProduct failed', err as any);
      throw new InternalServerErrorException('Stripe update product failed: ' + (err as any).message);
    }
  }

  /**
   * Create a new Stripe Price for an existing product (use when plan price changes).
   * Returns created Price.
   */
  async createPriceForProduct(params: {
    stripeProductId: string;
    planId?: string; // used for idempotency key if provided
    priceCents: number;
    currency?: string;
    durationUnit?: 'day' | 'month' | 'year';
    durationCount?: number;
  }): Promise<Stripe.Price> {
    const stripe = this.requireStripe();
    const {
      stripeProductId,
      planId = 'unknown',
      priceCents,
      currency = 'usd',
      durationUnit,
      durationCount = 1,
    } = params;

    try {
      const payload: Stripe.PriceCreateParams = {
        product: stripeProductId,
        unit_amount: Number(priceCents),
        currency: (currency || 'usd').toLowerCase(),
      };

      if (durationUnit) {
        payload.recurring = {
          interval: this.mapDurationUnitToStripeInterval(durationUnit) as Stripe.PriceCreateParams.Recurring.Interval,
          interval_count: durationCount,
        };
      }

      const price = await stripe.prices.create(payload, { idempotencyKey: `create_price_${planId}_${Date.now()}` });
      this.logger.log(`Stripe price created for product ${stripeProductId}: price=${price.id}`);
      return price;
    } catch (err) {
      this.logger.error('createPriceForProduct failed', err as any);
      throw new InternalServerErrorException('Stripe create price failed: ' + (err as any).message);
    }
  }

  /**
   * Create Coupon and (optionally) PromotionCode referencing that coupon.
   * Returns created coupon and optional promotionCode.
   *
   * Behavior (Clover API): create coupon, then call promotionCodes.create({ coupon: coupon.id, code })
   */
  async createCouponAndPromotionCode(params: {
    promoId?: string; // for idempotency metadata
    title: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number; // percent (0..100) or fixed cents
    code?: string | null; // optional customer-facing code
    currency?: string; // required when fixed
    metadata?: Record<string, any> | null;
    duration?: 'once' | 'repeating' | 'forever';
    repeatingDuration?: number | null; // months if duration === 'repeating'
  }): Promise<CouponPromoResult> {
    const stripe = this.requireStripe();
    const {
      promoId = 'unknown',
      title,
      discountType,
      discountValue,
      code,
      currency = 'usd',
      metadata,
      duration = 'once',
      repeatingDuration,
    } = params;

    try {
      const couponPayload: Stripe.CouponCreateParams = {
        name: title,
        metadata: metadata ?? undefined,
        duration: duration as Stripe.CouponCreateParams.Duration,
      };

      if (duration === 'repeating' && typeof repeatingDuration === 'number') {
        couponPayload.duration_in_months = repeatingDuration;
      }

      if (discountType === 'percentage') {
        couponPayload.percent_off = Number(discountValue);
      } else {
        couponPayload.amount_off = Number(discountValue);
        couponPayload.currency = (currency || 'usd').toLowerCase();
      }

      const coupon = await stripe.coupons.create(couponPayload, { idempotencyKey: `create_coupon_${promoId}` });

      let promotionCode: Stripe.PromotionCode | null = null;

      if (code) {
        // Create PromotionCode referencing coupon
        promotionCode = await stripe.promotionCodes.create({
          promotion: {
            coupon: coupon.id,
            type: 'coupon',
          },
          code,
          metadata: metadata ?? undefined,
          active: true,
        }, { idempotencyKey: `create_promo_code_${promoId}_${code}` });
      }

      this.logger.log(`Stripe coupon created: coupon=${coupon.id} promoCode=${promotionCode?.id ?? 'none'}`);
      return { coupon, promotionCode };
    } catch (err) {
      this.logger.error('createCouponAndPromotionCode failed', err as any);
      throw new InternalServerErrorException('Stripe create coupon/promotion code failed: ' + (err as any).message);
    }
  }

  /**
   * Annotate (archive) product and price metadata as archived (best-effort).
   * Does not attempt to delete Stripe objects.
   */
  async archiveProductAndPrice(params: {
    stripeProductId?: string | null;
    stripePriceId?: string | null;
    metadata?: Record<string, any> | null;
  }): Promise<void> {
    const stripe = this.requireStripe();
    const { stripeProductId, stripePriceId, metadata } = params;

    if (stripeProductId) {
      try {
        await stripe.products.update(stripeProductId, {
          metadata: { ...(metadata ?? {}), archived_by: 'app' },
        } as any);
        this.logger.log(`Annotated Stripe product ${stripeProductId} as archived`);
      } catch (err) {
        this.logger.warn('archiveProductAndPrice - product update failed: ' + (err as any).message);
      }
    }

    if (stripePriceId) {
      try {
        await stripe.prices.update(stripePriceId, {
          metadata: { ...(metadata ?? {}), archived_by: 'app' },
        } as any);
        this.logger.log(`Annotated Stripe price ${stripePriceId} as archived`);
      } catch (err) {
        this.logger.warn('archiveProductAndPrice - price update failed: ' + (err as any).message);
      }
    }
  }

  private requireStripe(): Stripe {
    if (!this.stripe) throw new InternalServerErrorException('Stripe client not configured (STRIPE_SECRET_KEY missing)');
    return this.stripe;
  }

  private mapDurationUnitToStripeInterval(unit: 'day' | 'month' | 'year') {
    if (unit === 'day') return 'day';
    if (unit === 'year') return 'year';
    return 'month';
  }
}
