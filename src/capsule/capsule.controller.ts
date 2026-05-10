import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CapsuleService } from '@app/capsule/capsule.service';
import {
  CapsuleResponseDto,
  CapsuleWithContentDto,
  CreateCapsuleDto,
} from '@app/capsule/dto/capsule.dto';
import { GetUser } from '@app/auth/decorators/user.decorator';
import type { JwtPayload } from '@app/auth/interface/JwtPayload';
import { Public } from '@app/auth/decorators/public.decorator';

@Controller('capsule')
export class CapsuleController {
  constructor(private readonly capsuleService: CapsuleService) {}
  @Post()
  async create(
    @Body() body: CreateCapsuleDto,
    @GetUser() user: JwtPayload,
  ): Promise<CapsuleResponseDto> {
    const response = await this.capsuleService.createCapsule(body, user.sub);
    return new CapsuleResponseDto(response);
  }

  @Get('my')
  async findAll(@GetUser() user: JwtPayload): Promise<CapsuleResponseDto[]> {
    const response = await this.capsuleService.findAllByUserId(user.sub);

    return response.map((capsule) => {
      return new CapsuleResponseDto(capsule);
    });
  }

  @Get(':id')
  @Public()
  async findOne(
    @GetUser() user: JwtPayload | undefined,
    @Param('id') id: string,
  ): Promise<CapsuleWithContentDto> {
    const response = await this.capsuleService.findOne(id, user?.sub);
    return new CapsuleWithContentDto(
      response.capsule,
      response.decryptedContent,
    );
  }
}
