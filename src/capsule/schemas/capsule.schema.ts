import mongoose, { HydratedDocument } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
class Recipient {
  @Prop({ required: true }) email: string;
  @Prop({ default: false }) isNotified: boolean;
}
export const RecipientSchema = SchemaFactory.createForClass(Recipient);

export type CapsuleDocument = HydratedDocument<Capsule>;

@Schema({ timestamps: true })
export class Capsule {
  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  })
  owner: mongoose.Types.ObjectId;
  @Prop({ required: true })
  title: string;
  @Prop({ required: true, select: false })
  content: string;
  @Prop({ required: true })
  unlockAt: Date;
  @Prop({ default: false })
  isUnlocked: boolean;
  @Prop({ default: false })
  isPublic: boolean;
  @Prop({ type: [RecipientSchema], default: [] })
  recipients: Recipient[];
  @Prop({ required: true, unique: true })
  slug: string;

  createdAt: Date;
}

export const CapsuleSchema = SchemaFactory.createForClass(Capsule);
