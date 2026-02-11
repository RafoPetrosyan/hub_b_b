import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Policy } from './entities/policy.entity';
import { CompanyPolicy } from './entities/company-policy.entity';
import { CreateCompanyPolicyDto } from './dto/create-company-policy.dto';
import { UpdateCompanyPolicyDto } from './dto/update-company-policy.dto';

@Injectable()
export class CompanyPolicyService {
  constructor(
    @InjectRepository(Policy)
    private readonly policyRepository: Repository<Policy>,
    @InjectRepository(CompanyPolicy)
    private readonly companyPolicyRepository: Repository<CompanyPolicy>,
  ) {
  }

  async listForCompany(companyId: string) {
    await this.ensureCompanyPolicies(companyId);

    const policies = await this.companyPolicyRepository.find({
      where: { company_id: companyId },
      relations: { policy: true },
      order: { created_at: 'ASC' },
    });

    return policies.map((policy) => this.mapCompanyPolicy(policy));
  }

  async getForCompany(id: string, companyId: string) {
    const companyPolicy = await this.companyPolicyRepository.findOne({
      where: { id, company_id: companyId },
      relations: { policy: true },
    });

    if (!companyPolicy) {
      throw new NotFoundException('Company policy not found');
    }

    return this.mapCompanyPolicy(companyPolicy);
  }

  async createForCompany(companyId: string, dto: CreateCompanyPolicyDto) {
    const basePolicy = await this.policyRepository.findOne({
      where: { id: dto.policy_id },
    });

    if (!basePolicy) {
      throw new NotFoundException('Policy not found');
    }

    const existing = await this.companyPolicyRepository.findOne({
      where: { company_id: companyId, policy_id: basePolicy.id },
    });

    if (existing) {
      throw new ConflictException('Company policy already exists');
    }

    const entity = this.companyPolicyRepository.create({
      company_id: companyId,
      policy_id: basePolicy.id,
      slug: basePolicy.slug,
      data: dto.data ?? {},
      state: dto.state ?? basePolicy.default_state,
    });

    const saved = await this.companyPolicyRepository.save(entity);
    const withPolicy = await this.companyPolicyRepository.findOne({
      where: { id: saved.id },
      relations: { policy: true },
    });

    if (!withPolicy) {
      throw new NotFoundException('Company policy not found');
    }

    return this.mapCompanyPolicy(withPolicy);
  }

  async updateForCompany(id: string, companyId: string, dto: UpdateCompanyPolicyDto) {
    const companyPolicy = await this.companyPolicyRepository.findOne({
      where: { id, company_id: companyId },
      relations: { policy: true },
    });

    if (!companyPolicy) {
      throw new NotFoundException('Company policy not found');
    }

    if (dto.data !== undefined) {
      companyPolicy.data = dto.data;
    }
    if (dto.state !== undefined) {
      companyPolicy.state = dto.state;
    }

    const saved = await this.companyPolicyRepository.save(companyPolicy);
    return this.mapCompanyPolicy(saved);
  }

  async deleteForCompany(id: string, companyId: string) {
    const companyPolicy = await this.companyPolicyRepository.findOne({
      where: { id, company_id: companyId },
    });

    if (!companyPolicy) {
      throw new NotFoundException('Company policy not found');
    }

    await this.companyPolicyRepository.remove(companyPolicy);
    return { success: true };
  }

  private async ensureCompanyPolicies(companyId: string) {
    const basePolicies = await this.policyRepository.find();
    if (!basePolicies.length) {
      return;
    }

    const existing = await this.companyPolicyRepository.find({
      where: { company_id: companyId },
      select: ['policy_id'],
    });
    const existingIds = new Set(existing.map((row) => row.policy_id));

    const toCreate = basePolicies
      .filter((policy) => !existingIds.has(policy.id))
      .map((policy) =>
        this.companyPolicyRepository.create({
          company_id: companyId,
          policy_id: policy.id,
          slug: policy.slug,
          data: {},
          state: policy.default_state,
        }),
      );

    if (toCreate.length) {
      await this.companyPolicyRepository.save(toCreate);
    }
  }

  private mapCompanyPolicy(companyPolicy: CompanyPolicy) {
    const policy = companyPolicy.policy;

    return {
      id: companyPolicy.id,
      company_id: companyPolicy.company_id,
      policy_id: companyPolicy.policy_id,
      slug: companyPolicy.slug,
      data: companyPolicy.data ?? {},
      state: companyPolicy.state,
      policy: policy
        ? {
          id: policy.id,
          name: policy.name,
          description: policy.description ?? null,
          slug: policy.slug,
          default_state: policy.default_state,
          default_text: policy.default_text ?? null,
          is_additional: policy.is_additional,
          fields: policy.fields ?? null,
        }
        : null,
    };
  }
}
