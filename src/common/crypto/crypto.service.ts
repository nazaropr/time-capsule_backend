import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Buffer } from 'buffer';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

// https://gist.github.com/siwalikm/8311cf0a287b98ef67c73c1b03b47154
// https://www.linkedin.com/pulse/aes-256-encryption-decryption-nodejs-2521-khalid-shaikh-q0ovc/
@Injectable()
export class CryptoService {
  private readonly algorithm = 'aes-256-cbc';
  private readonly key: Buffer;

  constructor(private readonly configService: ConfigService) {
    const keyString = this.configService.get<string>('CRYPTO_KEY');

    if (!keyString) {
      throw new InternalServerErrorException(
        'CRYPTO_KEY is not defined in .env',
      );
    }
    this.key = Buffer.from(keyString, 'hex');

    if (this.key.length !== 32) {
      throw new InternalServerErrorException(
        'CRYPTO_KEY must be 32 bytes (64 hex characters)',
      );
    }
  }

  encrypt(text: string): string {
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');

    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  }

  decrypt(combinedText: string): string {
    const [ivHex, encryptedText] = combinedText.split(':');
    if (!ivHex || !encryptedText) {
      throw new Error('Invalid encrypted text format');
    }
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);

    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
