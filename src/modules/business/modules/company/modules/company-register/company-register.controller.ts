import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, Req } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CompanyRegisterService } from './company-register.service';
import { RegisterRequestDto } from './dto/register-request.dto';
import { UnifiedRegisterResponseDto } from './dto/unified-register-response.dto';
import { GetSlugResponseDto } from './dto/get-slug-response.dto';

@ApiTags('company register')
@Controller('api/register')
export class CompanyRegisterController {
  constructor(private businessRegisterService: CompanyRegisterService) {}

  @Post('')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Unified registration',
    description:
      'Creates user (is_active = false), creates company, links trades, generates subdomain, and sends verification code via email/SMS.',
  })
  @ApiBody({ type: RegisterRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Registration successful. Verification code sent.',
    type: UnifiedRegisterResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Email or phone number is already in use',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error or invalid trade IDs',
  })
  register(@Req() req: any, @Body() requestDto: RegisterRequestDto) {
    return this.businessRegisterService.register(requestDto, req);
  }

  @Get('slug')
  @ApiOperation({
    summary: 'Check subdomain availability',
    description:
      'Pre-generates and checks the availability of a subdomain based on the company name. Returns an available slug (lowercased, spaces removed, with numeric suffix if needed).',
  })
  @ApiQuery({
    name: 'name',
    description: 'Company name to generate subdomain from',
    example: 'My Awesome Business',
    type: String,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully generated available subdomain',
    type: GetSlugResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid company name (too short or empty)',
  })
  checkAvailabilityForSlug(@Query('name') name: string) {
    return this.businessRegisterService.checkSlugAvailability(name);
  }
}
