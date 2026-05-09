import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';
import { JwtPayload } from '@app/auth/interface/JwtPayload';
import { AuthRequest } from '@app/auth/interface/auth-req.interface';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const access_token = request.cookies?.['access_token'] as
      | string
      | undefined;
    if (!access_token) {
      throw new UnauthorizedException('No access token');
    }
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(access_token, {
        secret: this.configService.get('JWT_ACCESS_SECRET'),
      });
      request.user = payload;
      return true;
    } catch (e) {
      console.error(e);
      throw new UnauthorizedException('Invalid access token');
    }
  }
}
