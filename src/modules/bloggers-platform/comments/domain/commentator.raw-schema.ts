import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ _id: false })
export class CommentatorRawSchema {
  @Prop({ required: Types.ObjectId, type: String })
  userId: Types.ObjectId;

  @Prop({ required: true, type: String })
  userLogin: string;
}

export const RawCommentatorSchema =
  SchemaFactory.createForClass(CommentatorRawSchema);
