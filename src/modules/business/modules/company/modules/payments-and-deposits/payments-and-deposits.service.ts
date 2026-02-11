import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CompanyPaymentMethod } from '../company-payment-methods/entities/company-payment-method.entity';
import {
  CompanyDepositRequirement,
} from '../deposit-requirements/entities/company-deposit-requirement.entity';
import {
  CompanyRefundPolicy,
} from '../refund-policy/entities/company-refund-policy.entity';
import { PaymentMethod } from '../../../../../admin/modules/payment-methods/entities/payment-method.entity';
import { UpdatePaymentsAndDepositsDto } from './dto/update-payments-and-deposits.dto';

@Injectable()
export class PaymentsAndDepositsService {
  constructor(
    @InjectRepository(CompanyPaymentMethod)
    private readonly companyPaymentMethodRepository: Repository<CompanyPaymentMethod>,
    @InjectRepository(CompanyDepositRequirement)
    private readonly depositRequirementRepository: Repository<CompanyDepositRequirement>,
    @InjectRepository(CompanyRefundPolicy)
    private readonly refundPolicyRepository: Repository<CompanyRefundPolicy>,
    @InjectRepository(PaymentMethod)
    private readonly paymentMethodRepository: Repository<PaymentMethod>,
    private readonly dataSource: DataSource,
  ) {
  }

  async getForCompany(companyId: string) {
    await this.ensureCompanyPaymentMethods(companyId);
    const paymentMethods = await this.companyPaymentMethodRepository.find({
      where: { company_id: companyId },
      order: { name: 'ASC' },
    });
    const depositRequirement = await this.ensureDepositRequirement(companyId);
    const refundPolicy = await this.ensureRefundPolicy(companyId);

    return {
      payment_methods: paymentMethods.map((method) => ({
        id: method.id,
        name: method.name,
        description: method.description ?? null,
        state: method.state,
      })),
      deposit_requirement: {
        state: depositRequirement.state,
        amount: depositRequirement.amount,
      },
      refund_policy: {
        automatic_refunds: refundPolicy.automatic_refunds,
        require_deposit: refundPolicy.require_deposit,
        refund_window: refundPolicy.refund_window ?? null,
      },
    };
  }

  async updateForCompany(companyId: string, dto: UpdatePaymentsAndDepositsDto) {
    return this.dataSource.transaction(async (tx) => {
      const companyPaymentMethodRepo = tx.getRepository(CompanyPaymentMethod);
      const depositRequirementRepo = tx.getRepository(CompanyDepositRequirement);
      const refundPolicyRepo = tx.getRepository(CompanyRefundPolicy);
      const paymentMethodRepo = tx.getRepository(PaymentMethod);

      if (dto.payment_methods) {
        for (const item of dto.payment_methods) {
          const method = await companyPaymentMethodRepo.findOne({
            where: { id: item.id, company_id: companyId },
          });
          if (!method) {
            throw new NotFoundException('Company payment method not found');
          }

          if (item.name !== undefined) {
            method.name = item.name;
          }
          if (item.description !== undefined) {
            method.description = item.description ?? null;
          }
          if (item.state !== undefined) {
            method.state = item.state;
          }

          await companyPaymentMethodRepo.save(method);
        }
      } else {
        await this.ensureCompanyPaymentMethods(companyId, paymentMethodRepo, companyPaymentMethodRepo);
      }

      if (dto.deposit_requirement) {
        let deposit = await depositRequirementRepo.findOne({
          where: { company_id: companyId },
        });
        if (!deposit) {
          deposit = depositRequirementRepo.create({
            company_id: companyId,
            state: false,
            amount: 0,
          });
        }
        if (dto.deposit_requirement.state !== undefined) {
          deposit.state = dto.deposit_requirement.state;
        }
        if (dto.deposit_requirement.amount !== undefined) {
          deposit.amount = dto.deposit_requirement.amount;
        }
        await depositRequirementRepo.save(deposit);
      }

      if (dto.refund_policy) {
        let refund = await refundPolicyRepo.findOne({
          where: { company_id: companyId },
        });
        if (!refund) {
          refund = refundPolicyRepo.create({
            company_id: companyId,
            automatic_refunds: false,
            require_deposit: false,
            refund_window: null,
          });
        }

        if (dto.refund_policy.automatic_refunds !== undefined) {
          refund.automatic_refunds = dto.refund_policy.automatic_refunds;
        }
        if (dto.refund_policy.require_deposit !== undefined) {
          refund.require_deposit = dto.refund_policy.require_deposit;
        }
        if (dto.refund_policy.refund_window !== undefined) {
          refund.refund_window = dto.refund_policy.refund_window ?? null;
        }
        await refundPolicyRepo.save(refund);
      }

      return this.getForCompany(companyId);
    });
  }

  private async ensureCompanyPaymentMethods(
    companyId: string,
    paymentMethodRepo: Repository<PaymentMethod> = this.paymentMethodRepository,
    companyPaymentMethodRepo: Repository<CompanyPaymentMethod> = this.companyPaymentMethodRepository,
  ) {
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

  private async ensureDepositRequirement(companyId: string) {
    let deposit = await this.depositRequirementRepository.findOne({
      where: { company_id: companyId },
    });
    if (!deposit) {
      deposit = await this.depositRequirementRepository.save(
        this.depositRequirementRepository.create({
          company_id: companyId,
          state: false,
          amount: 0,
        }),
      );
    }
    return deposit;
  }

  private async ensureRefundPolicy(companyId: string) {
    let refund = await this.refundPolicyRepository.findOne({
      where: { company_id: companyId },
    });
    if (!refund) {
      refund = await this.refundPolicyRepository.save(
        this.refundPolicyRepository.create({
          company_id: companyId,
          automatic_refunds: false,
          require_deposit: false,
          refund_window: null,
        }),
      );
    }
    return refund;
  }
}
