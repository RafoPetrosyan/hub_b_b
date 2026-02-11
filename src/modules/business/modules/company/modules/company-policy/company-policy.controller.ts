import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard, Roles, RolesGuard, UserRole } from '../../../../../auth';
import { CompanyTenantGuard } from '../../../../../../guards/company-tenant.guard';
import { CompanyPolicyService } from './company-policy.service';
import { CreateCompanyPolicyDto } from './dto/create-company-policy.dto';
import { UpdateCompanyPolicyDto } from './dto/update-company-policy.dto';
import { CompanyPolicyDto } from './dto/get-company-policy.dto';

@ApiTags('company policies')
@ApiBearerAuth('JWT-auth')
@Controller('api/company/policies')
@UseGuards(AuthGuard, RolesGuard, CompanyTenantGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.BUSINESS_ADMIN)
export class CompanyPolicyController {
  constructor(private readonly companyPolicyService: CompanyPolicyService) {
  }

  @Get()
  @ApiOperation({
    summary: 'List company policies',
    description:
      'Retrieves company policies with base policy details and field validation rules.',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved company policies',
    type: [CompanyPolicyDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  list(@Req() req: any) {
    return this.companyPolicyService.listForCompany(req.userCompany);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get company policy',
    description:
      'Retrieves a company policy with base policy details and field validation rules.',
  })
  @ApiParam({
    name: 'id',
    description: 'Company policy unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174111',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved company policy',
    type: CompanyPolicyDto,
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
    description: 'Company policy not found',
  })
  getOne(@Param('id') id: string, @Req() req: any) {
    return this.companyPolicyService.getForCompany(id, req.userCompany);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create company policy',
    description: 'Creates a company policy from a base policy.',
  })
  @ApiBody({ type: CreateCompanyPolicyDto })
  @ApiResponse({
    status: 201,
    description: 'Company policy created successfully',
    type: CompanyPolicyDto,
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
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Base policy not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Company policy already exists',
  })
  create(@Req() req: any, @Body() dto: CreateCompanyPolicyDto) {
    return this.companyPolicyService.createForCompany(req.userCompany, dto);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update company policy',
    description: 'Updates company policy data and enabled state.',
  })
  @ApiParam({
    name: 'id',
    description: 'Company policy unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174111',
  })
  @ApiBody({ type: UpdateCompanyPolicyDto })
  @ApiResponse({
    status: 200,
    description: 'Company policy updated successfully',
    type: CompanyPolicyDto,
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
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Company policy not found',
  })
  update(@Param('id') id: string, @Req() req: any, @Body() dto: UpdateCompanyPolicyDto) {
    return this.companyPolicyService.updateForCompany(id, req.userCompany, dto);
  }
}
