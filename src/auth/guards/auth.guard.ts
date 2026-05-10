import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtPayload } from '@app/auth/interface/JwtPayload';
import { AuthRequest } from '@app/auth/interface/auth-req.interface';
import { IS_PUBLIC_KEY } from '@app/auth/decorators/public.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest<AuthRequest>();
    const access_token = request.cookies?.['access_token'] as
      | string
      | undefined;

    if (!access_token) {
      if (isPublic) return true;
      throw new UnauthorizedException('No access token');
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(
        access_token,
        {
          secret: this.configService.get('JWT_ACCESS_SECRET'),
        },
      );
      request.user = payload;
      return true;
    } catch (e) {
      if (isPublic) return true;
      throw new UnauthorizedException('Invalid access token');
    }
  }
}
