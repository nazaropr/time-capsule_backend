import { Request } from 'express';
import { JwtPayload } from '@app/auth/interface/JwtPayload';
export interface AuthRequest extends Request {
  user: JwtPayload;
}
