import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, MoreThan, Repository } from 'typeorm';
import { DeepPartial } from 'typeorm/common/DeepPartial';
import Stripe from 'stripe';
import { createHash } from 'crypto';

import { Onboarding } from './entities/onboarding.entity';
import { Company } from '../company/entities/company.entity';
import { User } from '../user/entities/user.entity';
import { UserStatusEnum } from '../user/enum/user-status.enum';
import { VerificationCode } from '../verification-code/entities/verification-code.entity';
import { BusinessService } from '../../../admin/modules/service/entities/business-service.entity';
import { Trade } from '../../../common/modules/trade/entities/trade.entity';
import { Location } from '../location/entities/location.entity';
import { LocationAddress } from '../location/entities/location-address.entity';
import { Media } from '../../../common/modules/media/media.entity';
import { CompanyAddress } from '../company/modules/company-address/entities/company-address.entity';
import { CompanyBooking } from '../company/modules/company-profile/entities/company-booking.entity';
import { Policy } from '../company/modules/company-policy/entities/policy.entity';
import { CompanyPolicy } from '../company/modules/company-policy/entities/company-policy.entity';
import {
  CompanyRefundPolicy,
} from '../company/modules/refund-policy/entities/company-refund-policy.entity';
import {
  CompanyDepositRequirement,
} from '../company/modules/deposit-requirements/entities/company-deposit-requirement.entity';
import { PaymentMethod } from '../../../admin/modules/payment-methods/entities/payment-method.entity';
import {
  CompanyPaymentMethod,
} from '../company/modules/company-payment-methods/entities/company-payment-method.entity';
import { PlanOption } from '../../../common/modules/subscription-plans/entities/plan-option.entity';
import { PlanOptionAddOn } from '../../../common/modules/add-ons/entities/plan-option-addon.entity';
import { Tier } from '../../../common/modules/subscription-plans/entities/tier.entity';
import { TradeGroup } from '../../../common/modules/trade/entities/trade-group.entity';
import { BaseSpecialization } from '../../../specialization/entities/specialization.entity';
import { BusinessSpecialization } from '../../../specialization/entities/business-specialization.entity';
import { BaseService } from '../../../admin/modules/service/entities/base-service.entity';

import { StripeSubscriptionsService } from '../company/modules/stripe-subscriptions/stripe-subscriptions.service';
import { PaymentMethodsService } from '../company/modules/payment-methods/payment-methods.service';
import { AddOnsService } from '../add-ons/add-ons.service';

import { Step1Dto } from './dto/step1.dto';
import { Step2Dto } from './dto/step2.dto';
import { Step3Dto } from './dto/step3.dto';
import { Step4Dto } from './dto/step4.dto';
import { Step5Dto } from './dto/step5.dto';
import { Step6Dto } from './dto/step6.dto';
import { Step7Dto } from './dto/step7.dto';
import { Step8Dto } from './dto/step8.dto';
import { Step9Dto } from './dto/step9.dto';
import { Step10Dto } from './dto/step10.dto';
import { Step11Dto } from './dto/step11.dto';
import { Step12Dto } from './dto/step12.dto';
import { PriceInterval } from '../../../common/modules/subscription-plans/entities/plan-price.entity';

@Injectable()
export class OnboardingService {
  constructor(
    @InjectRepository(Onboarding)
    private readonly onboardingRepository: Repository<Onboarding>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(VerificationCode)
    private readonly verificationCodeRepository: Repository<VerificationCode>,
    private readonly stripeSubscriptionsService: StripeSubscriptionsService,
    private readonly paymentMethodsService: PaymentMethodsService,
    private readonly addOnsService: AddOnsService,
    private readonly dataSource: DataSource,
  ) {
  }

  async getOrCreateByUser(userId: string, userCompany: string) {
    let ob = await this.onboardingRepository.findOne({ where: { user_id: userId } });
    if (!ob) {
      ob = this.onboardingRepository.create({
        user_id: userId,
        current_step: 1,
        steps_data: {},
        completed: false,
        company_id: userCompany,
      });
      ob = await this.onboardingRepository.save(ob);
    }
    return ob;
  }

  async listTiers() {
    const tierRepo = this.dataSource.getRepository(Tier);
    const tiers = await tierRepo.find({
      order: {
        created_at: 'ASC',
        plans: {
          prices: {
            price_cents: 'ASC',
          },
        },
      },
      relations: {
        plans: {
          prices: true,
        },
      },
    });

    return tiers.map((tier) => {
      const plans = tier.plans ?? [];
      let cheapestPlan: PlanOption | null = null;
      let cheapestPrice = Number.POSITIVE_INFINITY;

      for (const plan of plans) {
        const prices = plan.prices ?? [];
        const minPrice = prices.length
          ? Math.min(...prices.map((p) => Number(p.price_cents)))
          : Number.POSITIVE_INFINITY;

        if (minPrice < cheapestPrice) {
          cheapestPrice = minPrice;
          cheapestPlan = plan;
        }
      }

      return {
        ...tier,
        plan: cheapestPlan,
        plans: undefined,
      };
    });
  }

  async listAvailablePlans(userId: string, userCompany: string) {
    const ob = await this.getOrCreateByUser(userId, userCompany);
    const steps = ob.steps_data ?? {};
    const s1 = steps['1'] as Step1Dto | undefined;

    const planRepo = this.dataSource.getRepository(PlanOption);
    const where = { is_active: true };
    if (s1?.tier_id) {
      where['tier_id'] = s1.tier_id;
    }

    return planRepo.find({
      where,
      relations: ['prices', 'tier'],
      order: {
        prices: {
          price_cents: 'ASC',
          interval: 'ASC',
        },
      },
    });
  }

  async listAvailableAddOns(userId: string, userCompany: string) {
    const ob = await this.getOrCreateByUser(userId, userCompany);
    const steps = ob.steps_data ?? {};
    const s2 = steps['2'] as Step2Dto | undefined;

    if (!s2?.subscription_id) {
      return [];
    }

    const planOptionAddOnRepo = this.dataSource.getRepository(PlanOptionAddOn);
    const planOptions = await planOptionAddOnRepo.find({
      where: { plan_option_id: s2.subscription_id },
      relations: ['addon'],
      order: { created_at: 'ASC' },
    });

    return planOptions.map(option => option.addon);
  }

  async getPlanSummary(userId: string, userCompany: string) {
    const ob = await this.getOrCreateByUser(userId, userCompany);
    const steps = ob.steps_data ?? {};
    const s2 = steps['2'] as Step2Dto | undefined;
    const s3 = steps['3'] as Step3Dto | undefined;

    if (!s2?.subscription_id) {
      throw new BadRequestException('Plan must be selected before requesting summary');
    }

    const manager = this.dataSource.manager;
    const selection = await this.resolvePlanSelections(s2.subscription_id, s2, s3, manager);
    const planRepo = this.dataSource.getRepository(PlanOption);
    const plan = await planRepo.findOne({
      where: { id: s2.subscription_id },
      relations: ['prices', 'tier'],
    });
    if (!plan) throw new NotFoundException('Plan not found');

    const planOptionAddOnRepo = this.dataSource.getRepository(PlanOptionAddOn);
    const planAddOns = await planOptionAddOnRepo.find({
      where: { plan_option_id: s2.subscription_id },
      relations: ['addon'],
      order: { created_at: 'ASC' },
    });

    return {
      plan,
      add_ons: planAddOns,
      selection,
    };
  }

  async listAvailableTrades() {
    const tradeGroupRepo = this.dataSource.getRepository(TradeGroup);
    const groups = await tradeGroupRepo.find({
      relations: ['trades'],
      order: { name: 'ASC' },
    });

    return groups.map((group) => ({
      id: group.id,
      name: group.name,
      trades: (group.trades ?? [])
        .filter((trade) => trade.is_active)
        .map((trade) => ({ id: trade.id, name: trade.name })),
    }));
  }

