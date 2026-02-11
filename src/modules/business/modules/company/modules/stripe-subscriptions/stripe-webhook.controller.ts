import { Controller, HttpCode, Logger, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StripeSubscriptionsService } from './stripe-subscriptions.service';
import Stripe from 'stripe';

@ApiTags('stripe webhooks')
@Controller('webhooks')
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);

  constructor(private readonly svc: StripeSubscriptionsService) {
  }

  @Post('stripe')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Stripe webhook endpoint',
    description: 'Handles Stripe webhook events for subscription management. This endpoint verifies webhook signatures and processes events such as invoice.payment_succeeded, invoice.payment_failed, customer.subscription.updated, customer.subscription.deleted, and payment events. Note: This endpoint requires raw request body and stripe-signature header for proper verification. Not suitable for testing via Swagger UI.',
  })
  @ApiHeader({
    name: 'stripe-signature',
    description: 'Stripe webhook signature for verification',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Webhook event successfully processed',
    schema: {
      type: 'object',
      properties: {
        received: {
          type: 'boolean',
          example: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Missing signature or signature verification failed',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error - Webhook not configured or event processing failed',
  })
  async handle(@Req() req: Request, @Res() res: Response) {
    const sig = req.headers['stripe-signature'] as string | undefined;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      this.logger.error('No STRIPE_WEBHOOK_SECRET configured');
      return res.status(500).send('Webhook not configured');
    }
    if (!sig) {
      this.logger.warn('Missing stripe-signature header');
      return res.status(400).send('Missing signature');
    }

    const rawBody = (req as any).rawBody ?? req.body;
    let event: Stripe.Event;
    try {
      const stripe = (this.svc as any).stripe as Stripe | undefined;
      if (!stripe) {
        const key = process.env.STRIPE_SECRET_KEY;
        if (!key) {
          this.logger.error('Stripe not configured');
          return res.status(500).send('Stripe not configured');
        }
        const s = new Stripe(key, { apiVersion: '2025-12-15.clover' as any });
        event = s.webhooks.constructEvent(rawBody, sig, webhookSecret);
      } else {
        event = this.svc['stripe'].webhooks.constructEvent(rawBody, sig, webhookSecret);
      }
    } catch (err) {
      this.logger.error('Webhook signature verification failed: ' + (err as any).message);
      return res.status(400).send(`Webhook Error: ${(err as any).message}`);
    }

    try {
      await this.svc.handleStripeEvent(event);
    } catch (err) {
      this.logger.error('Failed to handle stripe event: ' + (err as any).message);
      return res.status(500).send('Failed to process event');
    }

    return res.send({ received: true });
  }
}
