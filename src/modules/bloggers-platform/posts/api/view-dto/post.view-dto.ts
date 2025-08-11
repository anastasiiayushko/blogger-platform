import { PostDocument } from '../../domain/post.entity';
import { LikeStatusEnum } from '../../../likes/domain/like-status.enum';

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

  static mapToView(item: PostDocument, setStatus: LikeStatusEnum): PostViewDTO {
    const post = new PostViewDTO();
    post.id = item._id.toString();
    post.title = item.title;
    post.shortDescription = item.shortDescription;
    post.content = item.content;
    post.blogId = item.blogId.toString();
    post.blogName = item.blogName;
    post.createdAt = item.createdAt.toISOString();
    post.extendedLikesInfo = {
      likesCount: item.extendedLikesInfo.likesCount,
      dislikesCount: item.extendedLikesInfo.dislikesCount,
      myStatus: setStatus,
      newestLikes: item.extendedLikesInfo.newestLikes.map((like) => ({
        addedAt: like.addedAt.toISOString(),
        userId: like.userId,
        login: like.login,
      })),
    };
    return post;
  }
}
