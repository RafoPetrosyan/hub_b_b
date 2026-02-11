import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import Stripe from 'stripe';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AddPaymentMethodDto } from './dto/add-payment-method.dto';
import { Company } from '../../entities/company.entity';
import { StripeService } from '../../../../../common/modules/stripe/stripe.service';

const STRIPE_API_VERSION = '2026-01-28.clover';

@Injectable()
export class PaymentMethodsService {
  private readonly logger = new Logger(PaymentMethodsService.name);
  private readonly stripe: Stripe | null;

  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    private readonly stripeService?: StripeService,
  ) {
    const key = process.env.STRIPE_SECRET_KEY || null;
    this.stripe = key ? new Stripe(key, { apiVersion: STRIPE_API_VERSION }) : null;
  }

  async list(companyId: string) {
    const company = await this.companyRepository.findOne({ where: { id: companyId } });
    if (!company) throw new NotFoundException('Company not found');
    if (!company.stripe_customer_id) {
      return [];
    }

    const stripe = this.requireStripe();
    const customer = await stripe.customers.retrieve(company.stripe_customer_id);
    if (this.isDeletedCustomer(customer)) {
      throw new NotFoundException('Stripe customer not found');
    }
    const defaultPaymentMethodId = this.extractDefaultPaymentMethodId(customer);

    const result = await stripe.paymentMethods.list({
      customer: company.stripe_customer_id,
      type: 'card',
    });

    const mapped = result.data.map((pm) => this.mapStripePaymentMethod(pm, companyId, defaultPaymentMethodId));
    mapped.sort((a, b) => Number(b.is_primary) - Number(a.is_primary));
    return mapped;
  }

  async add(companyId: string, dto: AddPaymentMethodDto) {
    const company = await this.companyRepository.findOne({ where: { id: companyId } });
    if (!company) throw new NotFoundException('Company not found');

    const hasClientPM = !!dto.payment_method_id;
    const hasToken = !!dto.token;
    const hasCardFields = !!(dto.card_number && dto.cvc && dto.exp_month && dto.exp_year);

    if (!hasClientPM && !hasToken && !hasCardFields) {
      throw new BadRequestException('payment_method_id, token or full card details required');
    }

    const stripe = this.requireStripe();
    const stripeCustomerId = await this.ensureStripeCustomer(company);

    let createdPm: Stripe.PaymentMethod;

    try {
      if (hasClientPM) {
        createdPm = await stripe.paymentMethods.attach(dto.payment_method_id, { customer: stripeCustomerId });
      } else if (hasToken) {
        const pmFromToken = await stripe.paymentMethods.create({
          type: 'card' as any,
          card: { token: dto.token },
        } as any);
        createdPm = await stripe.paymentMethods.attach(pmFromToken.id, { customer: stripeCustomerId });
      } else {
        const cardPayload: Stripe.PaymentMethodCreateParams.Card = {
          number: dto.card_number,
          exp_month: Number(dto.exp_month),
          exp_year: Number(dto.exp_year),
          cvc: dto.cvc,
        };

        const pm = await stripe.paymentMethods.create({
          type: 'card',
          card: cardPayload,
          billing_details: {
            name: dto.cardholder_name ?? undefined,
          },
        } as any);

        createdPm = await stripe.paymentMethods.attach(pm.id, { customer: stripeCustomerId });
      }
    } catch (err) {
      this.logger.error('Failed to create/attach payment method', err as any);
      throw new InternalServerErrorException('Failed to create/attach payment method: ' + (err as any).message);
    }

    const customer = await stripe.customers.retrieve(stripeCustomerId);
    if (this.isDeletedCustomer(customer)) {
      throw new NotFoundException('Stripe customer not found');
    }
    const defaultPaymentMethodId = this.extractDefaultPaymentMethodId(customer);
    const makePrimary = !!dto.make_primary || !defaultPaymentMethodId;

    if (makePrimary) {
      try {
        await stripe.customers.update(stripeCustomerId, { invoice_settings: { default_payment_method: createdPm.id } } as any);
      } catch (err) {
        this.logger.warn('Failed to set customer default_payment_method', err as any);
      }
    }

    try {
      const csRepo = this.companyRepository.manager.getRepository('company_subscriptions');
      const activeSub: any = await csRepo.findOne({ where: { company_id: companyId, status: 'active' } });
      if (activeSub && makePrimary) {
        try {
          await stripe.subscriptions.update(activeSub.stripe_subscription_id, {
            default_payment_method: createdPm.id,
          } as any);
        } catch (err) {
          this.logger.warn('Failed to update subscription default_payment_method: ' + (err as any).message);
        }
      }
    } catch (err) {
      // ignore if repo missing
    }

    return {
      id: createdPm.id,
      stripe_payment_method_id: createdPm.id,
      type: createdPm.type,
      last4: createdPm.card?.last4 ?? null,
      brand: createdPm.card?.brand ?? null,
      exp_month: createdPm.card?.exp_month ?? null,
      exp_year: createdPm.card?.exp_year ?? null,
      billing_name: createdPm.billing_details?.name ?? null,
      is_primary: makePrimary,
      created_at: createdPm.created ? new Date(createdPm.created * 1000) : new Date(),
    };
  }

  async remove(companyId: string, id: string) {
    const company = await this.companyRepository.findOne({ where: { id: companyId } });
    if (!company) throw new NotFoundException('Company not found');

    if (!company.stripe_customer_id) throw new NotFoundException('Stripe customer not found');

    const stripe = this.requireStripe();
    const customer = await stripe.customers.retrieve(company.stripe_customer_id);
    if (this.isDeletedCustomer(customer)) {
      throw new NotFoundException('Stripe customer not found');
    }
    const defaultPaymentMethodId = this.extractDefaultPaymentMethodId(customer);

    if (defaultPaymentMethodId && defaultPaymentMethodId === id) {
      throw new BadRequestException('Cannot delete primary payment method');
    }

    try {
      await stripe.paymentMethods.detach(id);
    } catch (err) {
      this.logger.warn('Failed to detach payment method: ' + (err).message);
    }

    return { deleted: true };
  }

  async setPrimary(companyId: string, id: string) {
    const company = await this.companyRepository.findOne({ where: { id: companyId } });
    if (!company) throw new NotFoundException('Company not found');

    const stripe = this.requireStripe();
    const stripeCustomerId = await this.ensureStripeCustomer(company);

    try {
      await stripe.customers.update(stripeCustomerId, { invoice_settings: { default_payment_method: id } });
    } catch (err) {
      this.logger.warn('Failed to set customer default payment method: ' + (err).message);
      throw new InternalServerErrorException('Failed to set default payment method: ' + (err).message);
    }

    try {
      const csRepo = this.companyRepository.manager.getRepository('company_subscriptions');
      const activeSub: any = await csRepo.findOne({ where: { company_id: companyId, status: 'active' } });
      if (activeSub) {
        try {
          await stripe.subscriptions.update(activeSub.stripe_subscription_id, {
            default_payment_method: id,
          });
        } catch (err) {
          this.logger.warn('Failed to update subscription default payment method: ' + (err).message);
        }
      }
    } catch (err) {
      // ignore
    }

    return { ok: true };
  }

  private requireStripe() {
    if (!this.stripe) throw new InternalServerErrorException('Stripe not configured (STRIPE_SECRET_KEY missing)');
    return this.stripe;
  }

  private async ensureStripeCustomer(company: Company) {
    const stripe = this.requireStripe();
    let customerId = (company).stripe_customer_id;
    if (customerId) return customerId;

    const customer = await stripe.customers.create(
      {
        name: company.business_name ?? undefined,
        metadata: { company_id: company.id },
      },
      { idempotencyKey: `create_customer_company_${company.id}` },
    );

    try {
      await this.companyRepository.update(company.id, { stripe_customer_id: customer.id });
    } catch (err) {
      this.logger.warn('Failed to persist stripe_customer_id to company: ' + (err).message);
    }
    return customer.id;
  }

  async addStripeOnly(
    companyId: string,
    dto: {
      stripe_customer_id: string;
      card_number: string;
      cvc: string;
      exp_month: number;
      exp_year: number;
      cardholder_name: string;
      make_primary?: boolean;
    },
  ) {
    const stripe = this.requireStripe();

    const pm = await stripe.paymentMethods.create({
      type: 'card',
      card: {
        number: dto.card_number,
        exp_month: dto.exp_month,
        exp_year: dto.exp_year,
        cvc: dto.cvc,
      },
      billing_details: {
        name: dto.cardholder_name,
      },
      metadata: { company_id: String(companyId) },
    }, { idempotencyKey: `pm_create_${companyId}_${dto.exp_month}_${dto.exp_year}_${Date.now()}` });

    await stripe.paymentMethods.attach(pm.id, { customer: dto.stripe_customer_id });

    if (dto.make_primary) {
      await stripe.customers.update(dto.stripe_customer_id, {
        invoice_settings: { default_payment_method: pm.id },
      });
    }

    return {
      stripe_payment_method_id: pm.id,
      brand: (pm.card?.brand ?? null),
      last4: (pm.card?.last4 ?? null),
      exp_month: (pm.card?.exp_month ?? null),
      exp_year: (pm.card?.exp_year ?? null),
      fingerprint: (pm.card?.fingerprint ?? null),
    };
  }

  async getPrimaryStripePaymentMethodId(companyId: string): Promise<string> {
    if (!companyId) throw new BadRequestException('companyId is required');

    const company = await this.companyRepository.findOne({ where: { id: companyId } });
    if (!company) throw new NotFoundException('Company not found');
    if (!company.stripe_customer_id) throw new NotFoundException('Stripe customer not found');

    const stripe = this.requireStripe();
    const customer = await stripe.customers.retrieve(company.stripe_customer_id);
    if (this.isDeletedCustomer(customer)) {
      throw new NotFoundException('Stripe customer not found');
    }
    const defaultPaymentMethodId = this.extractDefaultPaymentMethodId(customer);

    if (!defaultPaymentMethodId) {
      throw new NotFoundException('Primary payment method not found');
    }

    return defaultPaymentMethodId;
  }

  private mapStripePaymentMethod(
    pm: Stripe.PaymentMethod,
    companyId: string,
    defaultPaymentMethodId: string | null,
  ) {
    const card = pm.card ?? (pm as any).card;
    return {
      id: pm.id,
      company_id: companyId,
      stripe_payment_method_id: pm.id,
      type: pm.type,
      last4: card?.last4 ?? null,
      brand: card?.brand ?? null,
      exp_month: card?.exp_month ?? null,
      exp_year: card?.exp_year ?? null,
      billing_name: pm.billing_details?.name ?? null,
      is_primary: defaultPaymentMethodId === pm.id,
      fingerprint: card?.fingerprint ?? null,
      metadata: {
        id: pm.id,
        created: pm.created,
        type: pm.type,
        card: {
          last4: card?.last4 ?? null,
          brand: card?.brand ?? null,
          exp_month: card?.exp_month ?? null,
          exp_year: card?.exp_year ?? null,
          fingerprint: card?.fingerprint ?? null,
        },
      },
      created_at: pm.created ? new Date(pm.created * 1000) : new Date(),
      updated_at: pm.created ? new Date(pm.created * 1000) : new Date(),
    };
  }

  private isDeletedCustomer(customer: Stripe.Customer | Stripe.DeletedCustomer): customer is Stripe.DeletedCustomer {
    return (customer as Stripe.DeletedCustomer).deleted === true;
  }

  private extractDefaultPaymentMethodId(customer: Stripe.Customer): string | null {
    const defaultPm = customer.invoice_settings?.default_payment_method ?? null;
    if (!defaultPm) return null;
    if (typeof defaultPm === 'string') return defaultPm;
    return defaultPm.id ?? null;
  }
}
