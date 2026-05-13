import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { Model } from 'mongoose';
import {
  CreateUserDto,
  UpdatePasswordDto,
  UpdateProfileDto,
} from '@app/user/dto/user.dto';
import * as bcrypt from 'bcrypt';
import { CapsuleService } from '@app/capsule/capsule.service';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly capsuleService: CapsuleService,
  ) {}

  async findById(userId: string): Promise<UserDocument> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmailWithPassword(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).select('+password').exec();
  }

  async findByIdWithRefreshToken(userId: string): Promise<UserDocument | null> {
    return this.userModel.findById(userId).select('+hashedRefreshToken').exec();
  }

  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    try {
      const { password, ...rest } = createUserDto;

      const hashedPass = await bcrypt.hash(password, 10);
      const newUser = new this.userModel({
        ...rest,
        password: hashedPass,
      });
      return await newUser.save();
    } catch (error) {
      if (error?.code === 11000) {
        throw new ConflictException('User already exists');
      }
      throw error;
    }
  }

  async updateRefreshToken(userId: string, hashedToken: string | null) {
    return this.userModel.findByIdAndUpdate(userId, {
      hashedRefreshToken: hashedToken,
    });
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<UserDocument> {
    try {
      const user = await this.findById(userId);
      if (dto.name) user.name = dto.name;
      if (dto.email) user.email = dto.email;
      return await user.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException(
          'User with this credentials is already exists',
        );
      }
      throw error;
    }
  }

  async updatePassword(userId: string, dto: UpdatePasswordDto): Promise<void> {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }
    const user = await this.userModel.findById(userId).select('+password');
    if (!user) throw new BadRequestException('User not found');
    const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    user.password = await bcrypt.hash(dto.newPassword, 10);
    await user.save();
  }

  async deleteAccount(userId: string): Promise<void> {
    try {
      await this.capsuleService.deleteAllByUserId(userId);

      const result = await this.userModel.findByIdAndDelete(userId);
      if (!result) throw new NotFoundException('User for deletion not found');
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'Critical error during account deletion',
      );
    }
  }
}
