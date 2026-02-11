import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { SubscriptionPlansService } from './subscription-plans.service';
import { SetAddonForPlanDto } from '../add-ons/dto/set-addon-for-plan.dto';
import { CreatePlanPriceDto } from './dto/create-plan-price.dto';
import { CreatePlanOptionDto } from './dto/create-plan-option.dto';
import { AuthGuard, Roles, RolesGuard, UserRole } from '../../../auth';
import { ApiTags } from '@nestjs/swagger';

@Controller('api/admin/subscriptions')
@ApiTags('admin subscription-plans')
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
export class SubscriptionPlansController {
  constructor(private readonly svc: SubscriptionPlansService) {
  }

  @Get('tiers') listTiers() {
    return this.svc.listTiers();
  }

  @Post('plan-options') createPlanOption(@Body() body: CreatePlanOptionDto) {
    return this.svc.createPlanOption(body);
  }

  @Post('plan-prices') createPlanPrice(@Body() body: CreatePlanPriceDto) {
    return this.svc.createPlanPrice(body);
  }

  @Post('plan-options/:id/addons') setAddOns(
    @Param('id') id: string,
    @Body() body: { data: SetAddonForPlanDto[] }) {
    return this.svc.setAddOnsForPlanOption(id, body.data);
  }
}
