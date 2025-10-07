import {
  BaseEntityNewType,
  BaseEntityPersistedType,
} from '../../../../core/types/base-entity.type';
import { LikeStatusEnum } from '../../../../core/types/like-status.enum';

type BaseCommentReaction = {
  commentId: string;
  userId: string;
  status: LikeStatusEnum;
};

export type CommentReactionNewType = CommentReaction<BaseEntityNewType>;
export type CommentReactionPersistedType =
  CommentReaction<BaseEntityPersistedType>;

export type CommentReactionUnionType = CommentReaction<
  BaseEntityNewType | BaseEntityPersistedType
>;

export class CommentReaction<
  S extends BaseEntityNewType | BaseEntityPersistedType,
> {
  get status(): LikeStatusEnum {
    return this._status;
  }

  get userId(): string {
    return this._userId;
  }

  get commentId(): string {
    return this._commentId;
  }

  get updatedAt(): Date | null {
    return this._updatedAt;
  }

  get id(): string | null {
    return this._id;
  }

  get createdAt(): Date | null {
    return this._createdAt;
  }

  private _id: string | null = null;
  private _createdAt: Date | null = null;
  private _updatedAt: Date | null = null;
  private _commentId: string;
  private _userId: string;
  private _status: LikeStatusEnum;

  constructor(state: BaseCommentReaction & S) {
    this._id = state.id;
    this._createdAt = state.createdAt;
    this._updatedAt = state.updatedAt;
    this._commentId = state.commentId;
    this._userId = state.userId;
    this._status = state.status;
  }

  static createInstance(dto: BaseCommentReaction): CommentReactionNewType {
    return new CommentReaction<BaseEntityNewType>({
      id: null,
      createdAt: null,
      updatedAt: null,
      commentId: dto.commentId,
      userId: dto.userId,
      status: dto.status,
    });
  }

  static toDomain(rowSql: {
    id: string;
    userId: string;
    commentId: string;
    status: LikeStatusEnum;
    createdAt: Date;
    updatedAt: Date;
  }): CommentReactionPersistedType {
    return new CommentReaction<BaseEntityPersistedType>(rowSql);
  }

  isNew(): this is CommentReactionNewType {
    return !this._id;
  }

  // 🔑 Единственная дженерик-перегрузка, видимая снаружи
  static toPrimitive<C extends BaseEntityNewType | BaseEntityPersistedType>(
    c: CommentReaction<C>,
  ): BaseCommentReaction & C;

  static toPrimitive(
    reaction: CommentReaction<BaseEntityNewType | BaseEntityPersistedType>,
  ) {
    const reactionPrimitive = {
      id: reaction.id,
      commentId: reaction.commentId,
      userId: reaction.userId,
      status: reaction.status,
      createdAt: reaction.createdAt,
      updatedAt: reaction.updatedAt,
    };
    return reactionPrimitive;
  }

  setStatus(status: LikeStatusEnum): {changed: boolean} {
    if (this._status !== status) {
      this._status = status;
      return {changed: true};
    }
    return {changed: false};
  }
}
