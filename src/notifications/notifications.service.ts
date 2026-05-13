import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CapsuleService } from '@app/capsule/capsule.service';
import { MailService } from '@app/notifications/mail.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  constructor(
    private readonly capsuleService: CapsuleService,
    private readonly mailService: MailService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCron() {
    this.logger.debug('Cron called for searching capsules');

    const capsules = await this.capsuleService.findCapsuleToUnlock();

    if (capsules.length === 0) {
      return;
    }

    for (const capsule of capsules) {
      try {
        this.logger.log(
          `Unlocking capsule: ${capsule.title} , ID: ${capsule.id}`,
        );

        for (const recipient of capsule.recipients) {
          if (recipient.isNotified) {
            continue;
          }
          try {
            await this.mailService.sendNotification(
              recipient.email,
              capsule.title,
              capsule.slug,
            );
            recipient.isNotified = true;
          } catch (e) {
            const error = e as Error;
            this.logger.error(
              `Failed to notify: ${recipient.email}, Error: ${error.message}`,
            );
          }
        }

        capsule.isUnlocked = true;
        await capsule.save();
      } catch (err) {
        const error = err as Error;
        this.logger.error(
          `Failed to unlock capsule: ${capsule.title}, ID: ${capsule.id}, error: ${error.message}`,
        );
      }
    }
  }
}
