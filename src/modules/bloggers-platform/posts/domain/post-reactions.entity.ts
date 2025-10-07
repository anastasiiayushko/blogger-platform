import {
  BaseEntityNewType,
  BaseEntityPersistedType,
} from '../../../../core/types/base-entity.type';
import { LikeStatusEnum } from '../../../../core/types/like-status.enum';

type BaseReaction = {
  postId: string;
  userId: string;
  status: LikeStatusEnum;
};

export type PostReactionNewType = PostReaction<BaseEntityNewType>;
export type PostReactionPersistedType = PostReaction<BaseEntityPersistedType>;

export type PostReactionUnionType = PostReaction<
  BaseEntityNewType | BaseEntityPersistedType
>;

export class PostReaction<
  S extends BaseEntityNewType | BaseEntityPersistedType,
> {
  get status(): LikeStatusEnum {
    return this._status;
  }

  get userId(): string {
    return this._userId;
  }

  get postId(): string {
    return this._postId;
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
  private _postId: string;
  private _userId: string;
  private _status: LikeStatusEnum;

  constructor(state: BaseReaction & S) {
    this._id = state.id;
    this._createdAt = state.createdAt;
    this._updatedAt = state.updatedAt;
    this._postId = state.postId;
    this._userId = state.userId;
    this._status = state.status;
  }

  static createInstance(dto: BaseReaction): PostReactionNewType {
    return new PostReaction<BaseEntityNewType>({
      id: null,
      createdAt: null,
      updatedAt: null,
      postId: dto.postId,
      userId: dto.userId,
      status: dto.status,
    });
  }

  static toDomain(rowSql: {
    id: string;
    userId: string;
    postId: string;
    status: LikeStatusEnum;
    createdAt: Date;
    updatedAt: Date;
  }): PostReactionPersistedType {
    return new PostReaction<BaseEntityPersistedType>(rowSql);
  }

  isNew(): this is PostReactionNewType {
    return !this._id;
  }

  // 🔑 Единственная дженерик-перегрузка, видимая снаружи
  static toPrimitive<C extends BaseEntityNewType | BaseEntityPersistedType>(
    c: PostReaction<C>,
  ): BaseReaction & C;

  static toPrimitive(
    reaction: PostReaction<BaseEntityNewType | BaseEntityPersistedType>,
  ) {
    const reactionPrimitive = {
      id: reaction.id,
      postId: reaction.postId,
      userId: reaction.userId,
      status: reaction.status,
      createdAt: reaction.createdAt,
      updatedAt: reaction.updatedAt,
    };
    return reactionPrimitive;
  }

  setStatus(status: LikeStatusEnum): { changed: boolean } {
    if (this._status !== status) {
      this._status = status;
      return { changed: true };
    }
    return { changed: false };
  }
}
