import { PostWithBlogSqlRow } from '../../infrastructure/query-repository/post.query-repository';

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

  static mapToView(item: PostWithBlogSqlRow): PostViewDTO {
    const post = new PostViewDTO();
    post.id = item.id;
    post.title = item.title;
    post.shortDescription = item.shortDescription;
    post.content = item.content;
    post.blogId = item.blogId;
    post.blogName = item.blogName;
    post.createdAt = item.createdAt.toISOString();
    post.extendedLikesInfo = {
      likesCount: +item.likesCount,
      dislikesCount: +item.dislikesCount,
      myStatus: item.myStatus,
      newestLikes: item.newestLikes,
    };
    return post;
  }
}
