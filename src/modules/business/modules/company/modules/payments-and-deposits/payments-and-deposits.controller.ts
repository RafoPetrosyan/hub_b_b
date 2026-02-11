import { Body, Controller, Get, HttpCode, HttpStatus, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../../../../auth';
import { CompanyTenantGuard } from '../../../../../../guards/company-tenant.guard';
import { PaymentsAndDepositsService } from './payments-and-deposits.service';
import { GetPaymentsAndDepositsDto } from './dto/get-payments-and-deposits.dto';
import { UpdatePaymentsAndDepositsDto } from './dto/update-payments-and-deposits.dto';

@ApiTags('company payments-and-deposits')
@ApiBearerAuth('JWT-auth')
@Controller('api/company/payments-and-deposits')
export class PaymentsAndDepositsController {
  constructor(private readonly paymentsAndDepositsService: PaymentsAndDepositsService) {
  }

  @Get()
  @UseGuards(AuthGuard, CompanyTenantGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get payments and deposits settings',
    description: 'Retrieves company payment methods, deposit requirements, and refund policy.',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved payments and deposits settings',
    type: GetPaymentsAndDepositsDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  get(@Req() req: any) {
    return this.paymentsAndDepositsService.getForCompany(req.userCompany);
  }

  @Put()
  @UseGuards(AuthGuard, CompanyTenantGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update payments and deposits settings',
    description: 'Updates company payment methods, deposit requirements, and refund policy.',
  })
  @ApiBody({ type: UpdatePaymentsAndDepositsDto })
  @ApiResponse({
    status: 200,
    description: 'Successfully updated payments and deposits settings',
    type: GetPaymentsAndDepositsDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Validation error',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 404,
    description: 'Company payment method not found',
  })
  update(@Req() req: any, @Body() dto: UpdatePaymentsAndDepositsDto) {
    return this.paymentsAndDepositsService.updateForCompany(req.userCompany, dto);
  }
}
