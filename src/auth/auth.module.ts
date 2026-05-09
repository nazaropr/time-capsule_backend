import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '@app/user/user.module';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '@app/auth/guards/auth.guard';

@Module({
  imports: [UserModule],
  providers: [AuthService, JwtService, AuthGuard],
  controllers: [AuthController],
})
export class AuthModule {}