  async listAvailableServices() {
    const specializationRepo = this.dataSource.getRepository(BaseSpecialization);
    const specializations = await specializationRepo.find({
      where: { is_active: true },
      relations: ['services'],
      order: { name: 'ASC' },
    });

    return specializations.map((spec) => ({
      id: spec.id,
      name: spec.name,
      trade_id: spec.trade_id,
      services: (spec.services ?? [])
        .filter((service) => service.is_active && !service.archived)
        .map((service) => ({
          id: service.id,
          name: service.name,
          duration_minutes: service.duration_minutes,
          trade_id: service.trade_id,
          specialization_id: service.specialization_id,
        })),
    }));
  }

  async listBaseSpecializations() {
    const specializationRepo = this.dataSource.getRepository(BaseSpecialization);
    return specializationRepo.find({
      where: { is_active: true },
      order: { name: 'ASC' },
    });
  }

  async listBaseServices(specializationId?: string) {
    const serviceRepo = this.dataSource.getRepository(BaseService);
    const where: {
      is_active: boolean;
      archived: boolean;
      specialization_id?: string;
    } = {
      is_active: true,
      archived: false,
    };
    if (specializationId) {
      where.specialization_id = specializationId;
    }
    return serviceRepo.find({
      where,
      order: { name: 'ASC' },
    });
  }

