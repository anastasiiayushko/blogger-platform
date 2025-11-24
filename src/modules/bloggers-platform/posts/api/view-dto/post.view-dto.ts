import { LikeStatusEnum } from '../../../../../core/types/like-status.enum';
import { PostWithNewestLikesRaw } from '../../infrastructure/query-repository/post.query-repository';

class PostNewestLikeViewDto {
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

  static mapToView(item: PostWithNewestLikesRaw): PostViewDTO {
    const post = new PostViewDTO();
    post.id = item.id;
    post.title = item.title;
    post.shortDescription = item.short_description;
    post.content = item.content;
    post.blogId = item.blog_id;
    post.blogName = item.blog_name;
    post.createdAt = item.created_at;
    post.extendedLikesInfo = {
      likesCount: item.likes_count,
      dislikesCount: item.dislikes_count,
      myStatus: item.my_status,
      newestLikes: item.newest_likes,
    };

    return post;
  }
}
