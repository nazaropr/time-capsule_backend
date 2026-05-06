import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { Model } from 'mongoose';
import { CreateUserDto } from '@app/user/dto/user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    try {
      const { password, ...rest } = createUserDto;
      const salt = await bcrypt.genSalt(10);
      const hashedPass = await bcrypt.hash(password, salt);
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
}
