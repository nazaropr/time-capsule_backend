import { Body, Controller, Delete, Get, Patch } from '@nestjs/common';
import { UserService } from '@app/user/user.service';
import { GetUser } from '@app/auth/decorators/user.decorator';
import type { JwtPayload } from '@app/auth/interface/JwtPayload';
import {
  UpdatePasswordDto,
  UpdateProfileDto,
  UserResponseDto,
} from '@app/user/dto/user.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}
  @Get('me')
  async getMe(@GetUser() user: JwtPayload): Promise<UserResponseDto> {
    const userData = await this.userService.findById(user.sub);
    return new UserResponseDto(userData);
  }
  @Patch('me')
  async updateProfile(
    @GetUser() user: JwtPayload,
    @Body() dto: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    const updatedUser = await this.userService.updateProfile(user.sub, dto);
    return new UserResponseDto(updatedUser);
  }
  @Patch('me/password')
  async updatePassword(
    @GetUser() user: JwtPayload,
    @Body() dto: UpdatePasswordDto,
  ): Promise<{ message: string }> {
    await this.userService.updatePassword(user.sub, dto);
    return { message: 'Password updated successfully' };
  }
  @Delete('me')
  async deleteAccount(
    @GetUser() user: JwtPayload,
  ): Promise<{ message: string }> {
    await this.userService.deleteAccount(user.sub);
    return { message: 'Account and all data deleted' };
  }
}
