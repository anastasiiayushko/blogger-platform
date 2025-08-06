import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  CommentatorRawSchema,
  RawCommentatorSchema,
} from './commentator.raw-schema';
import { HydratedDocument, Model, Types } from 'mongoose';
import { LikeRawSchema, RawLikeSchema } from './like.raw-schema';
import { CreateCommentDomainDto } from './dto/create-comment.domain.dto';

export const commentContentConstraints = {
  minLength: 30,
  maxLength: 300,
};

@Schema({
  timestamps: true,
  optimisticConcurrency: true,
})
export class Comment {
  /**
   * @type{String}
   * Content of the comment
   */
  @Prop({
    type: String,
    required: true,
    trim: true,
    length: {
      min: commentContentConstraints.minLength,
      max: commentContentConstraints.maxLength,
    },
  })
  content: string;
  /**
   * ID of the post witch for create comment
   *
   * @type {Types.ObjectId}
   */
  @Prop({ type: Types.ObjectId, required: true })
  postId: Types.ObjectId;

  /**
   * Data of the Author who created the comment
   *
   * @type {CommentatorRawSchema}  -
   */
  @Prop({ type: RawCommentatorSchema, required: true })
  commentatorInfo: CommentatorRawSchema;

  /**
   * This statistics reaction
   *
   * @type {CommentatorRawSchema}  -
   */
  @Prop({ type: RawLikeSchema, required: true })
  likesInfo: LikeRawSchema;

  /**
   * Creation timestamp
   * Explicitly defined despite timestamps: true
   * properties without @Prop for typescript so that they are in the class instance (or in instance methods)
   * @type {Date}
   */
  createdAt: Date;
  updatedAt: Date;

  static createInstance(dto: CreateCommentDomainDto): CommentDocument {
    const comment = new this();
    comment.content = dto.content;
    comment.postId = new Types.ObjectId(dto.postId);
    comment.commentatorInfo = {
      userId: new Types.ObjectId(dto.userId),
      userLogin: dto.userLogin,
    };
    comment.likesInfo = {
      likesCount: 0,
      dislikesCount: 0,
    };
    return comment as CommentDocument;
  }
}

export const CommentSchema = SchemaFactory.createForClass(Comment);
//Register methods entity in schema
CommentSchema.loadClass(Comment);
export type CommentDocument = HydratedDocument<Comment>;

export type CommentModelType = Model<CommentDocument> & typeof Comment;
