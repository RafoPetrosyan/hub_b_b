import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StripeSubscriptionsService } from './stripe-subscriptions.service';
import { CreateCompanySubscriptionDto } from './dto/create-company-subscription.dto';
import { GetCompanySubscriptionDto } from './dto/get-company-subscription.dto';
import { GetSubscriptionHistoryDto } from './dto/get-subscription-history.dto';
import { GetTransactionDto } from './dto/get-transaction.dto';
import { AuthGuard, Roles, RolesGuard, UserRole } from '../../../../../auth';

@ApiTags('company subscriptions')
@ApiBearerAuth('JWT-auth')
@Controller('api/company/subscriptions')
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.BUSINESS_ADMIN, UserRole.MANAGER)
export class CompanySubscriptionsController {
  constructor(private readonly stripeSubscriptionsService: StripeSubscriptionsService) {
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new company subscription',
    description: 'Creates a new subscription for a company with the specified plan and payment method. Optionally applies a coupon code. Creates a Stripe customer if one does not exist.',
  })
  @ApiBody({ type: CreateCompanySubscriptionDto })
  @ApiResponse({
    status: 201,
    description: 'Subscription successfully created',
    type: GetCompanySubscriptionDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Validation error or invalid payment method',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Company or plan not found',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error - Stripe operation failed',
  })
  async create(@Body() dto: CreateCompanySubscriptionDto) {
    return this.stripeSubscriptionsService.createCompanySubscription(dto as any);
  }

  @Get('active/:companyId')
  @ApiOperation({
    summary: 'Get active subscription for a company',
    description: 'Retrieves the currently active subscription for a company. Uses the authenticated user\'s company when available.',
  })
  @ApiParam({
    name: 'companyId',
    description: 'Company UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved active subscription',
    type: GetCompanySubscriptionDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'No active subscription found',
  })
  async active(@Request() req: any, @Param('companyId') companyIdParam?: number) {
    const companyId = req.userCompany ?? companyIdParam;
    return this.stripeSubscriptionsService.getActiveSubscriptionForCompany(companyId);
  }

  @Get('history/:companyId')
  @ApiOperation({
    summary: 'Get subscription history for a company',
    description: 'Retrieves all subscriptions (active and past) for a company along with their billing periods. Uses the authenticated user\'s company when available.',
  })
  @ApiParam({
    name: 'companyId',
    description: 'Company UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved subscription history',
    type: [GetSubscriptionHistoryDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  async history(@Request() req: any, @Param('companyId') companyIdParam?: number) {
    const companyId = req.userCompany ?? companyIdParam;
    return this.stripeSubscriptionsService.getSubscriptionsHistory(companyId);
  }

  @Get('transactions/:companyId')
  @ApiOperation({
    summary: 'Get transaction history for a company',
    description: 'Retrieves all payment transactions (invoices, charges, payment intents) for a company. Uses the authenticated user\'s company when available.',
  })
  @ApiParam({
    name: 'companyId',
    description: 'Company UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved transactions',
    type: [GetTransactionDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  async transactions(@Request() req: any, @Param('companyId') companyIdParam?: number) {
    const companyId = req.userCompany ?? companyIdParam;
    return this.stripeSubscriptionsService.getTransactionsForCompany(companyId);
  }

  @Post('subscriptions/:subscriptionId/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Confirm a Stripe subscription',
    description: 'Confirms a Stripe subscription by retrieving its latest status and payment intent. If the payment requires additional action (e.g., 3D Secure authentication), returns the client secret for the frontend to handle. Otherwise, updates and returns the confirmed subscription. Requires SUPER_ADMIN, ADMIN, BUSINESS_ADMIN, or MANAGER role.',
  })
  @ApiParam({
    name: 'subscriptionId',
    description: 'Stripe subscription ID',
    example: 'sub_1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Subscription confirmation result',
    schema: {
      oneOf: [
        {
          type: 'object',
          properties: {
            requires_action: {
              type: 'boolean',
              example: true,
              description: 'Indicates that payment requires additional action',
            },
            client_secret: {
              type: 'string',
              example: 'pi_1234567890_secret_abcdef',
              description: 'Client secret for payment confirmation (use with Stripe.js)',
            },
          },
          required: ['requires_action', 'client_secret'],
        },
        {
          $ref: '#/components/schemas/GetCompanySubscriptionDto',
        },
      ],
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions. Requires SUPER_ADMIN, ADMIN, BUSINESS_ADMIN, or MANAGER role.',
  })
  @ApiResponse({
    status: 404,
    description: 'Subscription not found in Stripe',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error - Stripe not configured or operation failed',
  })
  async confirmSubscription(@Param('subscriptionId') subscriptionId: string) {
    return this.stripeSubscriptionsService.confirmSubscription(subscriptionId);
  }
}
