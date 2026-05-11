import { Module } from '@nestjs/common';
import { RecipientsService } from './recipients.service';
import { CapsuleModule } from '@app/capsule/capsule.module';
import { RecipientsController } from './recipients.controller';

@Module({
  imports: [CapsuleModule],
  providers: [RecipientsService],
  controllers: [RecipientsController],
})
export class RecipientsModule {}
