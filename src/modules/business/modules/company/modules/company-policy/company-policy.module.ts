import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyPolicyService } from './company-policy.service';
import { CompanyPolicyController } from './company-policy.controller';
import { Policy } from './entities/policy.entity';
import { CompanyPolicy } from './entities/company-policy.entity';
import { Company } from '../../entities/company.entity';
import { User } from '../../../user/entities/user.entity';
import { CompanyTenantGuard } from '../../../../../../guards/company-tenant.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Policy, CompanyPolicy, Company, User])],
  providers: [CompanyPolicyService, CompanyTenantGuard],
  controllers: [CompanyPolicyController],
  exports: [CompanyPolicyService, TypeOrmModule],
})
export class CompanyPolicyModule {
}
