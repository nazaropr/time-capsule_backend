import { Body, Controller, Delete, Param, Post } from '@nestjs/common';
import {
  CapsuleResponseDto,
  CreateRecipientDto,
} from '@app/capsule/dto/capsule.dto';
import type { JwtPayload } from '@app/auth/interface/JwtPayload';
import { RecipientsService } from '@app/recipients/recipients.service';
import { GetUser } from '@app/auth/decorators/user.decorator';

@Controller('capsule/:id/recipients')
export class RecipientsController {
  constructor(private readonly recipientsService: RecipientsService) {}
  @Post()
  async add(
    @Param('id') id: string,
    @Body() dto: CreateRecipientDto,
    @GetUser() user: JwtPayload,
  ): Promise<CapsuleResponseDto> {
    const response = await this.recipientsService.addRecipient(
      id,
      user.sub,
      dto,
    );
    return new CapsuleResponseDto(response);
  }

  @Delete(':email')
  async remove(
    @Param('id') id: string,
    @Param('email') email: string,
    @GetUser() user: JwtPayload,
  ): Promise<CapsuleResponseDto> {
    const response = await this.recipientsService.removeRecipient(
      id,
      user.sub,
      email,
    );
    return new CapsuleResponseDto(response);
  }
}