  async getLinks(userId: string) {
    const userRepo = this.dataSource.getRepository(User);
    const user = await userRepo.findOne({
      where: { id: userId },
      relations: {
        company: {
          booking: true,
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');

    const subdomain = user.company?.booking?.subdomain ?? user.company?.subdomain ?? null;
    const base = subdomain ? `https://${subdomain}.beautyhub.com` : 'https://beautyhub.com';
    const bookingUrl = subdomain ? `https://bookings.beautyhub.com/${subdomain}` : 'https://booking.beautyhub.com';

    return {
      dashboard_url: `${base}`,
      booking_url: `https://bookings.beautyhub.com/${subdomain}`,
      embed_url: `<iframe src="${bookingUrl}" width="100%" height="800"`,
    };
  }

  async getStripeCustomerId(userId: string, userCompany: string) {
    const companyRepo = this.dataSource.getRepository(Company);
    let company = await companyRepo.findOne({ where: { id: userCompany } });
    if (!company) {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user?.company_id) throw new NotFoundException('Company not found');
      company = await companyRepo.findOne({ where: { id: user.company_id } });
    }

    if (!company) throw new NotFoundException('Company not found');

    if (!company.stripe_customer_id) {
      const stripe = this.stripeSubscriptionsService.requireStripe();
      const user = await this.userRepository.findOne({ where: { id: userId } });
      const customer = await stripe.customers.create(
        {
            name: company.business_name ?? undefined,
          email: user?.email ?? undefined,
          metadata: { company_id: String(company.id) },
        },
        { idempotencyKey: `customer_create_company_${company.id}` },
      );
      company.stripe_customer_id = customer.id;
      await companyRepo.update(company.id, { stripe_customer_id: customer.id });
    }

    return { stripe_customer_id: company.stripe_customer_id };
  }

  async getStripePaymentIntents(userId: string, userCompany: string, period: PriceInterval) {
    if (period !== 'monthly' && period !== 'yearly') {
      throw new BadRequestException('Invalid billing period');
    }
    const ob = await this.getOrCreateByUser(userId, userCompany);
    const steps = ob.steps_data ?? {};
    const s2 = steps['2'] as Step2Dto | undefined;
    const s3 = steps['3'] as Step3Dto | undefined;

    if (!s2?.subscription_id) {
      throw new BadRequestException('Plan must be selected before payment intent');
    }

    const planRepo = this.dataSource.getRepository(PlanOption);
    const plan = await planRepo.findOne({
      where: { id: s2.subscription_id },
      relations: ['prices'],
    });
    if (!plan) throw new NotFoundException('Plan not found');

    const selection = await this.resolvePlanSelections(s2.subscription_id, s2, s3, this.dataSource.manager);

    const planOptionAddOnRepo = this.dataSource.getRepository(PlanOptionAddOn);
    const planAddOns = await planOptionAddOnRepo.find({
      where: { plan_option_id: plan.id, addon_id: In(selection.selected_addon_ids) },
      relations: ['addon'],
    });

    const companyRepo = this.dataSource.getRepository(Company);
    let company = await companyRepo.findOne({ where: { id: userCompany } });
    if (!company) {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user?.company_id) throw new NotFoundException('Company not found');
      company = await companyRepo.findOne({ where: { id: user.company_id } });
    }
    if (!company) throw new NotFoundException('Company not found');

    if (!company.stripe_customer_id) {
      const stripe = this.stripeSubscriptionsService.requireStripe();
      const user = await this.userRepository.findOne({ where: { id: userId } });
      const customer = await stripe.customers.create(
        {
            name: company.business_name ?? undefined,
          email: user?.email ?? undefined,
          metadata: { company_id: String(company.id) },
        },
        { idempotencyKey: `customer_create_company_${company.id}` },
      );
      company.stripe_customer_id = customer.id;
      await companyRepo.update(company.id, { stripe_customer_id: customer.id });
    }

    const stripe = this.stripeSubscriptionsService.requireStripe();

    const payment = await this.createSubscriptionPaymentForPeriod({
      stripe,
      ob,
      company,
      plan,
      planAddOns,
      selection,
      period,
    });

    return {
      subscription_id: payment?.stripe_subscription_id ?? null,
      intent_id: payment?.intent_id ?? null,
      intent_type: payment?.intent_type ?? null,
      client_secret: payment?.client_secret ?? null,
    };
  }

  private async createSubscriptionPaymentForPeriod(params: {
    stripe: Stripe;
    ob: Onboarding;
    company: Company;
    plan: PlanOption;
    planAddOns: PlanOptionAddOn[];
    selection: {
      additional_practitioners: number;
      selected_addon_ids: string[];
    };
    period: PriceInterval;
  }): Promise<{
    intent_id: string | null;
    intent_type: 'payment_intent' | 'setup_intent';
    client_secret: string;
    stripe_subscription_id: string;
    amount: number;
    currency: string;
  } | null> {
    const { stripe, ob, company, plan, planAddOns, selection, period } = params;
    const planPrice = (plan.prices ?? []).find((price) => price.interval === period);
    if (!planPrice) return null;

    if (!planPrice.stripe_price_id) {
      throw new BadRequestException('Plan stripe price id is required for recurring subscriptions');
    }

    const planStripePrice = await stripe.prices.retrieve(planPrice.stripe_price_id);
    if (!planStripePrice.recurring || planStripePrice.type !== 'recurring') {
      throw new BadRequestException('Plan price must be recurring');
    }

    const periodMultiplier = period === 'yearly' ? 12 : 1;
    const effectiveCurrency = planStripePrice.currency ?? planPrice.currency ?? 'USD';
    const planItem = this.buildRecurringSubscriptionItemFromPrice(
      planStripePrice,
      period,
      periodMultiplier,
      'plan',
    );
    const planUnitAmount = this.getRecurringUnitAmountCents(
      planStripePrice,
      period,
      periodMultiplier,
    );

    const addonItems: Stripe.SubscriptionCreateParams.Item[] = [];
    const addonInvoiceItems: Stripe.SubscriptionCreateParams.AddInvoiceItem[] = [];
    let recurringAddonsTotal = 0;
    let oneTimeAddonsTotal = 0;

    for (const row of planAddOns) {
      if (!row.stripe_price_id) {
        throw new BadRequestException('Add-on stripe price id is required');
      }

      const addonStripePrice = await stripe.prices.retrieve(row.stripe_price_id);
      const addonCurrency = addonStripePrice.currency ?? row.currency ?? effectiveCurrency;
      if (addonCurrency !== effectiveCurrency) {
        throw new BadRequestException('Add-on currency does not match plan currency');
      }

      if (addonStripePrice.type === 'recurring') {
        if (!addonStripePrice.recurring) {
          throw new BadRequestException('Add-on recurring price must include interval');
        }
        const item = this.buildRecurringSubscriptionItemFromPrice(
          addonStripePrice,
          period,
          periodMultiplier,
          'addon',
          row.addon_id,
        );
        addonItems.push(item);

        const addonUnitAmount = this.getRecurringUnitAmountCents(
          addonStripePrice,
          period,
          periodMultiplier,
        );
        recurringAddonsTotal += addonUnitAmount;
        continue;
      }

      if (addonStripePrice.type === 'one_time') {
        const item = this.buildOneTimeInvoiceItemFromPrice(
          addonStripePrice,
          periodMultiplier,
          {
            company_id: String(company.id),
            plan_id: String(plan.id),
            addon_id: row.addon_id,
            interval: period,
            kind: 'addon',
          },
        );
        addonInvoiceItems.push(item);

        const addonUnitAmount = this.getOneTimeUnitAmountCents(
          addonStripePrice,
          periodMultiplier,
        );
        oneTimeAddonsTotal += addonUnitAmount;
        continue;
      }

      throw new BadRequestException('Unsupported add-on price type');
    }

    const additionalUsersTotal =
      selection.additional_practitioners > 0 && plan.extra_practitioner_price_cents != null
        ? selection.additional_practitioners * Number(plan.extra_practitioner_price_cents) * periodMultiplier
        : 0;

    const recurringTotal = planUnitAmount + recurringAddonsTotal + additionalUsersTotal;
    const totalCents = recurringTotal + oneTimeAddonsTotal;
    if (!Number.isFinite(totalCents) || totalCents < 0) {
      throw new BadRequestException('Invalid total amount for payment intent');
    }

    const addonPriceIds = planAddOns
      .map((row) => row.stripe_price_id)
      .filter((id): id is string => Boolean(id))
      .sort();
    const selectionHash = this.hashSelectionFingerprint({
      plan_price_id: planPrice.id,
      period,
      total_cents: totalCents,
      additional_practitioners: selection.additional_practitioners,
      addon_price_ids: addonPriceIds,
    });

    const intentKey = period === 'monthly' ? 'monthly_intent' : 'yearly_intent';
    const existing = (ob.metadata ?? {})[intentKey];
    if (
      existing?.stripe_subscription_id &&
      existing?.selection_hash === selectionHash
    ) {
      const existingSubscription = await stripe.subscriptions.retrieve(
        existing.stripe_subscription_id,
        { expand: ['latest_invoice', 'latest_invoice.confirmation_secret', 'pending_setup_intent'] },
      );
      const existingConfirmation = await this.extractSubscriptionConfirmation(
        stripe,
        existingSubscription,
      );
      if (existingConfirmation) {
        return {
          intent_id: existingConfirmation.intent_id,
          intent_type: existingConfirmation.intent_type,
          client_secret: existingConfirmation.client_secret,
          stripe_subscription_id: existingSubscription.id,
          amount: totalCents,
          currency: effectiveCurrency,
        };
      }
    }

    const existingSubscription = await this.findExistingIncompleteSubscription({
      stripe,
      customerId: company.stripe_customer_id,
      selectionHash,
      planStripePriceId: planPrice.stripe_price_id,
      period,
      planId: plan.id,
      planPriceId: planPrice.id,
    });
    if (existingSubscription) {
      const existingConfirmation = await this.extractSubscriptionConfirmation(
        stripe,
        existingSubscription,
      );
      if (existingConfirmation) {
        const obRepo = this.dataSource.getRepository(Onboarding);
        await obRepo.update(ob.id, {
          metadata: {
            ...(ob.metadata ?? {}),
            [intentKey]: {
              intent_id: existingConfirmation.intent_id,
              intent_type: existingConfirmation.intent_type,
              client_secret: existingConfirmation.client_secret,
              stripe_subscription_id: existingSubscription.id,
              amount: totalCents,
              recurring_amount: recurringTotal,
              one_time_amount: oneTimeAddonsTotal,
              currency: effectiveCurrency,
              period,
              selection_hash: selectionHash,
            },
          },
        });

        return {
          intent_id: existingConfirmation.intent_id,
          intent_type: existingConfirmation.intent_type,
          client_secret: existingConfirmation.client_secret,
          stripe_subscription_id: existingSubscription.id,
          amount: totalCents,
          currency: effectiveCurrency,
        };
      }
    }

    const subscriptionItems: Stripe.SubscriptionCreateParams.Item[] = [
      planItem,
      ...addonItems,
    ];

    if (addonInvoiceItems.length > 20) {
      throw new BadRequestException('Too many one-time add-ons for subscription invoice');
    }

    if (selection.additional_practitioners > 0 && plan.extra_practitioner_price_cents != null) {
      const planProductId =
        typeof planStripePrice.product === 'string'
          ? planStripePrice.product
          : planStripePrice.product.id;
      subscriptionItems.push({
        price_data: {
          currency: effectiveCurrency,
          unit_amount: Number(plan.extra_practitioner_price_cents) * periodMultiplier,
          product: planProductId,
          recurring: { interval: period === 'yearly' ? 'year' : 'month' },
        },
        quantity: selection.additional_practitioners,
        metadata: {
          company_id: String(company.id),
          plan_id: String(plan.id),
          interval: period,
          kind: 'additional_practitioners',
        },
      });
    }

    const idempotencyKey = this.buildSubscriptionIdempotencyKey({
      company_id: company.id,
      plan_price_id: planPrice.id,
      period,
      selection_hash: selectionHash,
    });

    let subscription: Stripe.Subscription;
    try {
      subscription = await stripe.subscriptions.create(
        {
          customer: company.stripe_customer_id,
          items: subscriptionItems,
          add_invoice_items: addonInvoiceItems.length ? addonInvoiceItems : undefined,
          payment_behavior: 'default_incomplete',
          proration_behavior: 'none',
          collection_method: 'charge_automatically',
          trial_end: 'now',
          payment_settings: {
            payment_method_types: ['card'],
            save_default_payment_method: 'on_subscription',
          },
          expand: ['latest_invoice', 'latest_invoice.confirmation_secret', 'pending_setup_intent'],
          metadata: {
            company_id: String(company.id),
            plan_id: String(plan.id),
            plan_price_id: String(planPrice.id),
            interval: period,
            selection_hash: selectionHash,
          },
        },
        { idempotencyKey },
      );
    } catch (error) {
      if (this.isStripeIdempotencyError(error)) {
        const recovered = await this.findExistingIncompleteSubscription({
          stripe,
          customerId: company.stripe_customer_id,
          selectionHash,
          planStripePriceId: planPrice.stripe_price_id,
          period,
          planId: plan.id,
          planPriceId: planPrice.id,
        });
        if (recovered) {
          subscription = recovered;
        } else {
          throw error;
        }
      } else {
        throw error;
      }
    }

    const confirmation = await this.extractSubscriptionConfirmation(stripe, subscription);
    if (!confirmation) {
      throw new BadRequestException('Failed to create payment confirmation for subscription');
    }

    const obRepo = this.dataSource.getRepository(Onboarding);
    await obRepo.update(ob.id, {
      metadata: {
        ...(ob.metadata ?? {}),
        [intentKey]: {
          intent_id: confirmation.intent_id,
          intent_type: confirmation.intent_type,
          client_secret: confirmation.client_secret,
          stripe_subscription_id: subscription.id,
          amount: totalCents,
          recurring_amount: recurringTotal,
          one_time_amount: oneTimeAddonsTotal,
          currency: effectiveCurrency,
          period,
          selection_hash: selectionHash,
        },
      },
    });

    return {
      intent_id: confirmation.intent_id,
      intent_type: confirmation.intent_type,
      client_secret: confirmation.client_secret,
      stripe_subscription_id: subscription.id,
      amount: totalCents,
      currency: effectiveCurrency,
    };
  }

  private async extractSubscriptionConfirmation(
    stripe: Stripe,
    subscription: Stripe.Subscription,
  ): Promise<{
    intent_id: string | null;
    intent_type: 'payment_intent' | 'setup_intent';
    client_secret: string
  } | null> {
    let latestInvoice = subscription.latest_invoice ?? null;
    if (!latestInvoice) {
      const list = await stripe.invoices.list({
        subscription: subscription.id,
        limit: 1,
      });
      latestInvoice = list.data[0] ?? null;
      if (!latestInvoice) return null;
    }

    let invoice: Stripe.Invoice;
    if (typeof latestInvoice === 'string') {
      invoice = await stripe.invoices.retrieve(latestInvoice, { expand: ['confirmation_secret', 'payment_intent'] });
    } else if (!latestInvoice.confirmation_secret) {
      invoice = await stripe.invoices.retrieve(latestInvoice.id, { expand: ['confirmation_secret', 'payment_intent'] });
    } else {
      invoice = latestInvoice;
    }

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const confirmationSecret =
        this.extractInvoiceConfirmationSecret(invoice) ?? this.extractInvoicePaymentIntentSecret(invoice);
      if (confirmationSecret) {
        return {
          intent_id: this.parseIntentIdFromSecret(confirmationSecret),
          intent_type: 'payment_intent',
          client_secret: confirmationSecret,
        };
      }

      if (invoice.status === 'draft') {
        await stripe.invoices.update(invoice.id, {
          auto_advance: true,
          payment_settings: { payment_method_types: ['card'] },
        });
        invoice = await stripe.invoices.finalizeInvoice(invoice.id, {
          auto_advance: true,
          expand: ['confirmation_secret', 'payment_intent'],
        });
      } else {
        await new Promise((resolve) => setTimeout(resolve, 300));
        invoice = await stripe.invoices.retrieve(invoice.id, {
          expand: ['confirmation_secret', 'payment_intent'],
        });
      }

      const retrySecret =
        this.extractInvoiceConfirmationSecret(invoice) ?? this.extractInvoicePaymentIntentSecret(invoice);
      if (retrySecret) {
        return {
          intent_id: this.parseIntentIdFromSecret(retrySecret),
          intent_type: 'payment_intent',
          client_secret: retrySecret,
        };
      }
    }

    const setupSecret = await this.extractSetupIntentSecret(stripe, subscription);
    if (setupSecret) {
      return {
        intent_id: this.parseIntentIdFromSecret(setupSecret),
        intent_type: 'setup_intent',
        client_secret: setupSecret,
      };
    }

    return null;
  }

  private extractInvoiceConfirmationSecret(invoice: Stripe.Invoice): string | null {
    return invoice.confirmation_secret?.client_secret ?? null;
  }

  private extractInvoicePaymentIntentSecret(invoice: Stripe.Invoice): string | null {
    if (!('payment_intent' in invoice)) {
      return null;
    }
    const paymentIntent = (invoice as Stripe.Invoice & {
      payment_intent?: Stripe.PaymentIntent | string | null;
    }).payment_intent;
    if (!paymentIntent || typeof paymentIntent === 'string') {
      return null;
    }
    return paymentIntent.client_secret ?? null;
  }

  private async extractSetupIntentSecret(
    stripe: Stripe,
    subscription: Stripe.Subscription,
  ): Promise<string | null> {
    const pending = subscription.pending_setup_intent ?? null;
    if (!pending) return null;
    if (typeof pending === 'string') {
      const setupIntent = await stripe.setupIntents.retrieve(pending);
      return setupIntent.client_secret ?? null;
    }
    return pending.client_secret ?? null;
  }

  private parseIntentIdFromSecret(clientSecret: string): string | null {
    const index = clientSecret.indexOf('_secret_');
    if (index <= 0) return null;
    return clientSecret.slice(0, index);
  }

  private isStripeIdempotencyError(error: unknown): error is { type: 'StripeIdempotencyError' } {
    if (!error || typeof error !== 'object') return false;
    if (!('type' in error)) return false;
    return (error as { type?: string }).type === 'StripeIdempotencyError';
  }

  private async findExistingIncompleteSubscription(params: {
    stripe: Stripe;
    customerId: string;
    selectionHash: string;
    planStripePriceId: string;
    period: PriceInterval;
    planId: string;
    planPriceId: string;
  }): Promise<Stripe.Subscription | null> {
    const {
      stripe,
      customerId,
      selectionHash,
      planStripePriceId,
      period,
      planId,
      planPriceId,
    } = params;

    const list = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 20,
      expand: ['data.latest_invoice', 'data.latest_invoice.confirmation_secret', 'data.pending_setup_intent'],
    });

