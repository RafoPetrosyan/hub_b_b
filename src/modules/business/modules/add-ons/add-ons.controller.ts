import {
  Controller,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AddOnsService } from './add-ons.service';
import { GetAddOnDto } from '../../../common/modules/add-ons/dto/get-add-on.dto';
import { AuthGuard } from '../../../auth';

@ApiTags('company add-ons')
@Controller('api/addons')
@UseGuards(AuthGuard)
export class AddOnsController {
  constructor(private readonly addOnsService: AddOnsService) {}

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
    @Req() req: any
  ) {
    const companyId = req.userCompany;
    return this.addOnsService.listForCompany(companyId);
  }
}
