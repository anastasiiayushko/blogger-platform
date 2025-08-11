import { Module } from '@nestjs/common';
import { BlogService } from './blogs/application/blog.service';
import { BlogRepository } from './blogs/infrastructure/blog.repository';
import { BlogController } from './blogs/api/blog.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Blog, BlogSchema } from './blogs/domain/blog.entity';
import { BlogQueryRepository } from './blogs/infrastructure/query/blog.query-repository';
import { Post, PostSchema } from './posts/domain/post.entity';
import { PostController } from './posts/api/post.controller';
import { PostRepository } from './posts/infrastructure/post.repository';
import { BlogsExternalQueryRepository } from './blogs/infrastructure/external-query/blogs.external-query-repository';
import { PostQueryRepository } from './posts/infrastructure/query-repository/post.query-repository';
import { Comment, CommentSchema } from './comments/domain/comment.entity';
import { CommentsQueryRepository } from './comments/infrastructure/query/comments.query-repository';
import { CommentController } from './comments/api/comment.controller';
import { CreateBlogHandler } from './blogs/application/usecases/create-blog.usecases';
import { DeleteBlogHandler } from './blogs/application/usecases/delete-blog.usecases';
import { UpdateBlogHandler } from './blogs/application/usecases/update-blog.usecases';
import { CreatePostHandler } from './posts/application/usecases/create-post.usecases';
import { UpdatePostHandler } from './posts/application/usecases/update-post.usecases';
import { DeletePostHandler } from './posts/application/usecases/delete-post.usecases';
import { UserAccountsModule } from '../user-accounts/user-accounts.module';
import { CommentRepository } from './comments/infrastructure/comment.repository';
import { CreateCommentHandler } from './comments/application/usecases/create-comment.usecases';
import { GetCommentsByPostWithPagingQueryHandler } from './comments/application/queries-usecases/get-comments-by-post-with-paging.query';
import { GetCommentByIdQueryHandler } from './comments/application/queries-usecases/get-comment-by-id.query';
import { UpdateCommentHandler } from './comments/application/usecases/update-comment.usecases';
import { DeleteCommentHandler } from './comments/application/usecases/delete-comment.usecases';
import { Like, LikeSchema } from './likes/domain/like.entety';
import { LikeStatusCommentHandler } from './comments/application/usecases/like-status-comment.usecase';
import { LikeUpsertService } from './likes/application/services/like-upsert.service';
import { LikeRepository } from './likes/infrastucture/repository/like-repository';
import { LikeQueryRepository } from './likes/infrastucture/query-repository/like-query-repository';
import { LikeMapQueryService } from './likes/application/services/like-map.query-service';
import { GetPostWithPagingQueryHandler } from './posts/application/query-usecases/get-posts-with-paging.query-handler';
import { GetPostByIdQueryHandler } from './posts/application/query-usecases/get-post-by-id.query-handler';
import { SetLikeStatusPostHandler } from './posts/application/usecases/set-like-status-post.usecase';
import { GetBlogByIdQueryHandler } from './blogs/application/query-usecases/get-blog-by-id.query-usecase';
import { GetBlogsWithPagingQueryHandler } from './blogs/application/query-usecases/get-blogs-with-paging.query-usecase';

const cmdBlogHandler = [
  CreateBlogHandler,
  DeleteBlogHandler,
  UpdateBlogHandler,
  GetBlogsWithPagingQueryHandler,
  GetBlogByIdQueryHandler,
];

const cmdPostHandler = [
  CreatePostHandler,
  UpdatePostHandler,
  DeletePostHandler,
  SetLikeStatusPostHandler,
  GetPostByIdQueryHandler,
  GetPostWithPagingQueryHandler,
];
const cmdCommentHandler = [
  CreateCommentHandler,
  GetCommentsByPostWithPagingQueryHandler,
  GetCommentByIdQueryHandler,
  UpdateCommentHandler,
  DeleteCommentHandler,
  LikeStatusCommentHandler,
];

@Module({
  imports: [
    // Регистрация сущностей (схем) в модуле
    MongooseModule.forFeature([
      { name: Blog.name, schema: BlogSchema },
      { name: Post.name, schema: PostSchema },
      { name: Comment.name, schema: CommentSchema },
      { name: Like.name, schema: LikeSchema },
    ]),
    UserAccountsModule,
  ],
  controllers: [BlogController, PostController, CommentController],
  providers: [
    BlogService,
    BlogRepository,
    BlogQueryRepository,
    BlogsExternalQueryRepository,
    PostRepository,
    PostQueryRepository,
    CommentsQueryRepository,
    CommentRepository,
    LikeRepository,
    LikeQueryRepository,
    LikeUpsertService,
    LikeMapQueryService,
    ...cmdBlogHandler,
    ...cmdPostHandler,
    ...cmdCommentHandler,
  ],
})
export class BloggersPlatformModule {}
