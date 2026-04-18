import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { ContactSchema, type ContactInput } from '@espelmes/shared';
import { Public } from '../common/decorators/public.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { MailerService } from '../mailer/mailer.service';

@ApiTags('contact')
@Controller('contact')
export class ContactController {
  private readonly contactEmail: string;

  constructor(
    private readonly mailer: MailerService,
    config: ConfigService,
  ) {
    this.contactEmail =
      config.get<string>('CONTACT_EMAIL') ??
      config.get<string>('ADMIN_EMAIL') ??
      'hola@espelmes.local';
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post()
  async send(@Body(new ZodValidationPipe(ContactSchema)) dto: ContactInput): Promise<void> {
    await this.mailer.send({
      to: this.contactEmail,
      subject: `Missatge de contacte de ${dto.name}`,
      template: 'contact.inquiry',
      data: { name: dto.name, email: dto.email, message: dto.message },
    });
  }
}
