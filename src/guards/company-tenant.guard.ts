import { CanActivate, ExecutionContext, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Request } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from '../modules/business/modules/company/entities/company.entity';
import { User } from '../modules/business/modules/user/entities/user.entity';

@Injectable()
export class CompanyTenantGuard implements CanActivate {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const userId = (request as any).userId as string;
    if (!userId) {
      throw new ForbiddenException('User not authenticated');
    }

    const user = await this.userRepository.findOneBy({
      id: userId,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const subdomain = this.extractSubdomain(request);

    if (!subdomain) {
      throw new ForbiddenException('Tenant subdomain is missing');
    }

    const company = await this.companyRepository.findOne({
      where: { subdomain },
    });

    if (!company) {
      throw new ForbiddenException('Company not found for tenant');
    }

    if (user.company_id !== company.id) {
      throw new ForbiddenException(
        'You do not belong to this company',
      );
    }

    (request as any).tenantId = company.id;

    return true;
  }

  private extractSubdomain(request: Request): string | null {
    // Header (preferred)
    const headerSubdomain =
      request.headers['x-tenant'] ||
      request.headers['x-company-subdomain'];

    if (typeof headerSubdomain === 'string') {
      return headerSubdomain.toLowerCase();
    }

    // Host-based subdomain
    const host =
      request.headers['x-forwarded-host'] ||
      request.headers.host;

    if (!host || typeof host !== 'string') {
      return null;
    }

    const hostname = host.split(':')[0]; // remove port
    const parts = hostname.split('.');

    // example: tenant.example.com → ['tenant','example','com']
    if (parts.length < 3) {
      return null;
    }

    return parts[0].toLowerCase();
  }
}
