import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CapsuleService } from '@app/capsule/capsule.service';
import { CreateRecipientDto } from '@app/capsule/dto/capsule.dto';
import { CapsuleDocument } from '@app/capsule/schemas/capsule.schema';

@Injectable()
export class RecipientsService {
  constructor(private readonly capsuleService: CapsuleService) {}

  async addRecipient(
    capsuleId: string,
    userId: string,
    dto: CreateRecipientDto,
  ): Promise<CapsuleDocument> {
    const result = await this.capsuleService.findOne(capsuleId, userId);
    const { capsule } = result;

    if (capsule.owner.toString() !== userId) {
      throw new ForbiddenException('Only owner can modify recipients');
    }

    if (capsule.isUnlocked) {
      throw new BadRequestException(
        'Cannot add recipients to an already unlocked capsule',
      );
    }

    if (capsule.recipients.some((r) => r.email === dto.email)) {
      return capsule;
    }

    capsule.recipients.push({ email: dto.email, isNotified: false });
    return await capsule.save();
  }

  async removeRecipient(
    capsuleId: string,
    userId: string,
    email: string,
  ): Promise<CapsuleDocument> {
    const result = await this.capsuleService.findOne(capsuleId, userId);
    const { capsule } = result;
    if (capsule.owner.toString() !== userId) {
      throw new ForbiddenException('Only owner can modify recipients');
    }
    if (capsule.isUnlocked) {
      throw new BadRequestException(
        'Cannot remove recipients from an unlocked capsule',
      );
    }

    const recipientExists = capsule.recipients.some((r) => r.email === email);
    if (!recipientExists) {
      throw new NotFoundException(`Recipient with email ${email} not found`);
    }

    capsule.recipients = capsule.recipients.filter((r) => r.email !== email);
    return await capsule.save();
  }
}
