import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly SMS_CODE_TIMEOUT_MINUTES = 15;

  /**
   * Returns the timeout duration in minutes for SMS verification codes
   */
  getCodeTimeoutMinutes(): number {
    return this.SMS_CODE_TIMEOUT_MINUTES;
  }

  /**
   * Sends a verification code to the user's phone number
   * SMS codes expire in 3 minutes to prevent billing leaks
   */
  async sendVerificationCode(phone: string, code: string): Promise<void> {
    if (process.env.NODE_ENV !== 'production') {
      this.logger.log(
        `Sending verification code by SMS to ${phone}: ${code} (expires in ${this.SMS_CODE_TIMEOUT_MINUTES} minute(s))`,
      );
    } else {
      // TODO: Replace with actual SMS service (e.g., twilio, nikita, etc.)
    }
  }
}
