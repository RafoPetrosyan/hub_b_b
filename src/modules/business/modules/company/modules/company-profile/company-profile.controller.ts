import { Body, Controller, Get, HttpCode, HttpStatus, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../../../../auth';
import { CompanyTenantGuard } from '../../../../../../guards/company-tenant.guard';
import { CompanyProfileService } from './company-profile.service';
import { GetBusinessDto } from '../../dto/get-company-profile.dto';
import { UpdateBusinessRequestDto } from '../../dto/update-business-request.dto';

@ApiTags('company')
@Controller('api/company/profile')
export class CompanyProfileController {
  constructor(private readonly companyProfileService: CompanyProfileService) {}

  @Get()
  @UseGuards(AuthGuard, CompanyTenantGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get company profile',
    description: 'Retrieves company profile and address information for the authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved company profile data',
    type: GetBusinessDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 404,
    description: 'User or company not found',
  })
  getProfile(@Req() req) {
    return this.companyProfileService.getProfile(req.userId);
  }

  @Put()
  @UseGuards(AuthGuard, CompanyTenantGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update company profile',
    description:
      'Updates company profile and/or company address information. All fields are optional - only provided fields will be updated.',
  })
  @ApiBody({ type: UpdateBusinessRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Successfully updated company profile data',
    type: GetBusinessDto,
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
    description: 'User or company not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Email, phone, or booking subdomain already in use',
  })
  updateProfile(@Body() dto: UpdateBusinessRequestDto, @Req() req) {
    return this.companyProfileService.updateProfile(dto, req.userId);
  }
}
