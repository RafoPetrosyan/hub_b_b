import { Body, Controller, Delete, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AddOnsService } from './add-ons.service';
import { AuthGuard, Roles, RolesGuard, UserRole } from '../../../auth';
import { SetAddonForPlanDto } from './dto/set-addon-for-plan.dto';
import { CreateAddOnDto } from './dto/create-add-on.dto';
import { EnableAddonsForCompanyDto } from './dto/enable-addons-for-company.dto';
import { GetAddOnDto } from '../../../common/modules/add-ons/dto/get-add-on.dto';

@ApiTags('admin add-ons')
@ApiBearerAuth('JWT-auth')
@Controller('api/admin/addons')
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
export class AddOnsController {
  constructor(private readonly svc: AddOnsService) {
  }

  @Post()
  @ApiOperation({
    summary: 'Create an add-on',
    description: 'Creates a new add-on. Requires SUPER_ADMIN or ADMIN role.',
  })
  @ApiBody({ type: CreateAddOnDto })
  @ApiResponse({
    status: 201,
    description: 'Add-on successfully created',
    type: GetAddOnDto,
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
    description: 'Forbidden - Requires SUPER_ADMIN or ADMIN role',
  })
  create(@Body() body: CreateAddOnDto) {
    return this.svc.create(body);
  }

  @Delete('/:id')
  @ApiOperation({
    summary: 'Delete an add-on',
    description: 'Deletes an add-on by ID. Requires SUPER_ADMIN or ADMIN role.',
  })
  @ApiParam({
    name: 'id',
    description: 'Add-on UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Add-on successfully deleted',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Requires SUPER_ADMIN or ADMIN role',
  })
  @ApiResponse({
    status: 404,
    description: 'Add-on not found',
  })
  delete(@Param('id') addonId: string) {
    return this.svc.delete(addonId);
  }

  @Post('plan-option/:id')
  @ApiOperation({
    summary: 'Attach add-on to a plan option',
    description: 'Associates an add-on with a plan option, optionally with a price. Requires SUPER_ADMIN or ADMIN role.',
  })
  @ApiParam({
    name: 'id',
    description: 'Plan option UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({ type: SetAddonForPlanDto })
  @ApiResponse({
    status: 201,
    description: 'Add-on successfully attached to plan option',
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
    description: 'Forbidden - Requires SUPER_ADMIN or ADMIN role',
  })
  @ApiResponse({
    status: 404,
    description: 'Plan option or add-on not found',
  })
  setForPlan(@Param('id') id: string, @Body() body: SetAddonForPlanDto) {
    return this.svc.setAddOnForPlanOption(id, body);
  }

  @Post('company/:companyId/enable')
  @ApiOperation({
    summary: 'Enable add-ons for a company',
    description: 'Enables the given add-ons for the specified company. Requires SUPER_ADMIN or ADMIN role.',
  })
  @ApiParam({
    name: 'companyId',
    description: 'Company UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({ type: EnableAddonsForCompanyDto })
  @ApiResponse({
    status: 200,
    description: 'Add-ons successfully enabled for company',
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
    description: 'Forbidden - Requires SUPER_ADMIN or ADMIN role',
  })
  @ApiResponse({
    status: 404,
    description: 'Company or add-on not found',
  })
  enableForCompany(
    @Param('companyId') companyId: string,
    @Body() body: EnableAddonsForCompanyDto,
  ) {
    return this.svc.enableForCompany(companyId, body.addonIds);
  }

  @Post('company/:companyId/disable')
  @ApiOperation({
    summary: 'Disable add-ons for a company',
    description: 'Disables the given add-ons for the specified company. Requires SUPER_ADMIN or ADMIN role.',
  })
  @ApiParam({
    name: 'companyId',
    description: 'Company UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({ type: EnableAddonsForCompanyDto })
  @ApiResponse({
    status: 200,
    description: 'Add-ons successfully disabled for company',
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
    description: 'Forbidden - Requires SUPER_ADMIN or ADMIN role',
  })
  @ApiResponse({
    status: 404,
    description: 'Company or add-on not found',
  })
  disableForCompany(
    @Param('companyId') companyId: string,
    @Body() body: EnableAddonsForCompanyDto,
  ) {
    return this.svc.disableForCompany(companyId, body.addonIds);
  }
}
