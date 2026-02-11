import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentMethodsService } from './payment-methods.service';
import { PaymentMethodsController } from './payment-methods.controller';
import { Company } from '../../entities/company.entity';
import { StripeModule } from '../../../../../common/modules/stripe/stripe.module';

@Module({
  imports: [TypeOrmModule.forFeature([Company]), StripeModule],
  providers: [PaymentMethodsService],
  controllers: [PaymentMethodsController],
  exports: [PaymentMethodsService, TypeOrmModule],
})
export class PaymentMethodsModule {
}
