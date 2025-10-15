import { Post } from '../../domain/post.entity';
import { LikeStatusEnum } from '../../../../../core/types/like-status.enum';

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
    myStatus: LikeStatusEnum;
    newestLikes: PostNewestLikeViewDto[];
  };

  static mapToView(item: any): PostViewDTO {
    const post = new PostViewDTO();
    post.id = item.id;
    post.title = item.title;
    post.shortDescription = item.shortDescription;
    post.content = item.content;
    post.blogId = item.blogId;
    post.blogName = item.blogName;
    post.createdAt = item.createdAt.toISOString();
    post.extendedLikesInfo = {
      likesCount: 0,
      dislikesCount: 0,
      myStatus: LikeStatusEnum.None,
      newestLikes: [],
    };
    return post;
  }
}
