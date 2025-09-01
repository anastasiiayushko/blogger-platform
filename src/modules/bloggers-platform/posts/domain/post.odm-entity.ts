import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  ExtendedLikesInfo,
  RawExtendedLikesInfoSchema,
} from './extended-likes-info.raw-schema';
import { CreatePostDomainDto } from './dto/create-post.domain.dto';
import { HydratedDocument, Model, Types } from 'mongoose';
import { UpdatePostDomainDto } from './dto/update-post.domain.dto';
import { UpdateExtendedLikesPostDomainDTO } from './dto/update-extended-likes-post.domain.dto';
import {
  postContentConstraints,
  postShortDescConstraints,
  postTitleConstraints,
} from './post.constraints';

@Schema({
  timestamps: true,
  optimisticConcurrency: true, //  Optimistic Concurrency Control (OCC) — через versionKey
  // strict: 'throw',
})
export class Post {
  /**
   * Title of the post (max 30 characters, trimmed)
   * @type {string}
   * @required
   */
  @Prop({
    required: true,
    type: String,
    maxlength: [
      postTitleConstraints.maxLength,
      'Maximum length of title 30 symbols',
    ],
    trim: true,
  })
  title: string;

  /**
   * Short description of the post (max 100 characters, trimmed)
   * @type {string}
   * @required
   */
  @Prop({
    required: true,
    type: String,
    maxlength: [
      postShortDescConstraints.maxLength,
      'Maximum length of field 100 symbols',
    ],
    trim: true,
  })
  shortDescription: string;

  /**
   * Content of the post (max 1000 characters, trimmed)
   * @type {string}
   * @required
   */
  @Prop({
    required: true,
    type: String,
    maxlength: [
      postContentConstraints.maxLength,
      'Maximum length of field 1000 symbols',
    ],
    trim: true,
  })
  content: string;

  /**
   * ID of the blog this post belongs to
   * @type {string}
   * @required
   */
  @Prop({ type: Types.ObjectId, required: true })
  blogId: Types.ObjectId;

  /**
   * Name of the blog
   * @type  {string}
   * @required
   */
  @Prop({ type: String, required: true })
  blogName: string;

  /**
   * Creation timestamp
   * Explicitly defined despite timestamps: true
   * properties without @Prop for typescript so that they are in the class instance (or in instance methods)
   * @type {Date}
   */
  createdAt: Date;
  updatedAt: Date;

  @Prop({ type: RawExtendedLikesInfoSchema })
  extendedLikesInfo: ExtendedLikesInfo;

  static createInstance(dto: CreatePostDomainDto): PostDocument {
    const post = new this();
    post.title = dto.title;
    post.shortDescription = dto.shortDescription;
    post.content = dto.content;
    post.blogId = new Types.ObjectId(dto.blogId);
    post.blogName = dto.blogName;
    post.extendedLikesInfo = {
      likesCount: 0,
      dislikesCount: 0,
      newestLikes: [],
    };
    return post as PostDocument;
  }

  updatePost(dto: UpdatePostDomainDto) {
    this.blogId = new Types.ObjectId(dto.blogId);
    this.blogName = dto.blogName;
    this.content = dto.content;
    this.shortDescription = dto.shortDescription;
    this.title = dto.title;
  }

  updateExtendedLikesInfo(dto: UpdateExtendedLikesPostDomainDTO) {
    this.extendedLikesInfo.newestLikes = dto.newestLikes;
    this.extendedLikesInfo.likesCount = dto.likesCount;
    this.extendedLikesInfo.dislikesCount = dto.dislikesCount;
  }
}

export const PostSchema = SchemaFactory.createForClass(Post);

PostSchema.loadClass(Post);

export type PostDocument = HydratedDocument<Post>;
export type PostModelType = Model<PostDocument> & typeof Post;
