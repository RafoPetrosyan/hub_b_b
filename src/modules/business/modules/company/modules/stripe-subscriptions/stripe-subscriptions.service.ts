import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import Stripe from 'stripe';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanySubscription, CompanySubscriptionStatus } from './entities/company-subscription.entity';
import { SubscriptionPeriod } from './entities/subscription-period.entity';
import { Transaction, TransactionStatus } from './entities/transaction.entity';
import { Company } from '../../entities/company.entity';
import { PlanOption } from '../../../../../common/modules/subscription-plans/entities/plan-option.entity';
import { PlanOptionAddOn } from '../../../../../common/modules/add-ons/entities/plan-option-addon.entity';
import { AddOn } from '../../../../../common/modules/add-ons/entities/add-on.entity';
import { PlanPrice } from '../../../../../common/modules/subscription-plans/entities/plan-price.entity';

const STRIPE_API_VERSION = '2026-01-28.clover';

@Injectable()
export class StripeSubscriptionsService {
  public readonly stripe: Stripe | null;
  private readonly logger = new Logger(StripeSubscriptionsService.name);

  constructor(
    @InjectRepository(Company) private readonly companyRepo: Repository<Company>,
    @InjectRepository(PlanOption) private readonly planRepo: Repository<PlanOption>,
    @InjectRepository(PlanPrice) private readonly priceRepo: Repository<PlanPrice>,
    @InjectRepository(PlanOptionAddOn) private readonly planOptionAddOnRepo: Repository<PlanOptionAddOn>,
    @InjectRepository(AddOn) private readonly addOnRepo: Repository<AddOn>,
    @InjectRepository(CompanySubscription) private readonly companySubscriptionRepo: Repository<CompanySubscription>,
    @InjectRepository(SubscriptionPeriod) private readonly periodRepo: Repository<SubscriptionPeriod>,
    @InjectRepository(Transaction) private readonly txRepo: Repository<Transaction>,
  ) {
    const key = process.env.STRIPE_SECRET_KEY || null;
    if (key) {
      this.stripe = new Stripe(key, { apiVersion: STRIPE_API_VERSION as any });
      this.logger.log('Stripe client initialized in StripeSubscriptionsService');
    } else {
      this.stripe = null;
      this.logger.warn('Stripe not configured; running in DB-only mode');
    }
  }

