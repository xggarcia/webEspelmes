import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type MailTemplate =
  | 'order.confirmation'
  | 'order.shipped'
  | 'password.reset'
  | 'order.cancelled';

export type MailPayload = {
  to: string;
  subject: string;
  template: MailTemplate;
  data: Record<string, unknown>;
};

/**
 * Thin MailerService facade. Ships with a console driver for dev; a Resend/SMTP
 * driver can be slotted in by reading MAIL_DRIVER from env.
 */
@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private readonly driver: 'console' | 'resend';

  constructor(private readonly config: ConfigService) {
    this.driver = (config.get<string>('MAIL_DRIVER') ?? 'console') as 'console' | 'resend';
  }

  async send(payload: MailPayload): Promise<void> {
    if (this.driver === 'resend') {
      this.logger.warn(`[mailer] Resend driver not configured, falling back to console`);
    }
    this.logger.log(
      `[mailer] → ${payload.to} | ${payload.template} | ${payload.subject} | ${JSON.stringify(payload.data)}`,
    );
  }
}
