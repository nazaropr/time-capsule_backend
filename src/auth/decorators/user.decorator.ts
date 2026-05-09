import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthRequest } from '@app/auth/interface/auth-req.interface';
import { JwtPayload } from '@app/auth/interface/JwtPayload';

export const GetUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest<AuthRequest>();
    return request.user;
  },
);
