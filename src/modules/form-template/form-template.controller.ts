import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FormTemplateService } from './form-template.service';
import { CreateFormTemplateDto } from './dto/create-form-template.dto';
import { UpdateFormTemplateDto } from './dto/update-form-template.dto';
import { CreateBusinessFormDto } from './dto/create-business-form.dto';
import { GetFormTemplateDto } from './dto/get-form-template.dto';
import { AuthGuard } from '../auth';

@ApiTags('form-templates')
@Controller('api/form-templates')
export class FormTemplateController {
  constructor(private readonly formTemplateService: FormTemplateService) {
  }

  @Get()
  @ApiOperation({
    summary: 'Get all form templates',
    description: 'Retrieve a list of all form templates',
  })
  @ApiResponse({
    status: 200,
    description: 'List of form templates retrieved successfully',
    type: [GetFormTemplateDto],
  })
  findAll() {
    return this.formTemplateService.findAll();
  }

  @Get('trade/:tradeId')
  @ApiOperation({
    summary: 'Get form templates by trade',
    description: 'Retrieve form templates for a specific trade',
  })
  @ApiParam({
    name: 'tradeId',
    description: 'Trade UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Form templates retrieved successfully',
    type: [GetFormTemplateDto],
  })
  findByTrade(@Param('tradeId', ParseUUIDPipe) tradeId: string) {
    return this.formTemplateService.findByTrade(tradeId);
  }

  @Get('company/:businessId')
  @ApiOperation({
    summary: 'Get form templates by business',
    description: 'Retrieve form templates for a specific business',
  })
  @ApiParam({
    name: 'businessId',
    description: 'Business ID',
    example: '48',
  })
  @ApiResponse({
    status: 200,
    description: 'Form templates retrieved successfully',
    type: [GetFormTemplateDto],
  })
  findByBusiness(@Param('businessId', ParseUUIDPipe) businessId: string) {
    return this.formTemplateService.findByBusiness(businessId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get form template by ID',
    description: 'Retrieve a specific form template by its ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Form template UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Form template retrieved successfully',
    type: GetFormTemplateDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Form template not found',
  })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.formTemplateService.findOne(id);
  }

  @Post()
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Create a new form template',
    description: 'Create a new form template (requires authentication)',
  })
  @ApiResponse({
    status: 201,
    description: 'Form template created successfully',
    type: GetFormTemplateDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  create(
    @Body() createFormTemplateDto: CreateFormTemplateDto,
    @Request() req: any,
  ) {
    return this.formTemplateService.create(createFormTemplateDto, req.userId);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update a form template',
    description: 'Update an existing form template (requires authentication)',
  })
  @ApiParam({
    name: 'id',
    description: 'Form template UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Form template updated successfully',
    type: GetFormTemplateDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Form template not found',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateFormTemplateDto: UpdateFormTemplateDto,
  ) {
    return this.formTemplateService.update(id, updateFormTemplateDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Delete a form template',
    description: 'Delete a form template by ID (requires authentication)',
  })
  @ApiParam({
    name: 'id',
    description: 'Form template UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 204,
    description: 'Form template deleted successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Form template not found',
  })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.formTemplateService.remove(id);
  }

  @Post('business-forms')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Create a business form',
    description: 'Create a new business form from a form template (requires authentication)',
  })
  @ApiResponse({
    status: 201,
    description: 'Business form created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  createBusinessForm(@Body() createBusinessFormDto: CreateBusinessFormDto) {
    return this.formTemplateService.createBusinessForm(createBusinessFormDto);
  }

  @Get('business-forms/:businessId')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get business forms',
    description: 'Retrieve all business forms for a specific business (requires authentication)',
  })
  @ApiParam({
    name: 'businessId',
    description: 'Business UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Business forms retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  getBusinessForms(@Param('businessId', ParseUUIDPipe) businessId: string) {
    return this.formTemplateService.getBusinessForms(businessId);
  }
}
