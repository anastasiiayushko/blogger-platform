import { CreatePostDomainDto } from './dto/create-post.domain.dto';
import { PostSqlRow } from '../infrastructure/post.repository';

export type PostNewType = Post & { id: null; createdAt: null };
export type PostPersistedType = Post & { id: string; createdAt: Date };

export class Post {
  constructor(
    public id: null | string, //PK
    public blogId: string, //FK
    public title: string,
    public shortDescription: string,
    public content: string,
    public createdAt: Date | null,
  ) {}

  static createInstance(dto: CreatePostDomainDto): PostNewType {
    return new Post(
      null,
      dto.blogId,
      dto.title,
      dto.shortDescription,
      dto.content,
      null,
    ) as PostNewType;
  }

  static toDomain(row: {
    id: string;
    blogId: string;
    title: string;
    shortDescription: string;
    content: string;
    createdAt: Date;
  }): PostPersistedType {
    return new Post(
      row.id,
      row.blogId,
      row.title,
      row.shortDescription,
      row.content,
      row.createdAt,
    ) as PostPersistedType;
  }

  static toPrimitive(post: PostPersistedType): PostPersistedType;
  static toPrimitive(post: PostNewType): PostNewType;
  static toPrimitive(post: Post): any {
    /* instanceof ветки → вернуть точный лит */
    if (post.id && typeof post.id === 'string') {
      return {
        id: post.id,
        title: post.title,
        shortDescription: post.shortDescription,
        content: post.content,
        createdAt: post.createdAt,
        blogId: post.blogId,
      } as PostPersistedType;
    }
    return {
      id: post.id,
      title: post.title,
      shortDescription: post.shortDescription,
      content: post.content,
      createdAt: post.createdAt,
      blogId: post.blogId,
    } as PostNewType;
  }
}