  // ---- Called during company registration or later when company selects plan ----
  async createCompanySubscription(dto: {
    company_id: string;
    plan_id: string;
    price_id: string;
    payment_method_id?: string;
    coupon_code?: string;
    addon_ids?: string[];
    additional_practitioners?: number;
    has_website?: boolean;
  }) {
    const { company_id, plan_id, price_id, payment_method_id, coupon_code, addon_ids, additional_practitioners, has_website } = dto;

    const company = await this.companyRepo.findOne({ where: { id: company_id } });
    if (!company) throw new NotFoundException('Company not found');

    const plan = await this.planRepo.findOne({ where: { id: plan_id } });
    if (!plan) throw new NotFoundException('Plan not found');

    const price = await this.priceRepo.findOne({ where: { id: price_id } });
    if (!price) throw new NotFoundException('Plan not found');

    const snapshot = await this.buildSubscriptionSnapshot(plan_id, addon_ids ?? [], {
      additional_practitioners,
      has_website,
    });

    if (!this.stripe) {
      return this.companySubscriptionRepo.save(
        this.companySubscriptionRepo.create({
          company_id,
          plan_id,
          price_id,
          status: CompanySubscriptionStatus.INCOMPLETE,
          metadata: { stripe_disabled: true },
          plan_snapshot: snapshot.plan_snapshot,
          addons_snapshot: snapshot.addons_snapshot,
          addon_ids: snapshot.addon_ids,
          max_users: snapshot.max_users,
        }),
      );
    }

    const stripe = this.requireStripe();

    let stripeCustomerId = company.stripe_customer_id;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        name: company.business_name ?? undefined,
        email: company.email ?? undefined,
        metadata: { company_id },
      });
      stripeCustomerId = customer.id;
      await this.companyRepo.update(company.id, { stripe_customer_id: stripeCustomerId });
    }

    if (payment_method_id) {
      await stripe.paymentMethods.attach(payment_method_id, {
        customer: stripeCustomerId,
      });

      await stripe.customers.update(stripeCustomerId, {
        invoice_settings: { default_payment_method: payment_method_id },
      });
    }

    const subPayload: Stripe.SubscriptionCreateParams = {
      customer: stripeCustomerId,
      items: [{
        plan: String(plan.stripe_product_id),
        price: String(price.stripe_price_id)
      }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        company_id: company.id,
        plan_id: plan.id,
      },
    };


    if (coupon_code) subPayload.add_invoice_items = [{ discounts: [{ promotion_code: coupon_code }] }];

    const sub = await stripe.subscriptions.create(subPayload);

    const paymentIntent = (sub.latest_invoice as any)?.payment_intent;

    // SCA REQUIRED
    if (paymentIntent?.status === 'requires_action') {
      await this.upsertPendingCompanySubscription({
        company_id,
        plan_id,
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: sub.id,
        stripe_price_id: price.stripe_price_id ?? null,
        status: sub.status as CompanySubscriptionStatus,
        metadata: sub.metadata ?? {},
        snapshot,
      });
      return {
        requires_action: true,
        client_secret: paymentIntent.client_secret,
        stripe_subscription_id: sub.id,
      };
    }

    // No SCA → persist immediately
    const saved = await this.createOrUpdateCompanySubscriptionFromStripe(sub, snapshot);

    if (paymentIntent?.status === 'succeeded') {
      await this.handleInvoicePaidForSubscription(
        sub.latest_invoice as any,
        saved,
        sub,
      );
    }

    return saved;
  }

  async confirmSubscription(stripeSubscriptionId: string) {
    if (!this.stripe) throw new InternalServerErrorException('Stripe disabled');

    const stripe = this.requireStripe();

    const subscription = await stripe.subscriptions.retrieve(
      stripeSubscriptionId,
      { expand: ['latest_invoice.payment_intent'] },
    );

    const paymentIntent = (subscription.latest_invoice as any)?.payment_intent;

    if (paymentIntent?.status === 'requires_action') {
      return {
        requires_action: true,
        client_secret: paymentIntent.client_secret,
      };
    }

    const saved = await this.createOrUpdateCompanySubscriptionFromStripe(subscription);

    if (
      subscription.latest_invoice &&
      ((subscription.latest_invoice as any).paid ||
        paymentIntent?.status === 'succeeded')
    ) {
      await this.handleInvoicePaidForSubscription(
        subscription.latest_invoice as any,
        saved,
        subscription,
      );
    }

    return saved;
  }

  async createOrUpdateCompanySubscriptionFromStripe(
    subscription: Stripe.Subscription,
    snapshotOverride?: {
      plan_snapshot: any | null;
      addons_snapshot: any | null;
      addon_ids: string[] | null;
      max_users: number | null;
    },
  ) {
    const stripeSubscriptionId = subscription.id;
    const metadata = subscription.metadata ?? {};

    const companyId =
      metadata.company_id ??
      null;

    if (!companyId) {
      this.logger.warn(`Stripe subscription ${stripeSubscriptionId} has no company_id metadata`);
      return null;
    }

    let cs = await this.companySubscriptionRepo.findOne({
      where: { stripe_subscription_id: stripeSubscriptionId },
    });

    const currentPeriodStart = subscription.start_date
      ? new Date(subscription.start_date * 1000)
      : null;

    const currentPeriodEnd = subscription.ended_at
      ? new Date(subscription.ended_at * 1000)
      : null;

    const snapshot =
      snapshotOverride ??
      (metadata.plan_id ? await this.buildSubscriptionSnapshot(metadata.plan_id, []) : null);
    const shouldUpdateSnapshot = Boolean(snapshotOverride);

    if (!cs) {
      cs = this.companySubscriptionRepo.create({
        company_id: companyId,
        stripe_customer_id: String(subscription.customer),
        stripe_subscription_id: stripeSubscriptionId,
        stripe_price_id: subscription.items?.data?.[0]?.price?.id ?? null,
        plan_id: metadata.plan_id ?? null,
        status: subscription.status as CompanySubscriptionStatus,
        current_period_start: currentPeriodStart,
        current_period_end: currentPeriodEnd,
        subscription_expires_at: currentPeriodEnd,
        metadata,
        plan_snapshot: snapshot?.plan_snapshot ?? null,
        addons_snapshot: snapshot?.addons_snapshot ?? null,
        addon_ids: snapshot?.addon_ids ?? null,
        max_users: snapshot?.max_users ?? null,
      });
    } else {
      cs.status = subscription.status as CompanySubscriptionStatus;
      cs.current_period_start = currentPeriodStart ?? cs.current_period_start;
      cs.current_period_end = currentPeriodEnd ?? cs.current_period_end;
      cs.subscription_expires_at = currentPeriodEnd ?? cs.subscription_expires_at;
      cs.metadata = metadata;
      if (shouldUpdateSnapshot && snapshot?.plan_snapshot) cs.plan_snapshot = snapshot.plan_snapshot;
      if (shouldUpdateSnapshot && snapshot?.addons_snapshot) cs.addons_snapshot = snapshot.addons_snapshot;
      if (shouldUpdateSnapshot && snapshot?.addon_ids) cs.addon_ids = snapshot.addon_ids;
      if (shouldUpdateSnapshot && typeof snapshot?.max_users !== 'undefined') cs.max_users = snapshot.max_users;
    }

    const saved = await this.companySubscriptionRepo.save(cs);

    await this.companyRepo.update(saved.company_id, {
      subscription_status: saved.status,
      subscription_expires_at: saved.subscription_expires_at,
    } as any);

    return saved;
  }

  // ---- Webhook handling ----
  async handleStripeEvent(event: Stripe.Event) {
    const type = event.type;
    this.logger.log(`Stripe webhook event received: ${type}`);

    try {
      switch (type) {
        case 'invoice.payment_succeeded': {
          const invoice = event.data.object as any;

          await this.upsertTransactionIfNotExists({
            stripe_event_id: event.id,
            stripe_object_id: invoice.id,
            type,
            amount_cents: invoice.total ?? null,
            currency: invoice.currency ?? null,
            status: TransactionStatus.SUCCEEDED,
            raw: invoice,
          });

          const subscriptionId = await this.resolveSubscriptionIdFromInvoice(invoice);

          if (!subscriptionId) {
            return;
          }

          let subscriptionObj: Stripe.Subscription | null = null;
          try {
            subscriptionObj = await this.stripe.subscriptions.retrieve(subscriptionId);
          } catch (err) {
            this.logger.warn(`Failed to retrieve subscription ${subscriptionId}: ${(err as any).message}`);
          }

          if (!subscriptionObj) {
            const customerId = invoice.customer ? String(invoice.customer) : null;
            if (customerId) {
              const csByCustomer = await this.companySubscriptionRepo.findOne({ where: { stripe_customer_id: customerId } });
              if (csByCustomer) {
                await this.handleInvoicePaidForSubscription(invoice, csByCustomer);
                return;
              }
            }

            return;
          }

          const cs = await this.createOrUpdateCompanySubscriptionFromStripe(subscriptionObj);
          if (cs) {
            await this.handleInvoicePaidForSubscription(invoice, cs, subscriptionObj);
          }
          break;
        }


        case 'invoice.payment_failed': {
          const invoice = event.data.object as any;
          const stripeSubscriptionId = invoice.subscription ? String(invoice.subscription) : null;
          // save transaction
          await this.upsertTransactionIfNotExists({
            stripe_event_id: event.id,
            stripe_object_id: invoice.id,
            type,
            amount_cents: invoice.total ?? null,
            currency: invoice.currency ?? null,
            status: TransactionStatus.FAILED,
            raw: invoice,
          });
          if (stripeSubscriptionId) {
            const cs = await this.companySubscriptionRepo.findOne({ where: { stripe_subscription_id: stripeSubscriptionId } });
            if (cs) {
              cs.status = CompanySubscriptionStatus.PAST_DUE;
              await this.companySubscriptionRepo.save(cs);
              await this.companyRepo.update(cs.company_id, { subscription_status: 'past_due' } as any);
            }
          }
          break;
        }
        case 'customer.subscription.created':
        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          await this.createOrUpdateCompanySubscriptionFromStripe(subscription);
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;

          const cs = await this.companySubscriptionRepo.findOne({
            where: { stripe_subscription_id: subscription.id },
          });

          if (cs) {
            cs.status = CompanySubscriptionStatus.CANCELED;
            await this.companySubscriptionRepo.save(cs);
            await this.companyRepo.update(cs.company_id, {
              subscription_status: 'canceled',
            } as any);
          }
          break;
        }

        case 'charge.refunded':
        case 'charge.succeeded':
        case 'payment_intent.succeeded': {
          // general-purpose transaction capture
          const obj = event.data.object as any;
          const amount = obj.amount ?? obj.amount_received ?? obj.total ?? null;
          const currency = obj.currency ?? null;
          const invoiceId = obj.invoice ?? null;
          const subscriptionId = obj.subscription ?? null;
          let cs = null;
          if (subscriptionId) cs = await this.companySubscriptionRepo.findOne({ where: { stripe_subscription_id: subscriptionId } });
          if (!cs && obj.customer) {
            cs = await this.companySubscriptionRepo.findOne({ where: { stripe_customer_id: String(obj.customer) } });
          }
          await this.upsertTransactionIfNotExists({
            stripe_event_id: event.id,
            stripe_object_id: obj.id ?? null,
            type,
            company_id: cs?.company_id ?? null,
            company_subscription_id: cs?.id ?? null,
            amount_cents: amount ? Number(amount) : null,
            currency: currency ?? null,
            status: type.includes('succeeded') ? TransactionStatus.SUCCEEDED : TransactionStatus.REFUNDED,
            raw: obj,
          });
          break;
        }

        default:
          this.logger.debug(`Unhandled stripe event: ${type}`);
      }
    } catch (err) {
      this.logger.error('Error handling stripe webhook: ' + (err as any).message, err as any);
      throw err;
    }
  }

  async getActiveSubscriptionForCompany(companyId: string) {
    return this.companySubscriptionRepo.findOne({
      where: {
        company_id: companyId,
        status: CompanySubscriptionStatus.ACTIVE,
      },
    });
  }

  async getSubscriptionsHistory(companyId: string) {
    const subs = await this.companySubscriptionRepo.find({
      where: { company_id: companyId },
      order: { created_at: 'DESC' },
    });
    return await Promise.all(subs.map(async s => {
      const periods = await this.periodRepo.find({
        where: { company_subscription_id: s.id },
        order: { period_start: 'ASC' },
      });
      return { subscription: s, periods };
    }));
  }

  async getTransactionsForCompany(companyId: string) {
    return this.txRepo.find({ where: { company_id: companyId }, order: { created_at: 'DESC' } });
  }

  requireStripe(): Stripe {
    if (!this.stripe) throw new InternalServerErrorException('Stripe not configured');
    return this.stripe;
  }

  // Helper: idempotent save of Transaction (skips duplicate by stripe event id/object id)
  private async upsertTransactionIfNotExists(opts: {
    stripe_event_id?: string | null;
    stripe_object_id?: string | null;
    type?: string;
    company_id?: string | null;
    company_subscription_id?: string | null;
    amount_cents?: number | null;
    currency?: string | null;
    status?: TransactionStatus;
    raw?: any;
  }) {
    if (opts.stripe_object_id) {
      const exists = await this.txRepo.findOne({ where: { stripe_object_id: opts.stripe_object_id } });
      if (exists) return exists;
    }
    const tx = this.txRepo.create({
      stripe_event_id: opts.stripe_event_id ?? null,
      stripe_object_id: opts.stripe_object_id ?? null,
      type: opts.type ?? null,
      company_id: opts.company_id ?? null,
      company_subscription_id: opts.company_subscription_id ?? null,
      amount_cents: opts.amount_cents ?? null,
      currency: opts.currency ?? null,
      status: opts.status ?? TransactionStatus.UNKNOWN,
      raw: opts.raw ?? null,
    });
    return this.txRepo.save(tx);
  }

  private async handleInvoicePaidForSubscription(invoice: any, savedSubscription: CompanySubscription, subscriptionObj?: any) {
    const amount = invoice.total ?? invoice.amount_paid ?? null;
    const currency = invoice.currency ?? null;
    const invoiceId = invoice.id;

    await this.upsertTransactionIfNotExists({
      stripe_object_id: invoiceId,
      type: 'invoice.payment_succeeded',
      company_id: savedSubscription.company_id,
      company_subscription_id: savedSubscription.id,
      amount_cents: amount ? Number(amount) : null,
      currency: currency ?? null,
      status: TransactionStatus.SUCCEEDED,
      raw: invoice,
    });

    const lines = invoice.lines?.data ?? [];
    for (const line of lines) {
      const period = line.period ?? line.plan?.interval ? line.period : null;
      if (line.period && line.period.start && line.period.end) {
        const periodStart = new Date(line.period.start * 1000);
        const periodEnd = new Date(line.period.end * 1000);
        const existing = await this.periodRepo.findOne({
          where: {
            invoice_id: invoiceId,
            period_start: periodStart,
          },
        });
        if (existing) continue;

        const amountLine = line.amount ?? null;
        await this.periodRepo.save(this.periodRepo.create({
          company_subscription_id: savedSubscription.id,
          period_start: periodStart,
          period_end: periodEnd,
          amount_cents: amountLine ? Number(amountLine) : null,
          currency: invoice.currency ?? null,
          invoice_id: invoiceId,
          metadata: line,
        }));
      } else {
        if (invoice.period_start && invoice.period_end) {
          const periodStart = new Date(invoice.period_start * 1000);
          const periodEnd = new Date(invoice.period_end * 1000);
          const exists = await this.periodRepo.findOne({
            where: { invoice_id: invoiceId, period_start: periodStart },
          });
          if (!exists) {
            await this.periodRepo.save(this.periodRepo.create({
              company_subscription_id: savedSubscription.id,
              period_start: periodStart,
              period_end: periodEnd,
              amount_cents: amount ? Number(amount) : null,
              currency: invoice.currency ?? null,
              invoice_id: invoiceId,
              metadata: invoice,
            }));
          }
        }
      }
    }

    const newPeriodEnd = invoice.lines?.data?.[0]?.period?.end ? new Date(invoice.lines.data[0].period.end * 1000) : (invoice.period_end ? new Date(invoice.period_end * 1000) : null);
    const newPeriodStart = invoice.lines?.data?.[0]?.period?.start ? new Date(invoice.lines.data[0].period.start * 1000) : (invoice.period_start ? new Date(invoice.period_start * 1000) : null);

    savedSubscription.current_period_start = newPeriodStart ?? savedSubscription.current_period_start;
    savedSubscription.current_period_end = newPeriodEnd ?? savedSubscription.current_period_end;
    savedSubscription.subscription_expires_at = newPeriodEnd ?? savedSubscription.subscription_expires_at;
    savedSubscription.status = CompanySubscriptionStatus.ACTIVE;
    savedSubscription.metadata = { ...(savedSubscription.metadata ?? {}), last_invoice: invoiceId };

    await this.companySubscriptionRepo.save(savedSubscription);

    try {
      await this.companyRepo.update(savedSubscription.company_id, {
        subscription_status: 'active',
        subscription_expires_at: savedSubscription.subscription_expires_at,
        stripe_customer_id: savedSubscription.stripe_customer_id,
      } as any);
    } catch (err) {
      this.logger.warn('Failed to update company top-level subscription fields: ' + (err as any).message);
    }
  }

  private async resolveSubscriptionIdFromInvoice(invoice: any): Promise<string | null> {
    if (invoice.subscription) return String(invoice.subscription);

    const lines = invoice.lines?.data ?? [];
    for (const line of lines) {
      if (line.subscription) return String(line.subscription);
    }

    const customerId = invoice.customer ? String(invoice.customer) : null;
    if (!customerId) return null;

    const invoicePeriodStart = invoice.period_start ?? lines?.[0]?.period?.start ?? null;
    const invoicePeriodEnd = invoice.period_end ?? lines?.[0]?.period?.end ?? null;

    try {
      const subsResponse = await this.stripe.subscriptions.list({
        customer: customerId,
        limit: 50,
        expand: ['data.items'],
      });

      if (invoicePeriodStart && invoicePeriodEnd) {
        const startSec = Number(invoicePeriodStart);
        const endSec = Number(invoicePeriodEnd);
        const match = subsResponse.data.find((s) => {
          const sStart = s.start_date ? Number(s.start_date) : null;
          const sEnd = s.ended_at ? Number(s.ended_at) : null;
          return sStart === startSec && sEnd === endSec;
        });
        if (match) return match.id;
      }

      const active = subsResponse.data.find((s) => s.status === 'active' || s.status === 'trialing');
      if (active) return active.id;

      if (subsResponse.data.length) return subsResponse.data[0].id;
      return null;
    } catch (err) {
      this.logger.warn('Failed to resolve subscription id from invoice by listing subscriptions: ' + (err as any).message);
      return null;
    }
  }

  private resolveMaxUsers(tierKey?: string | null): number | null {
    if (!tierKey) return null;
    switch (tierKey) {
      case 'solo':
        return 1;
      case 'pro':
        return 5;
      case 'enterprise':
        return null;
      default:
        return null;
    }
  }

  private async buildSubscriptionSnapshot(
    planId: string,
    selectedAddonIds: string[],
    opts?: { additional_practitioners?: number; has_website?: boolean },
  ) {
    const plan = await this.planRepo.findOne({
      where: { id: planId },
      relations: ['tier', 'prices'],
    });
    if (!plan) {
      return {
        plan_snapshot: null,
        addons_snapshot: null,
        addon_ids: selectedAddonIds ?? [],
        max_users: null,
      };
    }

    const tier = (plan as any).tier ?? null;

    const planOptionAddons = await this.planOptionAddOnRepo.find({
      where: { plan_option_id: plan.id },
      relations: ['addon'],
    });

    const includedAddonIds = planOptionAddons
      .filter((row) => row.included)
      .map((row) => row.addon_id);

    const selectedAddons = selectedAddonIds?.length
      ? await this.addOnRepo.findBy(selectedAddonIds.map((id) => ({ id })))
      : [];

    const addonIds = Array.from(new Set([...(selectedAddonIds ?? []), ...includedAddonIds]));

    const additionalPractitioners = Math.max(0, Number(opts?.additional_practitioners ?? 0));
    const baseMaxUsers = this.resolveMaxUsers(tier?.key ?? null);
    const maxUsers =
      baseMaxUsers === null
        ? null
        : baseMaxUsers + additionalPractitioners;

    const planAddonById = new Map<string, PlanOptionAddOn>();
    for (const row of planOptionAddons) {
      planAddonById.set(row.addon_id, row);
    }

    const plan_snapshot = {
      id: plan.id,
      key: plan.key,
      name: plan.name,
      description: plan.description ?? null,
      benefits: plan.benefits ?? [],
      tier: tier
        ? { id: tier.id, key: tier.key, name: tier.name, description: tier.description ?? null }
        : null,
      extra_practitioner_price_cents: plan.extra_practitioner_price_cents ?? null,
      website_included: plan.website_included ?? false,
      website_price_monthly_cents: plan.website_price_monthly_cents ?? null,
      website_price_yearly_cents: plan.website_price_yearly_cents ?? null,
      educator_upgrade_monthly_cents: plan.educator_upgrade_monthly_cents ?? null,
      stripe_product_id: plan.stripe_product_id ?? null,
      additional_practitioners: additionalPractitioners,
      max_users_base: baseMaxUsers,
      max_users_total: maxUsers,
      has_website: opts?.has_website ?? null,
      prices: (plan.prices ?? []).map((p) => ({
        id: p.id,
        interval: p.interval,
        price_cents: p.price_cents,
        currency: p.currency,
        stripe_price_id: p.stripe_price_id ?? null,
      })),
    };

    const addons_snapshot = {
      included: planOptionAddons.map((row) => ({
        id: row.id,
        addon_id: row.addon_id,
        included: row.included,
        price_cents: row.price_cents ?? null,
        currency: row.currency ?? null,
        stripe_price_id: row.stripe_price_id ?? null,
        effective_price_cents: row.included ? 0 : row.price_cents ?? null,
        addon: row.addon
          ? {
            id: row.addon.id,
            slug: row.addon.slug,
            name: row.addon.name,
            description: row.addon.description ?? null,
            price_cents: row.addon.price_cents,
            currency: row.addon.currency,
            stripe_product_id: row.addon.stripe_product_id ?? null,
          }
          : null,
      })),
      selected: selectedAddons.map((addon) => {
        const planRow = planAddonById.get(addon.id);
        const effectivePrice = planRow
          ? (planRow.included ? 0 : (planRow.price_cents ?? null))
          : addon.price_cents ?? null;
        return {
          id: addon.id,
          slug: addon.slug,
          name: addon.name,
          description: addon.description ?? null,
          price_cents: addon.price_cents,
          currency: addon.currency,
          stripe_product_id: addon.stripe_product_id ?? null,
          plan_option_addon_id: planRow?.id ?? null,
          included: planRow?.included ?? false,
          plan_price_cents: planRow?.price_cents ?? null,
          plan_currency: planRow?.currency ?? null,
          stripe_price_id: planRow?.stripe_price_id ?? null,
          effective_price_cents: effectivePrice,
        };
      }),
    };

    return {
      plan_snapshot,
      addons_snapshot,
      addon_ids: addonIds,
      max_users: maxUsers,
    };
  }

  private async upsertPendingCompanySubscription(opts: {
    company_id: string;
    plan_id: string;
    stripe_customer_id?: string | null;
    stripe_subscription_id?: string | null;
    stripe_price_id?: string | null;
    status?: CompanySubscriptionStatus;
    metadata?: any;
    snapshot: {
      plan_snapshot: any | null;
      addons_snapshot: any | null;
      addon_ids: string[] | null;
      max_users: number | null;
    };
  }) {
    let cs = await this.companySubscriptionRepo.findOne({
      where: { stripe_subscription_id: opts.stripe_subscription_id ?? null },
    });

    if (!cs) {
      cs = this.companySubscriptionRepo.create({
        company_id: opts.company_id,
        plan_id: opts.plan_id,
        stripe_customer_id: opts.stripe_customer_id ?? null,
        stripe_subscription_id: opts.stripe_subscription_id ?? null,
        stripe_price_id: opts.stripe_price_id ?? null,
        status: opts.status ?? CompanySubscriptionStatus.INCOMPLETE,
        metadata: opts.metadata ?? null,
        plan_snapshot: opts.snapshot.plan_snapshot ?? null,
        addons_snapshot: opts.snapshot.addons_snapshot ?? null,
        addon_ids: opts.snapshot.addon_ids ?? null,
        max_users: opts.snapshot.max_users ?? null,
      });
    } else {
      cs.plan_id = opts.plan_id ?? cs.plan_id;
      cs.stripe_customer_id = opts.stripe_customer_id ?? cs.stripe_customer_id;
      cs.stripe_subscription_id = opts.stripe_subscription_id ?? cs.stripe_subscription_id;
      cs.stripe_price_id = opts.stripe_price_id ?? cs.stripe_price_id;
      cs.status = opts.status ?? cs.status;
      cs.metadata = opts.metadata ?? cs.metadata;
      cs.plan_snapshot = opts.snapshot.plan_snapshot ?? cs.plan_snapshot;
      cs.addons_snapshot = opts.snapshot.addons_snapshot ?? cs.addons_snapshot;
      cs.addon_ids = opts.snapshot.addon_ids ?? cs.addon_ids;
      cs.max_users = typeof opts.snapshot.max_users !== 'undefined' ? opts.snapshot.max_users : cs.max_users;
    }

    return this.companySubscriptionRepo.save(cs);
  }
}
