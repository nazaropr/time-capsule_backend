import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { CapsuleModule } from './capsule/capsule.module';
import { CryptoModule } from '@app/common/crypto/crypto.module';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationsModule } from './notifications/notifications.module';
import { RecipientsModule } from './recipients/recipients.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('DATABASE_URL'),
      }),
    }),
    UserModule,
    AuthModule,
    CapsuleModule,
    CryptoModule,
    ScheduleModule.forRoot(),
    NotificationsModule,
    RecipientsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
