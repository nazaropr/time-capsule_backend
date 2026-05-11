import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CapsuleModule } from '@app/capsule/capsule.module';
import { MailService } from '@app/notifications/mail.service';

@Module({
  imports: [CapsuleModule],
  providers: [NotificationsService, MailService],
  exports: [MailService],
})
export class NotificationsModule {}
