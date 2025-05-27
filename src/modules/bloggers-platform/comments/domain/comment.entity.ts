import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  CommentatorRawSchema,
  RawCommentatorSchema,
} from './commentator.raw-schema';
import { HydratedDocument, Model, Types } from 'mongoose';
import { LikeRawSchema, RawLikeSchema } from './like.raw-schema';

@Schema({ timestamps: true })
export class Comment {
  /**
   * @type{String}
   * Content of the comment
   */
  @Prop({ type: String, required: true })
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
}

export const CommentSchema = SchemaFactory.createForClass(Comment);
export type CommentDocument = HydratedDocument<Comment>;

export type CommentModelType = Model<Comment>;
