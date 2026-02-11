import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SubscriptionPlansService } from './subscription-plans.service';
import { GetSubscriptionPlanDto } from './dto/get-subscription-plan.dto';

/**
 * Public endpoints to list plans and compute effective price
 */
@ApiTags('common subscription-plans')
@Controller('api/subscription-plans')
export class SubscriptionPlansPublicController {
  constructor(private readonly subscriptionPlansService: SubscriptionPlansService) {
  }

  @Get()
  @ApiOperation({
    summary: 'List active subscription plans',
    description: 'Retrieves a list of all active subscription plans available for public viewing. Results are ordered by price ascending.',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved active subscription plans',
    type: [GetSubscriptionPlanDto],
  })
  async listPublic() {
    return this.subscriptionPlansService.listPlans(false);
  }

  @Get('duration')
  @ApiOperation({
    summary: 'List subscription plans grouped by duration unit',
    description: 'Retrieves all active subscription plans grouped by their duration unit (month, year, etc.). Plans within each group are ordered by price ascending. Useful for displaying plans organized by billing frequency.',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved plans grouped by duration unit',
    schema: {
      type: 'object',
      additionalProperties: {
        type: 'array',
        items: { $ref: '#/components/schemas/GetSubscriptionPlanDto' },
      },
      example: {
        month: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'Monthly Plan',
            price_cents: 9999,
            duration_unit: 'month',
            duration_value: 1,
          },
        ],
        year: [
          {
            id: '223e4567-e89b-12d3-a456-426614174000',
            name: 'Annual Plan',
            price_cents: 99999,
            duration_unit: 'year',
            duration_value: 1,
          },
        ],
      },
    },
  })
  async listAvailableGroupedByDuration() {
    return this.subscriptionPlansService.listPlansByDuration(false);
  }

  @Get('tier/:id')
  @ApiOperation({
    summary: 'List subscription plans by tier',
    description: 'Retrieves subscription plans associated with a specific tier, ordered by price ascending.',
  })
  @ApiParam({
    name: 'id',
    description: 'Tier UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved subscription plans for the tier',
    type: [GetSubscriptionPlanDto],
  })
  async listByTiers(@Param('id') tier_id: string) {
    return this.subscriptionPlansService.listPlansByTier(tier_id);
  }
}
