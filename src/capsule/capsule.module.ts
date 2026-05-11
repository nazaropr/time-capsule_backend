import { Module } from '@nestjs/common';
import { CapsuleService } from './capsule.service';
import { CapsuleController } from './capsule.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Capsule, CapsuleSchema } from '@app/capsule/schemas/capsule.schema';
import { CryptoModule } from '@app/common/crypto/crypto.module';
import { AuthGuard } from '@app/auth/guards/auth.guard';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Capsule.name, schema: CapsuleSchema }]),
    CryptoModule,
  ],
  providers: [CapsuleService, JwtService, AuthGuard],
  controllers: [CapsuleController],
  exports: [CapsuleService],
})
export class CapsuleModule {}
