import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

export type MailTemplate =
  | 'order.confirmation'
  | 'order.new-notification'
  | 'order.shipped'
  | 'password.reset'
  | 'order.cancelled'
  | 'contact.inquiry';

export type MailPayload = {
  to: string;
  subject: string;
  template: MailTemplate;
  data: Record<string, unknown>;
};

/**
 * Thin MailerService facade. Ships with a console driver for dev; swap to
 * Resend in production by setting MAIL_DRIVER=resend + RESEND_API_KEY.
 */
@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private readonly driver: 'console' | 'resend';
  private readonly from: string;
  private resend?: Resend;

  constructor(private readonly config: ConfigService) {
    this.driver = (config.get<string>('MAIL_DRIVER') ?? 'console') as 'console' | 'resend';
    this.from = config.get<string>('MAIL_FROM') ?? 'Espelmes <hola@espelmes.local>';

    if (this.driver === 'resend') {
      const apiKey = config.get<string>('RESEND_API_KEY');
      if (!apiKey) {
        this.logger.warn('[mailer] MAIL_DRIVER=resend but RESEND_API_KEY is not set — falling back to console');
        this.driver = 'console' as 'console' | 'resend';
      } else {
        this.resend = new Resend(apiKey);
      }
    }
  }

  async send(payload: MailPayload): Promise<void> {
    if (this.driver === 'resend' && this.resend) {
      await this.sendViaResend(payload);
    } else {
      this.logger.log(
        `[mailer] → ${payload.to} | ${payload.template} | ${payload.subject} | ${JSON.stringify(payload.data)}`,
      );
    }
  }

  private async sendViaResend(payload: MailPayload): Promise<void> {
    const html = this.renderHtml(payload);
    const { error } = await this.resend!.emails.send({
      from: this.from,
      to: payload.to,
      subject: payload.subject,
      html,
    });

    if (error) {
      this.logger.error(`[mailer] Resend error sending to ${payload.to}: ${JSON.stringify(error)}`);
      return;
    }

    this.logger.log(`[mailer] Sent via Resend → ${payload.to} | ${payload.subject}`);
  }

  private renderHtml(payload: MailPayload): string {
    const d = payload.data;

    const wrap = (body: string) => `
      <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#2c2a27;">
        <p style="font-size:22px;font-weight:bold;margin:0 0 24px;">
          <span style="color:#c0622f;">&#9679;</span> Espelmes de ca la mare
        </p>
        ${body}
        <hr style="border:none;border-top:1px solid #e5e0d8;margin:32px 0;" />
        <p style="font-size:12px;color:#9e9890;">
          Espelmes de ca la mare · Fet a mà amb amor
        </p>
      </div>`;

    const formatPrice = (cents: number) =>
      new Intl.NumberFormat('ca-ES', { style: 'currency', currency: 'EUR' }).format(cents / 100);

    switch (payload.template) {
      case 'order.confirmation': {
        const items = (d['items'] as { name: string; quantity: number; unitPriceCents: number }[]) ?? [];
        const rows = items
          .map(
            (i) => `<tr>
              <td style="padding:6px 0;border-bottom:1px solid #f0ece6;">${i.name}</td>
              <td style="padding:6px 0;border-bottom:1px solid #f0ece6;text-align:center;">${i.quantity}</td>
              <td style="padding:6px 0;border-bottom:1px solid #f0ece6;text-align:right;">${formatPrice(i.unitPriceCents * i.quantity)}</td>
            </tr>`,
          )
          .join('');
        return wrap(`
          <p>Gràcies per la teva compra! Hem rebut la teva comanda i l'estem preparant.</p>
          <p><strong>Comanda:</strong> ${d['orderNumber']}</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0;">
            <thead>
              <tr style="font-size:12px;color:#9e9890;">
                <th style="text-align:left;padding-bottom:8px;">Producte</th>
                <th style="text-align:center;padding-bottom:8px;">Qty</th>
                <th style="text-align:right;padding-bottom:8px;">Import</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <p style="text-align:right;">
            Enviament: ${formatPrice(Number(d['shippingCents']))}<br/>
            <strong>Total: ${formatPrice(Number(d['totalCents']))}</strong>
          </p>
          <p>T'avisarem quan surti cap a tu. Fins aviat!</p>`);
      }

      case 'order.new-notification': {
        const items2 = (d['items'] as { name: string; quantity: number; unitPriceCents: number }[]) ?? [];
        const rows2 = items2
          .map(
            (i) => `<tr>
              <td style="padding:6px 0;border-bottom:1px solid #f0ece6;">${i.name}</td>
              <td style="padding:6px 0;border-bottom:1px solid #f0ece6;text-align:center;">${i.quantity}</td>
              <td style="padding:6px 0;border-bottom:1px solid #f0ece6;text-align:right;">${formatPrice(i.unitPriceCents * i.quantity)}</td>
            </tr>`,
          )
          .join('');
        return wrap(`
          <p><strong>Nova comanda rebuda</strong></p>
          <p><strong>Número:</strong> ${d['orderNumber']}</p>
          <p><strong>Client:</strong> ${d['customerEmail']}</p>
          ${d['shippingAddress'] ? `<p><strong>Adreça d'enviament:</strong><br/>${d['shippingAddress']}</p>` : ''}
          <table style="width:100%;border-collapse:collapse;margin:16px 0;">
            <thead>
              <tr style="font-size:12px;color:#9e9890;">
                <th style="text-align:left;padding-bottom:8px;">Producte</th>
                <th style="text-align:center;padding-bottom:8px;">Qty</th>
                <th style="text-align:right;padding-bottom:8px;">Import</th>
              </tr>
            </thead>
            <tbody>${rows2}</tbody>
          </table>
          <p style="text-align:right;">
            Subtotal: ${formatPrice(Number(d['subtotalCents']))}<br/>
            Enviament: ${formatPrice(Number(d['shippingCents']))}<br/>
            <strong>Total: ${formatPrice(Number(d['totalCents']))}</strong>
          </p>`);
      }

      case 'order.shipped':
        return wrap(`
          <p>Bones notícies! La teva comanda <strong>${d['orderNumber']}</strong> ha sortit del nostre taller i és en camí.</p>
          <p>En uns dies arribarà a casa teva. Gràcies per confiar en nosaltres.</p>`);

      case 'order.cancelled':
        return wrap(`
          <p>La teva comanda <strong>${d['orderNumber']}</strong> ha estat cancel·lada.</p>
          <p>Si tens alguna pregunta, respon a aquest correu i t'ajudarem.</p>`);

      case 'password.reset':
        return wrap(`
          <p>Hola${d['name'] ? ` ${d['name']}` : ''},</p>
          <p>Has sol·licitat restablir la teva contrasenya. Fes clic al botó per continuar:</p>
          <p style="margin:24px 0;">
            <a href="${d['url']}" style="background:#c0622f;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-size:15px;">
              Restablir contrasenya
            </a>
          </p>
          <p style="font-size:13px;color:#9e9890;">
            L'enllaç és vàlid durant 1 hora. Si no has demanat cap canvi, ignora aquest correu.
          </p>`);

      case 'contact.inquiry':
        return wrap(`
          <p><strong>Nou missatge de contacte</strong></p>
          <p><strong>Nom:</strong> ${d['name']}</p>
          <p><strong>Correu:</strong> ${d['email']}</p>
          <p><strong>Missatge:</strong></p>
          <p style="white-space:pre-wrap;background:#f9f6f2;padding:12px;border-radius:4px;">${d['message']}</p>`);

      default:
        return wrap(`<pre>${JSON.stringify(payload.data, null, 2)}</pre>`);
    }
  }
}
