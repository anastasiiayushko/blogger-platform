import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model, Types } from 'mongoose';
import { LikeStatusEnum } from './like-status.enum';
import { CreateLikeDomainDto } from './dto/create-like-domain.dto';

@Schema({
  timestamps: true,
  optimisticConcurrency: true,
})
export class Like {
  @Prop({ type: Types.ObjectId, required: true })
  authorId: Types.ObjectId;

  @Prop({ type: String, required: true })
  authorName: string;

  @Prop({ type: Types.ObjectId, required: true })
  parentId: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(LikeStatusEnum),
    required: true,
  })
  status: LikeStatusEnum;

  createdAt: Date;
  updatedAt: Date;

  static createInstance(dto: CreateLikeDomainDto): LikeDocument {
    const like = new this();
    like.authorId = new Types.ObjectId(dto.authorId);
    like.authorName = dto.authorName;
    like.parentId = new Types.ObjectId(dto.parentId);
    like.status = dto.status;
    return like as LikeDocument;
  }

  updateStatus(newStatus: LikeStatusEnum) {
    if (this.status !== newStatus) {
      this.status = newStatus;
    }
  }
}

export const LikeSchema = SchemaFactory.createForClass(Like);
LikeSchema.loadClass(Like);

export type LikeDocument = HydratedDocument<Like>;
export type LikeModelType = Model<LikeDocument> & typeof Like;
