import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CapsuleDocument } from '@app/capsule/schemas/capsule.schema';

export class CreateCapsuleDto {
  @IsString()
  @IsNotEmpty()
  title: string;
  @IsString()
  @IsNotEmpty()
  content: string;
  @IsDateString()
  unlockAt: string;
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRecipientDto)
  recipients: CreateRecipientDto[];
}

export class CreateRecipientDto {
  @IsEmail()
  email: string;
}

export class CapsuleResponseDto {
  id: string;
  title: string;
  unlockAt: string;
  recipients: CreateRecipientDto[];
  createdAt: string;
  isPublic: boolean;
  isUnlocked: boolean;

  constructor(capsule: CapsuleDocument) {
    this.id = capsule.id;
    this.title = capsule.title;
    this.unlockAt = capsule.unlockAt.toISOString();
    this.createdAt = capsule.createdAt.toISOString();
    this.recipients = capsule.recipients;
    this.isPublic = capsule.isPublic;
    this.isUnlocked = capsule.isUnlocked;
  }
}

export class CapsuleWithContentDto extends CapsuleResponseDto {
  content: string | null;
  constructor(capsule: CapsuleDocument, decryptedContent: string | null) {
    super(capsule);
    this.content = decryptedContent;
  }
}
