import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyAddress } from './entities/company-address.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CompanyAddress])],
  exports: [TypeOrmModule],
})
export class CompanyAddressModule {
}