    const candidates = list.data
      .filter((sub) => sub.status === 'incomplete')
      .sort((a, b) => (b.created ?? 0) - (a.created ?? 0));

    for (const sub of candidates) {
      const metadata = sub.metadata ?? {};
      if (metadata.selection_hash === selectionHash) {
        return sub;
      }

      const intervalMatch = !metadata.interval || metadata.interval === period;
      const planPriceMatch = metadata.plan_price_id === String(planPriceId);
      const hasPlanPrice = this.subscriptionHasPrice(sub, planStripePriceId);
      if (intervalMatch && (planPriceMatch || hasPlanPrice)) {
        if (!metadata.selection_hash) {
          await stripe.subscriptions.update(sub.id, {
            metadata: {
              ...metadata,
              selection_hash: selectionHash,
              plan_id: String(planId),
              plan_price_id: String(planPriceId),
              interval: period,
            },
          });
          return await stripe.subscriptions.retrieve(sub.id, {
            expand: ['latest_invoice', 'latest_invoice.confirmation_secret', 'pending_setup_intent'],
          });
        }
        return sub;
      }
    }

    return null;
  }

  private subscriptionHasPrice(subscription: Stripe.Subscription, priceId: string): boolean {
    const items = subscription.items?.data ?? [];
    return items.some((item) => {
      const price = item.price;
      if (!price) return false;
      return typeof price === 'string' ? price === priceId : price.id === priceId;
    });
  }

  async submitStep(
    step: number,
    dto:
      | Step1Dto
      | Step2Dto
      | Step3Dto
      | Step4Dto
      | Step5Dto
      | Step6Dto
      | Step7Dto
      | Step8Dto
      | Step9Dto
      | Step10Dto
      | Step11Dto
      | Step12Dto,
    req: any,
  ) {
    const userId = req?.userId as string;
    let companyIdFromReq = req?.userCompany as string;
    if (!userId) throw new BadRequestException('Missing userId in request context');

    return this.dataSource.transaction(async (tx) => {
      const obRepo = tx.getRepository(Onboarding);
      const userRepo = tx.getRepository(User);
      const companyRepo = tx.getRepository(Company);

      let ob = await obRepo.findOne({ where: { user_id: userId } });
      if (!ob) {
        const user = await userRepo.findOneBy({ id: userId });
        companyIdFromReq = user.company_id;
        ob = obRepo.create({
          user_id: userId,
          company_id: user.company_id,
          current_step: 1,
          steps_data: {},
          completed: false,
        });
        ob = await obRepo.save(ob);
      }

      ob.steps_data = ob.steps_data ?? {};

      // if (ob.current_step > step) {
      //   for (let i = step; i <= ob.current_step; i++) {
      //     ob.steps_data[String(step)] = null;
      //   }
      // }

      ob.steps_data[String(step)] = dto;
      ob.current_step = Math.min(13, step + 1);
      ob = await obRepo.save(ob);

      switch (step) {
        case 1:
          await this.handleStep1(userId, ob, dto as Step1Dto, tx);
          break;
        case 2:
          await this.handleStep2(userId, ob, dto as Step2Dto, tx);
          break;
        case 3:
          await this.handleStep3(userId, ob, dto as Step3Dto, tx);
          break;
        case 4:
          await this.handleStep4(userId, ob, dto as Step4Dto, tx);
          break;
        case 5:
          await this.handleStep5(userId, ob, dto as Step5Dto, tx);
          break;
        case 6: {
          await this.handleStep6(userId, ob, dto as Step6Dto, tx);
          break;
        }
        case 7:
          await this.handleStep7(companyIdFromReq, ob, dto as Step7Dto, tx);
          break;
        case 8: {
          const existingCompanyId = companyIdFromReq ?? ob.company_id ?? null;
          const createdOrUpdatedCompany = await this.handleStep8(userId, existingCompanyId, ob, dto as Step8Dto, tx) as Company;

          if (!ob.company_id || ob.company_id !== createdOrUpdatedCompany.id) {
            ob.company_id = createdOrUpdatedCompany.id;
            await obRepo.update(ob.id, { company_id: createdOrUpdatedCompany.id });
          }

          const user = await userRepo.findOne({ where: { id: userId } });
          if (user && user.company_id !== createdOrUpdatedCompany.id) {
            await userRepo.update(userId, { company_id: createdOrUpdatedCompany.id });
          }

          break;
        }
        case 9:
          await this.handleStep9(userId, ob, dto as Step9Dto, tx);
          break;
        case 10:
          await this.handleStep10(userId, ob, dto as Step10Dto, tx);
          break;
        case 11:
          await this.handleStep11(userId, ob, dto as Step11Dto, tx);
          break;
        case 12: {
          await this.handleStep12(userId, ob, dto as Step12Dto, tx);
          await this.tryFinalize(userId, ob, tx);
          break;
        }
        default:
          throw new BadRequestException(`Unsupported step: ${step}`);
      }

      return await obRepo.findOne({ where: { id: ob.id } });
    });
  }

  private async handleStep1(userId: string, ob: Onboarding, dto: Step1Dto, tx: DataSource['manager']) {
    const tierRepo = tx.getRepository(Tier);
    const tier = await tierRepo.findOne({ where: { id: dto.tier_id } });
    if (!tier) {
      throw new NotFoundException('Tier not found');
    }
  }

  private async handleStep2(userId: string, ob: Onboarding, dto: Step2Dto, tx: DataSource['manager']) {
    const steps = ob.steps_data ?? {};
    const s1 = steps['1'] as Step1Dto | undefined;
    const planRepo = tx.getRepository(PlanOption);
    const plan = await planRepo.findOne({ where: { id: dto.subscription_id } });
    if (!plan) {
      throw new NotFoundException('Plan not found');
    }
    if (s1?.tier_id && plan.tier_id !== s1.tier_id) {
      throw new BadRequestException('Selected plan does not belong to the chosen tier');
    }
  }

  private async handleStep3(userId: string, ob: Onboarding, dto: Step3Dto, tx: DataSource['manager']) {
    return;
  }

  private async handleStep4(userId: string, ob: Onboarding, dto: Step4Dto, tx: DataSource['manager']) {
    return;
  }

  private async handleStep5(userId: string, ob: Onboarding, dto: Step5Dto, txManager: any) {
    return;
  }

  private async handleStep6(userId: string, ob: Onboarding, dto: Step6Dto, tx: DataSource['manager']) {
    return;
  }

  private async handleStep7(userCompany: string, ob: Onboarding, dto: Step7Dto, tx: DataSource['manager']) {
    if (!ob.company_id) return;

    const companyRepo = tx.getRepository(Company);
    const tradeRepo = tx.getRepository(Trade);
    const tradeGroupRepo = tx.getRepository(TradeGroup);

    const company = await companyRepo.findOne({
      where: { id: ob.company_id },
      relations: ['trades'],
    });
    if (!company) throw new NotFoundException('Company not found');

    const selectedIds = (dto.selected_ids ?? []).filter(Boolean);
    let trades: Trade[] = [];
    if (selectedIds.length) {
      trades = await tradeRepo.find({
        where: {
          id: In(selectedIds.map(el => +el)),
        },
      });
    }

    if (dto.other_trades?.length) {
      let otherGroup = await tradeGroupRepo.findOne({ where: { name: 'Other' } });
      if (!otherGroup) {
        otherGroup = await tradeGroupRepo.save(
          tradeGroupRepo.create({
            name: 'Other',
          }),
        );
      }

      const names = dto.other_trades.map((name) => name.trim()).filter(Boolean);
      if (names.length) {
        const existing = await tradeRepo.find({
          where: {
            name: In(names),
          },
        });
        const existingNames = new Set(existing.map((t) => t.name.toLowerCase()));
        const toCreate = names.filter((name) => !existingNames.has(name.toLowerCase()));

        if (toCreate.length) {
          const created = await tradeRepo.save(
            toCreate.map((name) =>
              tradeRepo.create({
                group_id: otherGroup.id,
                name,
                creator_company_id: userCompany,
                is_active: true,
              }),
            ),
          );
          trades = trades.concat(created);
        }

        trades = trades.concat(existing);
      }
    }

    if (trades.length) {
      company.trades = trades;
      await companyRepo.save(company);
    }
  }

  private async handleStep8(
    userId: string,
    existingCompanyId: number | string | null,
    ob: Onboarding,
    dto: Step8Dto,
    tx: DataSource['manager'],
  ) {
    const companyRepo = tx.getRepository(Company);
    const addressRepo = tx.getRepository(CompanyAddress);
    const bookingRepo = tx.getRepository(CompanyBooking);
    const normalizedPhone = dto.phone?.trim();

    if (existingCompanyId) {
      const existingCompanyIdStr = String(existingCompanyId);
      const existing = await companyRepo.findOne({ where: { id: existingCompanyIdStr } });
      if (existing) {
        if (normalizedPhone) {
          const phoneOwner = await companyRepo.findOne({ where: { phone: normalizedPhone } });
          if (phoneOwner && phoneOwner.id !== existing.id) {
            this.throwValidationError('phone', 'Phone already exists');
          }
        }
        const patch: DeepPartial<Company> = {
          business_name: dto.business_name,
          legal_name: dto.business_name,
          phone: normalizedPhone ?? null,
          country: dto.country,
          timezone: dto.timezone,
        };
        await companyRepo.update(existing.id, patch);

        const addressData: DeepPartial<CompanyAddress> = {
          line1: dto.address ?? null,
          city: dto.city ?? null,
          state: dto.state ?? null,
          country: dto.country ?? null,
        };
        const hasAddress = Boolean(
          addressData.line1 || addressData.city || addressData.state || addressData.country,
        );
        if (hasAddress) {
          const existingAddress = await addressRepo.findOne({
            where: { company_id: existing.id },
          });
          if (existingAddress) {
            Object.assign(existingAddress, addressData);
            await addressRepo.save(existingAddress);
          } else {
            await addressRepo.save(
              addressRepo.create({
                company_id: existing.id,
                ...addressData,
              }),
            );
          }
        }

        const updated = await companyRepo.findOne({ where: { id: existing.id } });
        if (updated && dto.logo_url) {
          await this.attachCompanyLogoMedia(updated, dto.logo_url, tx);
        }
        if (updated) {
          await this.ensureCompanyBookingRecord(updated, bookingRepo);
          await this.ensureCompanyPolicies(updated.id, tx);
          await this.ensureCompanyRefundPolicy(updated.id, tx);
          await this.ensureCompanyDepositRequirement(updated.id, tx);
          await this.ensureCompanyPaymentMethods(updated.id, tx);
        }
        return updated;
      }
    }

    const subdomain = await this.generateSubdomain(dto.business_name, companyRepo);
    if (normalizedPhone) {
      const phoneOwner = await companyRepo.findOne({ where: { phone: normalizedPhone } });
      if (phoneOwner) {
        this.throwValidationError('phone', 'Phone already exists');
      }
    }
    const data: DeepPartial<Company> = {
      subdomain,
      business_name: dto.business_name,
      legal_name: dto.business_name,
      phone: normalizedPhone ?? null,
      country: dto.country,
      timezone: dto.timezone,
    };

    const created = companyRepo.create(data);
    const saved = await companyRepo.save(created);
    const addressData: DeepPartial<CompanyAddress> = {
      line1: dto.address ?? null,
      city: dto.city ?? null,
      state: dto.state ?? null,
      country: dto.country ?? null,
    };
    const hasAddress = Boolean(
      addressData.line1 || addressData.city || addressData.state || addressData.country,
    );
    if (hasAddress) {
      await addressRepo.save(
        addressRepo.create({
          company_id: saved.id,
          ...addressData,
        }),
      );
    }
    if (dto.logo_url) {
      await this.attachCompanyLogoMedia(saved, dto.logo_url, tx);
    }
    await this.ensureCompanyBookingRecord(saved, bookingRepo, subdomain);
    await this.ensureCompanyPolicies(saved.id, tx);
    await this.ensureCompanyRefundPolicy(saved.id, tx);
    await this.ensureCompanyDepositRequirement(saved.id, tx);
    await this.ensureCompanyPaymentMethods(saved.id, tx);
    return saved;
  }

  private async handleStep9(userId: string, ob: Onboarding, dto: Step9Dto, tx: DataSource['manager']) {
    if (!ob.company_id) return;

    const companyRepo = tx.getRepository(Company);
    const company = await companyRepo.findOne({
      where: { id: ob.company_id },
    });
    if (!company) throw new NotFoundException('Company not found');

    const specializationRepo = tx.getRepository(BusinessSpecialization);
    const businessServiceRepo = tx.getRepository(BusinessService);

    const items = dto.services ?? [];
    if (!items.length) return;

    const normalizedItems = items.map((item, index) => {
      const name = item?.name?.trim() ?? '';
      const specializationName = item?.specialization_name?.trim() ?? '';

      if (!name) {
        this.throwValidationError(`services.${index}.name`, 'Name is required');
      }
      if (!specializationName) {
        this.throwValidationError(`services.${index}.specialization_name`, 'Specialization name is required');
      }
      const price = item?.price_in_cents;
      if (price === null || price === undefined || Number.isNaN(price)) {
        this.throwValidationError(`services.${index}.price_in_cents`, 'Price is required');
      }

      return {
        name,
        specializationName,
        specializationKey: specializationName.toLowerCase(),
        price_in_cents: price,
      };
    });

    const existingSpecializations = await specializationRepo.find({
      where: { business_id: company.id },
    });
    const specializationByKey = new Map(
      existingSpecializations.map((spec) => [spec.name.trim().toLowerCase(), spec]),
    );

    const toCreateSpecializations: string[] = [];
    const pendingSpecializationKeys = new Set<string>();
    for (const item of normalizedItems) {
      if (!specializationByKey.has(item.specializationKey) && !pendingSpecializationKeys.has(item.specializationKey)) {
        pendingSpecializationKeys.add(item.specializationKey);
        toCreateSpecializations.push(item.specializationName);
      }
    }

    if (toCreateSpecializations.length) {
      const created = await specializationRepo.save(
        toCreateSpecializations.map((name) =>
          specializationRepo.create({
            business_id: company.id,
            name,
            is_active: true,
          }),
        ),
      );
      for (const spec of created) {
        specializationByKey.set(spec.name.trim().toLowerCase(), spec);
      }
    }

    const existingServices = await businessServiceRepo.find({
      where: { business_id: company.id },
      select: ['id', 'name', 'specialization_id'],
    });
    const existingServiceKeys = new Set(
      existingServices.map((service) => `${service.specialization_id}:${service.name.trim().toLowerCase()}`),
    );
    const pendingServiceKeys = new Set<string>();

    const toCreateServices: DeepPartial<BusinessService>[] = [];
    for (const item of normalizedItems) {
      const specialization = specializationByKey.get(item.specializationKey);
      if (!specialization) {
        throw new NotFoundException('Specialization not found');
      }
      const serviceKey = `${specialization.id}:${item.name.toLowerCase()}`;
      if (existingServiceKeys.has(serviceKey) || pendingServiceKeys.has(serviceKey)) {
        continue;
      }
      pendingServiceKeys.add(serviceKey);
      toCreateServices.push({
        business_id: company.id,
        specialization_id: specialization.id,
        name: item.name,
        duration_minutes: null,
        required_staff: null,
        buffer_minutes: null,
        price: item.price_in_cents,
        is_active: true,
      });
    }

    if (toCreateServices.length) {
      await businessServiceRepo.save(
        toCreateServices.map((service) => businessServiceRepo.create(service)),
      );
    }
  }

  private async handleStep10(userId: string, ob: Onboarding, dto: Step10Dto, tx: DataSource['manager']) {
    if (!ob.company_id) return;
    const companyRepo = tx.getRepository(Company);
    await companyRepo.update(
      { id: ob.company_id },
      {
        has_schedule: dto.has_schedule,
        has_education: dto.has_education,
        has_products: dto.has_products,
      },
    );
  }

  private async handleStep11(userId: string, ob: Onboarding, dto: Step11Dto, tx: DataSource['manager']) {
    if (!ob.company_id) return;

    const companyRepo = tx.getRepository(Company);
    const locationRepo = tx.getRepository(Location);
    const addressRepo = tx.getRepository(LocationAddress);
    const userRepo = tx.getRepository(User);

    const company = await companyRepo.findOne({ where: { id: ob.company_id } });
    if (!company) throw new NotFoundException('Company not found');

    const locationName =
      dto.type === 'studio'
        ? 'Main Studio'
        : dto.type === 'mobile'
          ? 'Mobile'
          : 'Virtual';

    let location = await locationRepo.findOne({
      where: { company_id: company.id, is_primary: true },
      relations: ['address'],
    });

    if (!location) {
      location = await locationRepo.save(
        locationRepo.create({
          company_id: company.id,
          name: locationName,
          is_primary: true,
          type: dto.type,
        }),
      );
    } else {
      location.name = locationName;
      location.type = dto.type;
      await locationRepo.save(location);
    }

    if (dto.type === 'studio' && dto.studio_address) {
      if (!location.address) {
        location.address = await addressRepo.save(
          addressRepo.create({
            location_id: location.id,
            street: dto.studio_address,
          }),
        );
      } else {
        location.address.street = dto.studio_address;
        await addressRepo.save(location.address);
      }
    }

    if (dto.team?.length) {
      for (const member of dto.team) {
        if (!member?.email) continue;
        const existing = await userRepo.findOne({ where: { email: member.email } });
        if (existing) {
          if (!existing.company_id || existing.company_id === company.id) continue;
          throw new BadRequestException('User with this email already exists');
        }

        const nameParts = member.name?.trim().split(/\s+/) ?? [];
        const firstName = nameParts[0] ?? '';
        const lastName = nameParts.slice(1).join(' ') || '';
        const role =
          member.role === 'admin' ? 'business_admin' : member.role;

        await userRepo.save(
          userRepo.create({
            first_name: firstName || member.name || 'Team',
            last_name: lastName || 'Member',
            email: member.email,
            role,
            company_id: company.id,
            location_id: location?.id ?? null,
            password_hash: '',
            status: UserStatusEnum.INACTIVE,
          }),
        );
      }
    }
  }

  private async handleStep12(userId: string, ob: Onboarding, dto: Step12Dto, tx: DataSource['manager']) {
    if (!ob.company_id) return;
    const companyRepo = tx.getRepository(Company);
    await companyRepo.update(
      { id: ob.company_id },
      {
        template_id: dto.template_id,
        color_palette_id: dto.color_palette_id,
        font_id: dto.font_id,
      },
    );
  }

  private async tryFinalize(userId: string, ob: Onboarding, tx: DataSource['manager']) {
    const obRepo = tx.getRepository(Onboarding);
    const companyRepo = tx.getRepository(Company);
    const bookingRepo = tx.getRepository(CompanyBooking);
    const company = await companyRepo.findOneBy({ id: ob.company_id });
    if (!company) throw new NotFoundException('Company not found');

    company.subdomain = await this.generateSubdomain(company.business_name ?? '', companyRepo);
    await companyRepo.save(company);
    await this.ensureCompanyBookingRecord(company, bookingRepo, company.subdomain);
    await this.ensureCompanyPolicies(company.id, tx);
    await this.ensureCompanyRefundPolicy(company.id, tx);
    await this.ensureCompanyDepositRequirement(company.id, tx);
    await this.ensureCompanyPaymentMethods(company.id, tx);
    await obRepo.update(ob.id, { completed: true, current_step: 12, steps_data: null, metadata: null });
    await obRepo.softDelete(ob.id);
  }

  private async resolvePlanSelections(
    planId: string,
    planSelection: Step2Dto,
    addOnSelection: Step3Dto | undefined,
    tx: DataSource['manager'],
  ) {
    const planRepo = tx.getRepository(PlanOption);
    const planOptionAddOnRepo = tx.getRepository(PlanOptionAddOn);

    const plan = await planRepo.findOne({
      where: { id: planId },
      relations: {
        tier: true,
        prices: true,
      },
    });
    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    const planAddOns = await planOptionAddOnRepo.find({
      where: { plan_option_id: plan.id },
      relations: ['addon'],
    });

    const includedAddonIds = planAddOns.filter((row) => row.included).map((row) => row.addon_id);
    const selectedAddonIds = new Set<string>(addOnSelection?.addon_ids ?? []);

    let hasWebsite = Boolean(planSelection.has_website);
    const websiteRow = planAddOns.find((row) => row.addon?.slug === 'website');

    if (websiteRow?.included) {
      hasWebsite = true;
    }

    if (hasWebsite) {
      if (!websiteRow) {
        throw new BadRequestException('Website is not available for this plan');
      }
      if (!websiteRow.included) {
        selectedAddonIds.add(websiteRow.addon_id);
      }
    }

    const additionalPractitioners = Math.max(0, Number(planSelection.additional_practitioners ?? 0));
    if (additionalPractitioners > 0 && plan.extra_practitioner_price_cents == null) {
      throw new BadRequestException('Additional practitioners are not available for this plan');
    }

    const enabledAddonIds = Array.from(new Set([...selectedAddonIds, ...includedAddonIds]));

    return {
      plan,
      has_website: hasWebsite,
      additional_practitioners: additionalPractitioners,
      selected_addon_ids: Array.from(selectedAddonIds),
      enabled_addon_ids: enabledAddonIds,
    };
  }

  async sendVerificationCode(dto: { user_id: string; method: 'email' | 'phone' }) {
    const user = await this.userRepository.findOne({ where: { id: dto.user_id } });
    if (!user) throw new NotFoundException('User not found');

    const cooldownFrom = new Date();
    cooldownFrom.setMinutes(cooldownFrom.getMinutes() - 5);

    const recentCode = await this.verificationCodeRepository.findOne({
      where: {
        user_id: user.id,
        method: dto.method,
        is_used: false,
        created_at: MoreThan(cooldownFrom),
      },
      order: { created_at: 'DESC' },
    });

    if (recentCode) {
      throw new BadRequestException(
        'Verification code already sent. Please wait 5 minutes before requesting a new one.',
      );
    }

    let verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    verificationCode = '111111';
    const expiryDate = new Date();
    expiryDate.setMinutes(expiryDate.getMinutes() + 10);

    const verificationCodeEntity = this.verificationCodeRepository.create({
      user_id: user.id,
      code: verificationCode,
      method: dto.method,
      expires_at: expiryDate,
      is_used: false,
    });
    await this.verificationCodeRepository.save(verificationCodeEntity);

    if (dto.method === 'email') {
      // call your mailer
      // await this.emailService.sendVerificationCode(user.email, verificationCode);
    } else {
      // call your sms
      // await this.smsService.sendVerificationCode(user.phone, verificationCode);
    }

    return { success: true };
  }

  async verifyCode(dto: { user_id: string; code: string }) {
    return this.dataSource.transaction(async (tx) => {
      const userRepository = tx.getRepository(User);
      const verificationCodeRepository = tx.getRepository(VerificationCode);

      const user = await userRepository.findOne({ where: { id: dto.user_id } });
      if (!user) throw new NotFoundException('User not found');

      const verificationCode = await verificationCodeRepository.findOne({
        where: { user_id: dto.user_id, code: dto.code, is_used: false },
        order: { created_at: 'DESC' },
      });

      if (!verificationCode) throw new BadRequestException('Invalid verification code');
      if (verificationCode.expires_at < new Date()) throw new BadRequestException('Verification code has expired');

      verificationCode.is_used = true;
      await verificationCodeRepository.save(verificationCode);

      user.status = UserStatusEnum.ACTIVE;
      return await userRepository.save(user);
    });
  }

  private async generateSubdomain(companyName: string, businessRepository: Repository<Company>): Promise<string> {
    let baseSubdomain = companyName.toLowerCase().trim().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
    if (!baseSubdomain) baseSubdomain = 'company';

    let subdomain = baseSubdomain;
    let counter = 1;

    while (await businessRepository.findOne({ where: { subdomain } })) {
      subdomain = `${baseSubdomain}-${counter}`;
      counter++;
    }
    return subdomain;
  }

  private async ensureCompanyBookingRecord(
    company: Company,
    bookingRepo: Repository<CompanyBooking>,
    subdomain?: string | null,
  ) {
    const normalized = subdomain ?? company.subdomain ?? null;
    let booking = await bookingRepo.findOne({ where: { company_id: company.id } });
    if (!booking) {
      booking = bookingRepo.create({
        company_id: company.id,
        subdomain: normalized,
        custom_subdomain: null,
      });
      await bookingRepo.save(booking);
      return;
    }
    if (normalized && booking.subdomain !== normalized) {
      booking.subdomain = normalized;
      await bookingRepo.save(booking);
    }
  }

  private async ensureCompanyPolicies(companyId: string, tx: DataSource['manager']) {
    const policyRepo = tx.getRepository(Policy);
    const companyPolicyRepo = tx.getRepository(CompanyPolicy);

    const basePolicies = await policyRepo.find();
    if (!basePolicies.length) {
      return;
    }

    const existing = await companyPolicyRepo.find({
      where: { company_id: companyId },
      select: ['policy_id'],
    });
    const existingIds = new Set(existing.map((row) => row.policy_id));

    const toCreate = basePolicies
      .filter((policy) => !existingIds.has(policy.id))
      .map((policy) =>
        companyPolicyRepo.create({
          company_id: companyId,
          policy_id: policy.id,
          slug: policy.slug,
          data: {},
          state: policy.default_state,
        }),
      );

    if (toCreate.length) {
      await companyPolicyRepo.save(toCreate);
    }
  }

  private async ensureCompanyRefundPolicy(companyId: string, tx: DataSource['manager']) {
    const refundRepo = tx.getRepository(CompanyRefundPolicy);
    const existing = await refundRepo.findOne({ where: { company_id: companyId } });
    if (existing) {
      return;
    }

    await refundRepo.save(
      refundRepo.create({
        company_id: companyId,
        automatic_refunds: false,
        require_deposit: false,
        refund_window: null,
      }),
    );
  }

  private async ensureCompanyDepositRequirement(companyId: string, tx: DataSource['manager']) {
    const depositRepo = tx.getRepository(CompanyDepositRequirement);
    const existing = await depositRepo.findOne({ where: { company_id: companyId } });
    if (existing) {
      return;
    }

    await depositRepo.save(
      depositRepo.create({
        company_id: companyId,
        state: false,
        amount: 0,
      }),
    );
  }

  private async ensureCompanyPaymentMethods(companyId: string, tx: DataSource['manager']) {
    const paymentMethodRepo = tx.getRepository(PaymentMethod);
    const companyPaymentMethodRepo = tx.getRepository(CompanyPaymentMethod);

    const baseMethods = await paymentMethodRepo.find();
    if (!baseMethods.length) {
      return;
    }

    const existing = await companyPaymentMethodRepo.find({
      where: { company_id: companyId },
      select: ['payment_method_id'],
    });
    const existingIds = new Set(existing.map((row) => row.payment_method_id));

    const toCreate = baseMethods
      .filter((method) => !existingIds.has(method.id))
      .map((method) =>
        companyPaymentMethodRepo.create({
          company_id: companyId,
          payment_method_id: method.id,
          name: method.name,
          description: method.description ?? null,
          state: method.default_state,
        }),
      );

    if (toCreate.length) {
      await companyPaymentMethodRepo.save(toCreate);
    }
  }

  private buildRecurringSubscriptionItemFromPrice(
    price: Stripe.Price,
    period: PriceInterval,
    periodMultiplier: number,
    kind: 'plan' | 'addon' | 'additional_practitioners',
    addonId?: string,
  ): Stripe.SubscriptionCreateParams.Item {
    if (!price.recurring || price.type !== 'recurring') {
      throw new BadRequestException('Stripe price must be recurring');
    }

    const desiredInterval: Stripe.Price.Recurring.Interval =
      period === 'yearly' ? 'year' : 'month';

    if (period === 'monthly' && price.recurring.interval === 'year') {
      throw new BadRequestException('Monthly period requires a monthly price');
    }

    const metadata: Record<string, string> = {
      interval: period,
      kind,
    };
    if (addonId) {
      metadata.addon_id = addonId;
    }

    if (price.recurring.interval === desiredInterval) {
      return {
        price: price.id,
        metadata,
      };
    }

    if (price.unit_amount == null) {
      throw new BadRequestException('Stripe price is missing unit amount');
    }

    const productId =
      typeof price.product === 'string' ? price.product : price.product.id;

    return {
      price_data: {
        currency: price.currency,
        product: productId,
        unit_amount: Number(price.unit_amount) * periodMultiplier,
        recurring: { interval: desiredInterval },
      },
      metadata,
    };
  }

  private buildOneTimeInvoiceItemFromPrice(
    price: Stripe.Price,
    periodMultiplier: number,
    metadata: Record<string, string>,
  ): Stripe.SubscriptionCreateParams.AddInvoiceItem {
    if (price.type !== 'one_time') {
      throw new BadRequestException('Stripe price must be one-time');
    }
    if (price.unit_amount == null) {
      throw new BadRequestException('Stripe price is missing unit amount');
    }
    if (!price.currency) {
      throw new BadRequestException('Stripe price is missing currency');
    }

    const unitAmount = Number(price.unit_amount) * periodMultiplier;
    if (periodMultiplier === 1) {
      return {
        price: price.id,
        quantity: 1,
        metadata,
      };
    }

    const productId =
      typeof price.product === 'string' ? price.product : price.product.id;

    return {
      price_data: {
        currency: price.currency,
        product: productId,
        unit_amount: unitAmount,
      },
      quantity: 1,
      metadata,
    };
  }

  private getRecurringUnitAmountCents(
    price: Stripe.Price,
    period: PriceInterval,
    periodMultiplier: number,
  ): number {
    if (!price.recurring || price.type !== 'recurring') {
      throw new BadRequestException('Stripe price must be recurring');
    }
    if (price.unit_amount == null) {
      throw new BadRequestException('Stripe price is missing unit amount');
    }

    if (period === 'monthly' && price.recurring.interval === 'year') {
      throw new BadRequestException('Monthly period requires a monthly price');
    }

    if (period === 'yearly' && price.recurring.interval === 'month') {
      return Number(price.unit_amount) * periodMultiplier;
    }

    return Number(price.unit_amount);
  }

  private getOneTimeUnitAmountCents(
    price: Stripe.Price,
    periodMultiplier: number,
  ): number {
    if (price.type !== 'one_time') {
      throw new BadRequestException('Stripe price must be one-time');
    }
    if (price.unit_amount == null) {
      throw new BadRequestException('Stripe price is missing unit amount');
    }
    return Number(price.unit_amount) * periodMultiplier;
  }

  private hashSelectionFingerprint(payload: {
    plan_price_id: string;
    period: PriceInterval;
    total_cents: number;
    additional_practitioners: number;
    addon_price_ids: string[];
  }): string {
    const base = JSON.stringify({
      plan_price_id: payload.plan_price_id,
      period: payload.period,
      total_cents: payload.total_cents,
      additional_practitioners: payload.additional_practitioners,
      addon_price_ids: payload.addon_price_ids,
    });
    return createHash('sha256').update(base).digest('hex').slice(0, 16);
  }

  private buildSubscriptionIdempotencyKey(payload: {
    company_id: string;
    plan_price_id: string;
    period: PriceInterval;
    selection_hash: string;
  }): string {
    return `onboarding_subscription_v2_${payload.company_id}_${payload.plan_price_id}_${payload.period}_${payload.selection_hash}`;
  }

  private async attachCompanyLogoMedia(
    company: Company,
    logoRef: string,
    tx: DataSource['manager'],
  ): Promise<Media> {
    const mediaRepo = tx.getRepository(Media);
    const qb = mediaRepo.createQueryBuilder('media')
      .where('media.filename = :logoRef', { logoRef })
      .orWhere('media.url = :logoRef', { logoRef })
      .orWhere('media.file_path = :logoRef', { logoRef });

    if (/^\d+$/.test(logoRef)) {
      qb.orWhere('media.id = :logoId', { logoId: Number(logoRef) });
    }

    const media = await qb.getOne();
    if (!media) {
      throw new BadRequestException('Logo media not found');
    }

    media.owner_id = String(company.id);
    media.owner_type = 'Company';
    media.collection = 'company_logo';

    return await mediaRepo.save(media);
  }

  private throwValidationError(field: string, message: string): never {
    throw new BadRequestException({
      messages: { [field]: message },
      error: 'Bad Request',
      statusCode: 400,
    });
  }
}
