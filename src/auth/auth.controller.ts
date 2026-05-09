import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from '@app/auth/auth.service';
import {
  CreateUserDto,
  UserResponseDto,
  LoginUserDto,
} from '@app/user/dto/user.dto';
import type { Request, Response } from 'express';
import { ITokens } from '@app/auth/interface/JwtPayload';
import type { JwtPayload } from '@app/auth/interface/JwtPayload';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '@app/auth/guards/auth.guard';
import { GetUser } from '@app/auth/decorators/user.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('sign-up')
  async signUp(@Body() user: CreateUserDto): Promise<UserResponseDto> {
    const response = await this.authService.signUp(user);
    return new UserResponseDto(response);
  }

  @Post('sign-in')
  async signIn(
    @Body() user: LoginUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.signIn(user);
    this.setAuthCookies(res, tokens);

    return { message: 'Logged in' };
  }

  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies['refresh_token'] as string | undefined;
    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token');
    }
    const { access_token } = await this.authService.refreshToken(refreshToken);
    res.cookie('access_token', access_token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
    });

    return { message: 'Tokens refreshed' };
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const accessToken = req.cookies['access_token'] as string | undefined;
    if (!accessToken) {
      throw new UnauthorizedException('No access token');
    }
    const payload = this.jwtService.decode<JwtPayload>(accessToken);
    await this.authService.logout(payload.sub);
    res.clearCookie('access_token');
    res.clearCookie('refresh_token', { path: '/auth/refresh' });
    return { message: 'Logged out' };
  }

  @Get('me')
  @UseGuards(AuthGuard)
  GetMe(@GetUser() user: JwtPayload) {
    return user;
  }

  private setAuthCookies(res: Response, tokens: ITokens) {
    res.cookie('access_token', tokens.access_token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
    });
    res.cookie('refresh_token', tokens.refresh_token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/auth/refresh',
    });
  }
}
