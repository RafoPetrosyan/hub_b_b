import { ApiProperty } from '@nestjs/swagger';
import { GetCompanySubscriptionDto } from './get-company-subscription.dto';
import { GetSubscriptionPeriodDto } from './get-subscription-period.dto';

export class GetSubscriptionHistoryDto {
  @ApiProperty({
    description: 'Subscription details',
    type: GetCompanySubscriptionDto,
  })
  subscription: GetCompanySubscriptionDto;

  @ApiProperty({
    description: 'Subscription periods',
    type: [GetSubscriptionPeriodDto],
  })
  periods: GetSubscriptionPeriodDto[];
}

