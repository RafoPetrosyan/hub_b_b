import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Company } from '../../entities/company.entity';
import { CompanyAddress } from '../../modules/company-address/entities/company-address.entity';
import { CompanyBooking } from './entities/company-booking.entity';
import { User } from '../../../user/entities/user.entity';
import { Media } from '../../../../../common/modules/media/media.entity';
import { CompanyProfileController } from './company-profile.controller';
import { CompanyProfileService } from './company-profile.service';
import { CompanyTenantGuard } from '../../../../../../guards/company-tenant.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Company,
      CompanyAddress,
      CompanyBooking,
      User,
      Media,
    ]),
  ],
  controllers: [CompanyProfileController],
  providers: [CompanyProfileService, CompanyTenantGuard],
  exports: [CompanyProfileService],
})
export class CompanyProfileModule {}
