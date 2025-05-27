import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class LikeRawSchema {
  @Prop({ required: true, type: Number, default: 0 })
  likesCount: number;

  @Prop({ required: true, type: Number, default: 0 })
  dislikesCount: number;
}

export const RawLikeSchema = SchemaFactory.createForClass(LikeRawSchema);
