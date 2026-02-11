import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaymentMethodsService } from './payment-methods.service';
import { AddPaymentMethodDto } from './dto/add-payment-method.dto';
import { AddPaymentMethodResponseDto } from './dto/add-payment-method-response.dto';
import { GetPaymentMethodDto } from './dto/get-payment-method.dto';
import { AuthGuard, Roles, RolesGuard, UserRole } from '../../../../../auth';

@ApiTags('company payment-methods')
@ApiBearerAuth('JWT-auth')
@Controller('api/company/payment-methods')
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.BUSINESS_ADMIN)
export class PaymentMethodsController {
  constructor(private readonly paymentMethodsService: PaymentMethodsService) {
  }

  @Get()
  @ApiOperation({
    summary: 'List all payment methods for company',
    description: 'Retrieves all payment methods for the authenticated user\'s company. Results are ordered by primary status (primary first) and creation date (newest first).',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved payment methods',
    type: [GetPaymentMethodDto],
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
    description: 'Company not found',
  })
  async list(@Request() req: any) {
    const companyId = req.userCompany;
    return this.paymentMethodsService.list(companyId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add a new payment method',
    description: 'Adds a new payment method to the company. Either payment_method_id (to attach an existing Stripe PaymentMethod) or token (to create a new one) is required. Creates a Stripe customer if one does not exist. Optionally sets the payment method as primary.',
  })
  @ApiBody({ type: AddPaymentMethodDto })
  @ApiResponse({
    status: 201,
    description: 'Payment method successfully added',
    type: AddPaymentMethodResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Validation error or both payment_method_id and token are missing',
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
    description: 'Company not found',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error - Stripe not configured or operation failed',
  })
  async add(@Request() req: any, @Body() dto: AddPaymentMethodDto) {
    const companyId = req.userCompany;
    return this.paymentMethodsService.add(companyId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Remove a payment method',
    description: 'Removes a payment method from the company. Cannot delete the primary payment method. Detaches the payment method from Stripe customer.',
  })
  @ApiParam({
    name: 'id',
    description: 'Stripe payment method ID',
    example: 'pm_1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment method successfully removed',
    schema: {
      type: 'object',
      properties: {
        deleted: {
          type: 'boolean',
          example: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Cannot delete primary payment method',
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
    description: 'Payment method not found',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error - Stripe not configured',
  })
  async remove(@Request() req: any, @Param('id') id: string) {
    const companyId = req.userCompany;
    return this.paymentMethodsService.remove(companyId, id);
  }

  @Post(':id/primary')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Set payment method as primary',
    description: 'Sets a payment method as the primary payment method for the company. Updates the Stripe customer default payment method and active subscription default payment method.',
  })
  @ApiParam({
    name: 'id',
    description: 'Stripe payment method ID',
    example: 'pm_1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment method successfully set as primary',
    schema: {
      type: 'object',
      properties: {
        ok: {
          type: 'boolean',
          example: true,
        },
      },
    },
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
    description: 'Payment method or company not found',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error - Stripe not configured or operation failed',
  })
  async setPrimary(@Request() req: any, @Param('id') id: string) {
    const companyId = req.userCompany;
    return this.paymentMethodsService.setPrimary(companyId, id);
  }
}
