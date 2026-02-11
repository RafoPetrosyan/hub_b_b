import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard, Roles, RolesGuard, UserRole } from '../../../auth';
import { PaymentMethodsService } from './payment-methods.service';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
import { AdminPaymentMethodDto } from './dto/get-payment-method.dto';

@ApiTags('admin payment-methods')
@ApiBearerAuth('JWT-auth')
@Controller('api/admin/payment-methods')
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
export class PaymentMethodsController {
  constructor(private readonly paymentMethodsService: PaymentMethodsService) {
  }

  @Get()
  @ApiOperation({
    summary: 'List payment methods',
    description: 'Retrieves all base payment methods.',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved payment methods',
    type: [AdminPaymentMethodDto],
  })
  list() {
    return this.paymentMethodsService.list();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get payment method',
    description: 'Retrieves a base payment method by id.',
  })
  @ApiParam({
    name: 'id',
    description: 'Payment method UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved payment method',
    type: AdminPaymentMethodDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Payment method not found',
  })
  getById(@Param('id') id: string) {
    return this.paymentMethodsService.getById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create payment method',
    description: 'Creates a new base payment method.',
  })
  @ApiBody({ type: CreatePaymentMethodDto })
  @ApiResponse({
    status: 201,
    description: 'Payment method created',
    type: AdminPaymentMethodDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Payment method already exists',
  })
  create(@Body() dto: CreatePaymentMethodDto) {
    return this.paymentMethodsService.create(dto);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update payment method',
    description: 'Updates a base payment method.',
  })
  @ApiParam({
    name: 'id',
    description: 'Payment method UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({ type: UpdatePaymentMethodDto })
  @ApiResponse({
    status: 200,
    description: 'Payment method updated',
    type: AdminPaymentMethodDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Payment method not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Payment method already exists',
  })
  update(@Param('id') id: string, @Body() dto: UpdatePaymentMethodDto) {
    return this.paymentMethodsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete payment method',
    description: 'Deletes a base payment method.',
  })
  @ApiParam({
    name: 'id',
    description: 'Payment method UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment method deleted',
    schema: {
      type: 'object',
      properties: { success: { type: 'boolean', example: true } },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Payment method not found',
  })
  remove(@Param('id') id: string) {
    return this.paymentMethodsService.remove(id);
  }
}
