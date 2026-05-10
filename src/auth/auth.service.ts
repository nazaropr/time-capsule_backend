import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto, LoginUserDto } from '@app/user/dto/user.dto';
import { UserService } from '@app/user/user.service';
import { UserDocument } from '@app/user/schemas/user.schema';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  IAccessToken,
  ITokens,
  JwtPayload,
} from '@app/auth/interface/JwtPayload';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async signUp(user: CreateUserDto): Promise<UserDocument> {
    return await this.userService.create(user);
  }

  async signIn(credentials: LoginUserDto): Promise<ITokens> {
    const user = await this.userService.findByEmailWithPassword(
      credentials.email,
    );

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      credentials.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const tokens = this.generateTokens(user.id, user.email);

    try {
      const hashedToken = await bcrypt.hash(tokens.refresh_token, 10);
      await this.userService.updateRefreshToken(user.id, hashedToken);
    } catch {
      throw new InternalServerErrorException('Could not update refresh token');
    }

    return tokens;
  }

  generateTokens(userId: string, email: string): ITokens {
    const access_token = this.jwtService.sign(
      {
        sub: userId,
        email: email,
      },
      {
        expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN'),
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      },
    );

    const refresh_token = this.jwtService.sign(
      {
        sub: userId,
        email: email,
      },
      {
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN'),
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      },
    );

    return { access_token, refresh_token };
  }

  generateAccessToken(userId: string, email: string): string {
    return this.jwtService.sign(
      {
        sub: userId,
        email: email,
      },
      {
        expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN'),
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      },
    );
  }

  async refreshToken(refreshToken: string): Promise<IAccessToken> {
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch (error) {
      console.error(error);
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.userService.findByIdWithRefreshToken(payload.sub);
    if (!user || !user.hashedRefreshToken) {
      throw new UnauthorizedException('User not found or logged out');
    }

    const isValid = await bcrypt.compare(refreshToken, user.hashedRefreshToken);

    if (!isValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const access_token = this.generateAccessToken(payload.sub, payload.email);

    // const hashedToken = await bcrypt.hash(tokens.refresh_token, 10);
    // await this.userService.updateRefreshToken(payload.sub, hashedToken);

    return { access_token };
  }

  async logout(userId: string): Promise<void> {
    await this.userService.updateRefreshToken(userId, null);
  }
}
