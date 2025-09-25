import { UpdateCommentDomainDto } from './dto/update-comment.domain.dto';
import { CreateCommentDomainDto } from './dto/create-comment.domain.dto';
import {
  BaseEntityNewType,
  BaseEntityPersistedType,
} from '../../../../core/types/base-entity.type';

type BaseComment = {
  postId: string;
  userId: string;
  content: string;
};

export type CommentNewType = Comment<BaseEntityNewType>;
export type CommentPersistedType = Comment<BaseEntityPersistedType>;
export type CommentUnionType = CommentNewType | CommentPersistedType;

export class Comment<S extends BaseEntityNewType | BaseEntityPersistedType> {
  private _id: null | string; //PK
  private _postId: string; //FK
  private _userId: string; //FK
  private _content: string;
  private _createdAt: null | Date;
  private _updatedAt: null | Date;

  constructor(public state: BaseComment & S) {
    this._id = state.id;
    this._postId = state.postId;
    this._userId = state.userId;
    this._content = state.content;
    this._createdAt = state.createdAt;
    this._updatedAt = state.updatedAt;
  }

  isNew(): this is CommentNewType {
    return this._id === null;
  }

  static createInstance(dto: CreateCommentDomainDto): CommentNewType {
    return new Comment<BaseEntityNewType>({
      id: null,
      postId: dto.postId,
      userId: dto.userId,
      content: dto.content,
      createdAt: null,
      updatedAt: null,
    });
  }

  updateContent(dto: UpdateCommentDomainDto): void {
    this._content = dto.content;
  }

  static toDomain(dtoRow: {
    id: string;
    postId: string;
    userId: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
  }): CommentPersistedType {
    return new Comment(dtoRow);
  }

  // 🔑 Единственная дженерик-перегрузка, видимая снаружи
  static toPrimitive<C extends BaseEntityPersistedType | BaseEntityNewType>(
    c: Comment<C>,
  ): BaseComment & C;

  // ==== Простой метод без перегрузок: вернёт BaseComment & S ====
  static toPrimitive(comment: CommentUnionType) {
    return {
      id: comment._id,
      postId: comment._postId,
      userId: comment._userId,
      content: comment._content,
      createdAt: comment._createdAt,
      updatedAt: comment._updatedAt,
    };
  }

  get id() {
    return this._id;
  }

  get postId() {
    return this._postId;
  }

  get userId() {
    return this._userId;
  }

  get content() {
    return this._content;
  }

  get createdAt() {
    return this._createdAt;
  }

  get updatedAt() {
    return this._updatedAt;
  }
}
