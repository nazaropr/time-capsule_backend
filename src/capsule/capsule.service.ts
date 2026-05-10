import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCapsuleDto } from '@app/capsule/dto/capsule.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Capsule, CapsuleDocument } from '@app/capsule/schemas/capsule.schema';
import { Model } from 'mongoose';
import { CryptoService } from '@app/common/crypto/crypto.service';

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
    if (unlockDate <= new Date()) {
      throw new BadRequestException('Unlock date must be in the future');
    }
    const newCapsule = new this.capsuleModel({
      ...rest,
      unlockAt: unlockDate,
      content: encryptedContent,
      owner: userId,
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
}
