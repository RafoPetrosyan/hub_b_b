import {
  Controller,
  Get,
  Param,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AddOnsService } from './add-ons.service';
import { GetAddOnDto } from './dto/get-add-on.dto';
import { GetPlanAddOnDto } from './dto/get-plan-add-on.dto';

@ApiTags('common add-ons')
@Controller('api/addons')
export class AddOnsController {
  constructor(private readonly addOnsService: AddOnsService) {}

  @Get()
  @ApiOperation({
    summary: 'List all add-ons',
    description: 'Retrieve a list of all available add-ons ordered by creation date',
  })
  @ApiResponse({
    status: 200,
    description: 'List of add-ons retrieved successfully',
    type: [GetAddOnDto],
  })
  async list() {
    return this.addOnsService.findAll();
  }

  @Get('company/:companyId')
  @ApiOperation({
    summary: 'List add-ons enabled for a company',
    description: 'Retrieve the add-ons currently enabled for the specified company',
  })
  @ApiParam({
    name: 'companyId',
    description: 'Company UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'List of company add-ons retrieved successfully',
    type: [GetAddOnDto],
  })
  listForCompany(
    @Param('companyId') companyId: string
  ) {
    return this.addOnsService.listForCompany(companyId);
  }

  @Get('plan/:planOptionId')
  @ApiOperation({
    summary: 'List add-ons and pricing for a plan option',
    description: 'Retrieve add-ons with pricing (included or paid) for a specific plan option',
  })
  @ApiParam({
    name: 'planOptionId',
    description: 'Plan option UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'List of plan add-ons retrieved successfully',
    type: [GetPlanAddOnDto],
  })
  listForPlanOption(@Param('planOptionId') planOptionId: string) {
    return this.addOnsService.listForPlanOption(planOptionId);
  }
}
