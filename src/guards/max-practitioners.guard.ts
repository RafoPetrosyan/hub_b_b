import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request } from 'express';
import { User } from '../modules/business/modules/user/entities/user.entity';
import {
  CompanySubscription,
  CompanySubscriptionStatus,
} from '../modules/business/modules/company/modules/stripe-subscriptions/entities/company-subscription.entity';

@Injectable()
export class MaxPractitionersGuard implements CanActivate {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(CompanySubscription)
    private readonly companySubscriptionRepo: Repository<CompanySubscription>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const companyId = (request as any).userCompany as string | undefined;
    if (!companyId) {
      throw new ForbiddenException('Company is not set in request context');
    }

    const subscription = await this.companySubscriptionRepo.findOne({
      where: [
        { company_id: companyId, status: CompanySubscriptionStatus.ACTIVE },
        { company_id: companyId, status: CompanySubscriptionStatus.TRIALING },
      ],
      order: { created_at: 'DESC' },
    });

    if (!subscription) {
      throw new ForbiddenException('Active subscription is required');
    }

    if (subscription.max_users == null) {
      return true;
    }

    const currentCount = await this.userRepo.count({
      where: { company_id: companyId },
    });

    if (currentCount >= subscription.max_users) {
      throw new ForbiddenException('Maximum practitioner limit reached');
    }

    return true;
  }
}
