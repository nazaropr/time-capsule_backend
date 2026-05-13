import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateCapsuleDto,
  UpdateCapsuleDto,
} from '@app/capsule/dto/capsule.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Capsule, CapsuleDocument } from '@app/capsule/schemas/capsule.schema';
import { Model } from 'mongoose';
import { CryptoService } from '@app/common/crypto/crypto.service';
import { nanoid } from 'nanoid';

export interface FindOneResult {
  capsule: CapsuleDocument;
  decryptedContent: string | null;
}

@Injectable()
export class CapsuleService {
  constructor(
    @InjectModel(Capsule.name) private capsuleModel: Model<Capsule>,
    private readonly cryptoService: CryptoService,
  ) {}
  async createCapsule(
    dto: CreateCapsuleDto,
    userId: string,
  ): Promise<CapsuleDocument> {
    const { content, unlockAt, ...rest } = dto;
    const encryptedContent = this.cryptoService.encrypt(content);
    const unlockDate = new Date(unlockAt);
    unlockDate.setUTCHours(0, 0, 0, 0);

    if (unlockDate <= new Date()) {
      throw new BadRequestException('Unlock date must be in the future');
    }
    const newCapsule = new this.capsuleModel({
      ...rest,
      unlockAt: unlockDate,
      content: encryptedContent,
      owner: userId,
      slug: nanoid(10),
    });
    return await newCapsule.save();
  }

  async findAllByUserId(userId: string): Promise<CapsuleDocument[]> {
    return await this.capsuleModel.find({ owner: userId }).exec();
  }
  async findOne(id: string, userId?: string): Promise<FindOneResult> {
    const capsule = await this.capsuleModel
      // .findOne({ _id: id, owner: userId })
      .findById(id)
      .select('+content')
      .exec();
    if (!capsule) {
      throw new NotFoundException('Unable to find capsule');
    }

    const isOwner = capsule.owner.toString() === userId;
    if (!isOwner && !capsule.isPublic) {
      throw new ForbiddenException('Access denied for the capsule');
    }
    let decryptedContent: string | null = null;
    if (capsule.isUnlocked) {
      decryptedContent = this.cryptoService.decrypt(capsule.content);
    }

    return { capsule, decryptedContent };
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateCapsuleDto,
  ): Promise<CapsuleDocument> {
    const capsule = await this.capsuleModel.findById(id);

    if (!capsule) {
      throw new NotFoundException('Capsule not found');
    }
    if (capsule.owner.toString() !== userId) {
      throw new ForbiddenException('You are not owner');
    }

    if (capsule.isUnlocked) {
      throw new BadRequestException('Cannot edit unlocked capsule');
    }
    const { title, content, unlockAt, isPublic, recipients } = dto;

    if (title !== undefined) {
      capsule.title = title;
    }

    if (isPublic !== undefined) {
      capsule.isPublic = isPublic;
    }

    if (unlockAt !== undefined) {
      const newDate = new Date(unlockAt);
      newDate.setUTCHours(0, 0, 0, 0);

      if (newDate <= new Date()) {
        throw new BadRequestException('Unlock date must be in the future');
      }
      capsule.unlockAt = newDate;
    }

    if (content !== undefined) {
      capsule.content = this.cryptoService.encrypt(content);
    }

    if (recipients !== undefined) {
      capsule.recipients = recipients.map((recipient) => ({
        email: recipient.email,
        isNotified: false,
      }));
    }

    return await capsule.save();
  }

  async delete(id: string, userId: string): Promise<void> {
    const capsule = await this.capsuleModel.findById(id);

    if (!capsule) throw new NotFoundException('Capsule not found');
    if (capsule.owner.toString() !== userId) {
      throw new ForbiddenException('Only owner can delete this capsule');
    }

    await this.capsuleModel.findByIdAndDelete(id);
  }

  async findOneBySlug(slug: string): Promise<FindOneResult> {
    const capsule = await this.capsuleModel
      .findOne({ slug })
      .select('+content')
      .exec();
    if (!capsule) {
      throw new NotFoundException('Capsule not found');
    }

    if (!capsule.isPublic || !capsule.isUnlocked) {
      throw new ForbiddenException('This capsule is private or still locked');
    }

    const decryptedContent = this.cryptoService.decrypt(capsule.content);
    return { capsule, decryptedContent };
  }

  async findCapsuleToUnlock(): Promise<CapsuleDocument[]> {
    const now = new Date();

    return await this.capsuleModel
      .find({
        unlockAt: { $lte: now },
        isUnlocked: false,
      })
      .exec();
  }

  async findAllReceived(email: string): Promise<CapsuleDocument[]> {
    return await this.capsuleModel
      .find({
        'recipients.email': email,
        isUnlocked: true,
      })
      .exec();
  }

  async deleteAllByUserId(userId: string): Promise<void> {
    await this.capsuleModel.deleteMany({ owner: userId }).exec();
  }
}
