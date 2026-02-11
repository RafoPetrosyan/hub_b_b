import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly EMAIL_CODE_TIMEOUT_MINUTES = 15;

  /**
   * Returns the timeout duration in minutes for email verification codes
   */
  getCodeTimeoutMinutes(): number {
    return this.EMAIL_CODE_TIMEOUT_MINUTES;
  }

  /**
   * Sends a verification code to the user's email
   * Email codes expire in 1 minute to prevent billing leaks
   */
  async sendVerificationCode(email: string, code: string): Promise<void> {
    if (process.env.NODE_ENV !== 'production') {
      this.logger.log(
        `Sending verification code by EMAIL to ${email}: ${code} (expires in ${this.EMAIL_CODE_TIMEOUT_MINUTES} minute(s))`,
      );
    } else {
      // TODO: Replace with actual email service (e.g., nodemailer, SendGrid, etc.)
    }
  }
}
