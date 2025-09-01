import { LikeStatusEnum } from '../../../likes/domain/like-status.enum';
import { PostPersistedType } from '../../domain/post.entity';

type NewestLikeView = {
  addedAt: string;
  userId: string;
  login: string;
};

export class PostNewestLikeViewDto {
  addedAt: string;
  userId: string;
  login: string;
}

export class PostViewDTO {
  id: string;
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string;
  createdAt: string;
  extendedLikesInfo: {
    likesCount: number;
    dislikesCount: number;
    myStatus: string;
    newestLikes: PostNewestLikeViewDto[];
  };

  static mapToView(
    item: PostPersistedType & { blogName: string },
    setStatus: LikeStatusEnum,
  ): PostViewDTO {
    const post = new PostViewDTO();
    post.id = item.id;
    post.title = item.title;
    post.shortDescription = item.shortDescription;
    post.content = item.content;
    post.blogId = item.blogId.toString();
    post.blogName = item.blogName;
    post.createdAt = item.createdAt.toISOString();
    post.extendedLikesInfo = {
      likesCount: 0,
      dislikesCount: 0,
      myStatus: setStatus,
      newestLikes: [],
    };
    return post;
  }
}
