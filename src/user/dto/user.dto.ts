import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { UserDocument } from '@app/user/schemas/user.schema';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  name: string;
  @IsEmail()
  email: string;
  @IsString()
  @MinLength(8)
  password: string;
}

export class UserResponseDto {
  id: string;
  name: string;
  email: string;
  createdAt: string;

  constructor(user: UserDocument) {
    this.id = user.id;
    this.name = user.name;
    this.email = user.email;
    this.createdAt = user.createdAt.toISOString();
  }
}

export class LoginUserDto {
  @IsEmail()
  email: string;
  @IsString()
  @MinLength(8)
  password: string;
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}

export class UpdatePasswordDto {
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @IsString()
  @MinLength(8)
  newPassword: string;

  @IsString()
  @IsNotEmpty()
  confirmPassword: string;
}
