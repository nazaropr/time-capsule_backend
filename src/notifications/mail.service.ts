import { Injectable, Logger } from '@nestjs/common';
import { createTransport, Transporter } from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private transporter: Transporter;
  private readonly logger = new Logger(MailService.name);
  constructor(private readonly configService: ConfigService) {
    this.transporter = createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT'),
      secure: true,
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }
  async sendNotification(email: string, title: string, slug: string) {
    const url = `${this.configService.get<string>('NEXT_PUBLIC_API_URL')}/p/${slug}`;

    await this.transporter.sendMail({
      from: 'Time Capsule <no-reply@timecapsule.com>',
      to: email,
      subject: `Капсулу часу: ${title} розблоковано!`,
      html: `<p>Привіт! Тобі залишили послання в капсулі часу. Вона щойно відкрилась!</p>
             <p><b>Заголовок:</b> ${title}</p>
             <a href="${url}">Переглянути капсулу</a>`,
    });
    this.logger.log(`Email sent to ${email}`);
  }
}
