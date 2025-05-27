import {
  DefinitionsFactory,
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';

/**
 * Raw Sub Schema.
 * The last three likes are sorted by time.
 */
@Schema({ _id: false })
class PostUserLikeItem {
  /**
   *  Date when the like was added
   * @param {Date}
   * @required
   */
  @Prop({ type: Date, required: true })
  addedAt: Date;
  /**
   * ID of the user who liked the post
   *
   * @param {String}
   * @required
   */
  @Prop({ type: String, required: true })
  userId: string;
  /**
   *  Login of the user who liked the post
   *
   * @type {String}
   * @required
   */
  @Prop({ type: String, required: true })
  login: string;
}

const RawPostUserLikeItem = SchemaFactory.createForClass(PostUserLikeItem);

/**
 * Raw  Schema.
 * Information about likes on the post
 * @returns {ExtendedLikesInfo}
 */
@Schema({ _id: false })
export class ExtendedLikesInfo {
  /**
   * Number of likes of the post
   *
   * @type {number}
   * @required
   * @default: 0
   */
  @Prop({ type: Number, required: true, default: 0 })
  likesCount: number;

  /**
   * Number of dislikes of the post
   *
   * @type {number}
   * @required
   * @default: 0
   */
  @Prop({ type: Number, required: true, default: 0 })
  dislikesCount: number;

  /**
   * Last 3 user, set like of the post
   *
   * @type {RawPostUserLikeItem[]}
   * @default []
   */
  @Prop({ type: [RawPostUserLikeItem], default: [] })
  newestLikes: PostUserLikeItem[];
}

// Генерация сырой схемы
export const RawExtendedLikesInfoSchema =
  DefinitionsFactory.createForClass(ExtendedLikesInfo);
