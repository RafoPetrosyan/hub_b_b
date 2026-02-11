import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { OnboardingService } from './onboarding.service';
import { Step1Dto } from './dto/step1.dto';
import { Step2Dto } from './dto/step2.dto';
import { Step10Dto } from './dto/step10.dto';
import { Step3Dto } from './dto/step3.dto';
import { Step4Dto } from './dto/step4.dto';
import { Step5Dto } from './dto/step5.dto';
import { Step6Dto } from './dto/step6.dto';
import { Step7Dto } from './dto/step7.dto';
import { Step8Dto } from './dto/step8.dto';
import { Step9Dto } from './dto/step9.dto';
import { Step11Dto } from './dto/step11.dto';
import { Step12Dto } from './dto/step12.dto';
import { GetOnboardingDto } from './dto/get-onboarding.dto';
import { validateOrReject } from 'class-validator';
import { AuthGuard, Roles, RolesGuard, UserRole } from '../../../auth';
import { plainToInstance } from 'class-transformer';
import Helpers from '../../../../utils/helpers';
import { PriceInterval } from '../../../common/modules/subscription-plans/entities/plan-price.entity';

@ApiTags('company onboarding')
@ApiExtraModels(
  Step1Dto,
  Step2Dto,
  Step3Dto,
  Step4Dto,
  Step5Dto,
  Step6Dto,
  Step7Dto,
  Step8Dto,
  Step9Dto,
  Step10Dto,
  Step11Dto,
  Step12Dto,
)
@ApiBearerAuth('JWT-auth')
@Controller('api/company/onboarding')
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.BUSINESS_ADMIN)
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {
  }

  @Get()
  @ApiOperation({
    summary: 'Get or create onboarding for authenticated user',
    description: 'Retrieves the onboarding record for the authenticated user. Creates a new onboarding record if one does not exist. Requires SUPER_ADMIN, ADMIN, or BUSINESS_ADMIN role.',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved or created onboarding',
    type: GetOnboardingDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions. Requires SUPER_ADMIN, ADMIN, or BUSINESS_ADMIN role.',
  })
  async me(@Req() req: any) {
    const userId = req.userId;
    if (!userId) throw new Error('No authenticated user');
    const userCompany = req.userCompany;
    if (!userCompany) throw new Error('Authenticated doesn\'t have company');
    return this.onboardingService.getOrCreateByUser(userId, userCompany);
  }

  @Get('tiers')
  @ApiOperation({
    summary: 'List available tiers',
    description: 'Returns all available subscription tiers.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of tiers retrieved successfully',
  })
  async listTiers() {
    return this.onboardingService.listTiers();
  }

  @Get('available-plans')
  @ApiOperation({
    summary: 'List available plans for onboarding',
    description: 'Returns subscription plans, optionally filtered by selected tier.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of available plans retrieved successfully',
  })
  async listAvailablePlans(@Req() req: any) {
    const userId = req.userId;
    if (!userId) throw new Error('No authenticated user');
    const userCompany = req.userCompany;
    if (!userCompany) throw new Error('Authenticated doesn\'t have company');
    return this.onboardingService.listAvailablePlans(userId, userCompany);
  }

  @Get('available-addons')
  @ApiOperation({
    summary: 'List available add-ons for onboarding',
    description: 'Returns add-ons available for the selected plan.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of available add-ons retrieved successfully',
  })
  async listAvailableAddOns(@Req() req: any) {
    const userId = req.userId;
    if (!userId) throw new Error('No authenticated user');
    const userCompany = req.userCompany;
    if (!userCompany) throw new Error('Authenticated doesn\'t have company');
    return this.onboardingService.listAvailableAddOns(userId, userCompany);
  }

  @Get('plan-summary')
  @ApiOperation({
    summary: 'Get plan summary',
    description: 'Returns a summary of the selected plan, add-ons, and computed selections.',
  })
  @ApiResponse({
    status: 200,
    description: 'Plan summary retrieved successfully',
  })
  async getPlanSummary(@Req() req: any) {
    const userId = req.userId;
    if (!userId) throw new Error('No authenticated user');
    const userCompany = req.userCompany;
    if (!userCompany) throw new Error('Authenticated doesn\'t have company');
    return this.onboardingService.getPlanSummary(userId, userCompany);
  }

  @Get('available-trades')
  @ApiOperation({
    summary: 'List available trades grouped by trade groups',
    description: 'Returns trades grouped by their trade groups.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of trades retrieved successfully',
  })
  async listAvailableTrades() {
    return this.onboardingService.listAvailableTrades();
  }

  @Get('available-services')
  @ApiOperation({
    summary: 'List available services grouped by specialization',
    description: 'Returns services grouped by their specialization.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of services retrieved successfully',
  })
  async listAvailableServices() {
    return this.onboardingService.listAvailableServices();
  }

  @Get('base-specializations')
  @ApiOperation({
    summary: 'List base specializations',
    description: 'Returns base specializations for onboarding.',
  })
  @ApiResponse({
    status: 200,
    description: 'Base specializations retrieved successfully',
  })
  async listBaseSpecializations() {
    return this.onboardingService.listBaseSpecializations();
  }

  @Get('base-services')
  @ApiOperation({
    summary: 'List base services',
    description: 'Returns base services. Optionally filter by specialization id.',
  })
  @ApiResponse({
    status: 200,
    description: 'Base services retrieved successfully',
  })
  @ApiQuery({
    name: 'specialization_id',
    description: 'Filter services by specialization id',
    required: false,
  })
  async listBaseServices(@Query('specialization_id') specializationId?: string) {
    return this.onboardingService.listBaseServices(specializationId);
  }

  @Get('links')
  @ApiOperation({
    summary: 'Get onboarding links',
    description: 'Returns dashboard, booking, and website links for the company.',
  })
  @ApiResponse({
    status: 200,
    description: 'Links retrieved successfully',
  })
  async getLinks(@Req() req: any) {
    const userId = req.userId;
    if (!userId) throw new Error('No authenticated user');
    const userCompany = req.userCompany;
    if (!userCompany) throw new Error('Authenticated doesn\'t have company');
    return this.onboardingService.getLinks(userId);
  }

  @Get('stripe-customer')
  @ApiOperation({
    summary: 'Get Stripe customer id for onboarding company',
    description: 'Returns (and creates if needed) the Stripe customer id for the authenticated user company.',
  })
  @ApiResponse({
    status: 200,
    description: 'Stripe customer id retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        stripe_customer_id: { type: 'string', example: 'cus_1234567890' },
      },
    },
  })
  async getStripeCustomerId(@Req() req: any) {
    const userId = req.userId;
    if (!userId) throw new Error('No authenticated user');
    const userCompany = req.userCompany;
    if (!userCompany) throw new Error('Authenticated doesn\'t have company');
    return this.onboardingService.getStripeCustomerId(userId, userCompany);
  }

  @Get('payment-intents')
  @ApiOperation({
    summary: 'Get Stripe payment intent ids for onboarding',
    description: 'Creates (if needed) a subscription for the selected period and returns its confirmation client secret (payment or setup).',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment intent ids retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        subscription_id: { type: 'string', example: 'sub_1234567890' },
        intent_id: { type: 'string', example: 'pi_1234567890' },
        intent_type: { type: 'string', example: 'payment_intent' },
        client_secret: { type: 'string', example: 'pi_1234567890_secret_abc123' },
      },
    },
  })
  @ApiQuery({
    name: 'period',
    description: 'Billing period for the subscription',
    required: true,
    enum: ['monthly', 'yearly'],
  })
  async getPaymentIntents(@Req() req: any, @Query('period') period: PriceInterval) {
    const userId = req.userId;
    if (!userId) throw new Error('No authenticated user');
    const userCompany = req.userCompany;
    if (!userCompany) throw new Error('Authenticated doesn\'t have company');
    return this.onboardingService.getStripePaymentIntents(userId, userCompany, period);
  }

  @Post('step/:step')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Submit onboarding step data',
    description: `Submits data for a specific onboarding step (1-12). Validates the payload based on the step number and advances the onboarding progress. Each step has its own DTO structure. Requires SUPER_ADMIN, ADMIN, or BUSINESS_ADMIN role.
    
    Step-specific behavior:
    - Step 1: Saves tier selection
    - Step 2: Saves subscription plan selection
    - Step 3: Saves add-ons selection
    - Step 4: Saves plan summary confirmation
    - Step 5: Confirms period/terms (payment handled on frontend) and automatically sends a verification code via email
    - Step 6: Verifies the code before saving (code must be valid and not expired)
    - Steps 7-12: Save respective step data (step 12 also clears stored onboarding info)`,
  })
  @ApiParam({
    name: 'step',
    description: 'Step number (1-12)',
    example: '1',
    enum: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
  })
  @ApiBody({
    description: 'Step data (structure varies by step number)',
    schema: {
      oneOf: [
        { $ref: '#/components/schemas/Step1Dto' },
        { $ref: '#/components/schemas/Step2Dto' },
        { $ref: '#/components/schemas/Step3Dto' },
        { $ref: '#/components/schemas/Step4Dto' },
        { $ref: '#/components/schemas/Step5Dto' },
        { $ref: '#/components/schemas/Step6Dto' },
        { $ref: '#/components/schemas/Step7Dto' },
        { $ref: '#/components/schemas/Step8Dto' },
        { $ref: '#/components/schemas/Step9Dto' },
        { $ref: '#/components/schemas/Step10Dto' },
        { $ref: '#/components/schemas/Step11Dto' },
        { $ref: '#/components/schemas/Step12Dto' },
      ],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Step data successfully saved',
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
    status: 400,
    description: 'Bad request - Invalid step number, validation error, verification code cooldown (step 5), or invalid/expired verification code (step 6)',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions. Requires SUPER_ADMIN, ADMIN, or BUSINESS_ADMIN role.',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - User not found (step 3) or verification code not found (step 4)',
  })
  async submitStep(
    @Req() req: Request,
    @Param('step') step: string,
    @Body() body: Step1Dto |
      Step2Dto |
      Step3Dto |
      Step4Dto |
      Step5Dto |
      Step6Dto |
      Step7Dto |
      Step8Dto |
      Step9Dto |
      Step10Dto |
      Step11Dto |
      Step12Dto,
  ) {
    const userId = (req as any).user?.id ?? (req as any).userId;
    if (!userId) throw new Error('No authenticated user');
    const sNum = Number(step);
    const validationDtoMap = {
      1: Step1Dto,
      2: Step2Dto,
      3: Step3Dto,
      4: Step4Dto,
      5: Step5Dto,
      6: Step6Dto,
      7: Step7Dto,
      8: Step8Dto,
      9: Step9Dto,
      10: Step10Dto,
      11: Step11Dto,
      12: Step12Dto,
    };

    const DtoClass = validationDtoMap[sNum];
    const inputInstance:Step1Dto |
      Step2Dto |
      Step3Dto |
      Step4Dto |
      Step5Dto |
      Step6Dto |
      Step7Dto |
      Step8Dto |
      Step9Dto |
      Step10Dto |
      Step11Dto |
      Step12Dto = plainToInstance(DtoClass, body);
    try {
      if (![4,5].includes(sNum)) {
        await validateOrReject(inputInstance, {
          whitelist: true,
          forbidNonWhitelisted: true,
        });
      }
    } catch (validationErrors) {
      const errors = Helpers.flattenValidationErrors(validationErrors);

      return new BadRequestException({
        messages: errors,
        error: 'Bad Request',
        statusCode: 400,
      });
    }

    if (!userId) throw new BadRequestException('No authenticated user');

    if (sNum < 1 || sNum > 12) {
      throw new BadRequestException('Invalid step');
    }

    switch (sNum) {
      case 5: {
        await this.onboardingService.submitStep(sNum, body, req);
        await this.onboardingService.sendVerificationCode({ user_id: userId, method: 'email' });
        return { ok: true };
      }
      case 6: {
        await this.onboardingService.verifyCode({
          user_id: userId,
          code: (body as Step6Dto).verification_code,
        });
        await this.onboardingService.submitStep(sNum, body, req);
        return { ok: true };
      }
      default: {
        await this.onboardingService.submitStep(sNum, body, req);
        return { ok: true };
      }
    }
  }
}
