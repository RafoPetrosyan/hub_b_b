import { CanActivate, ExecutionContext, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request } from 'express';
import { AddOn } from '../modules/common/modules/add-ons/entities/add-on.entity';
import { CompanyAddOn } from '../modules/business/modules/add-ons/entities/add-on.entity';
import { ADDON_REQUIRED_KEY } from './addon-enabled.decorator';

@Injectable()
export class AddOnEnabledGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectRepository(AddOn)
    private readonly addOnRepo: Repository<AddOn>,
    @InjectRepository(CompanyAddOn)
    private readonly companyAddOnRepo: Repository<CompanyAddOn>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string>(ADDON_REQUIRED_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const companyId = (request as any).userCompany as string | undefined;
    if (!companyId) {
      throw new ForbiddenException('Company is not set in request context');
    }

    const addon = await this.addOnRepo.findOne({
      where: [{ id: required }, { slug: required }],
    });
    if (!addon) {
      throw new NotFoundException('Add-on not found');
    }

    const enabled = await this.companyAddOnRepo.findOne({
      where: { company_id: companyId, addon_id: addon.id },
    });
    if (!enabled) {
      throw new ForbiddenException('Add-on is not enabled for this company');
    }

    return true;
  }
}
