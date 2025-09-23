import { Module } from '@nestjs/common';
import { BlogRepository } from './blogs/infrastructure/blog.repository';
import { BlogController } from './blogs/api/blog.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Blog, BlogSchema } from './blogs/domain/blog.odm-entity';
import { BlogQueryRepository } from './blogs/infrastructure/query/blog.query-repository';
import { Post, PostSchema } from './posts/domain/post.odm-entity';
import { Comment, CommentSchema } from './comments/domain/comment.odm-entity';
import { CreateBlogHandler } from './blogs/application/usecases/create-blog.usecases';
import { DeleteBlogHandler } from './blogs/application/usecases/delete-blog.usecases';
import { UpdateBlogHandler } from './blogs/application/usecases/update-blog.usecases';
import { CreatePostHandler } from './posts/application/usecases/create-post.usecases';
import { UserAccountsModule } from '../user-accounts/user-accounts.module';
import { Like, LikeSchema } from './likes/domain/like.entety';
import { GetPostWithPagingQueryHandler } from './posts/application/query-usecases/get-posts-with-paging.query-handler';
import { GetPostByIdQueryHandler } from './posts/application/query-usecases/get-post-by-id.query-handler';
import { GetBlogByIdQueryHandler } from './blogs/application/query-usecases/get-blog-by-id.query-usecase';
import { GetBlogsWithPagingQueryHandler } from './blogs/application/query-usecases/get-blogs-with-paging.query-usecase';
import { SaBlogController } from './blogs/api/sa-blog.controller';
import { PostRepository } from './posts/infrastructure/post.repository';
import { PostQueryRepository } from './posts/infrastructure/query-repository/post.query-repository';
import { UpdatePostHandler } from './posts/application/usecases/update-post.usecases';
import { DeletePostHandler } from './posts/application/usecases/delete-post.usecases';
import { PostController } from './posts/api/post.controller';
import { CreateCommentHandler } from './comments/application/usecases/create-comment.usecases';
import { CommentRepository } from './comments/infrastructure/comment.repository';
import { CommentsQueryRepository } from './comments/infrastructure/query/comments.query-repository';
import { GetCommentByIdQueryHandler } from './comments/application/queries-usecases/get-comment-by-id.query';
import {
  GetCommentsByPostWithPagingQueryHandler
} from './comments/application/queries-usecases/get-comments-by-post-with-paging.query';
import { CommentController } from './comments/api/comment.controller';
import { UpdateCommentHandler } from './comments/application/usecases/update-comment.usecases';
import { DeleteCommentHandler } from './comments/application/usecases/delete-comment.usecases';

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
  // SetLikeStatusPostHandler,
  GetPostByIdQueryHandler,
  GetPostWithPagingQueryHandler,
];
const cmdCommentHandler = [
  CreateCommentHandler,
  GetCommentByIdQueryHandler,
  GetCommentsByPostWithPagingQueryHandler,
  UpdateCommentHandler,
  DeleteCommentHandler,
  // LikeStatusCommentHandler,
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
  controllers: [
    BlogController,
    SaBlogController,
    PostController,
    CommentController
  ],
  providers: [
    BlogRepository,
    BlogQueryRepository,
    PostRepository,
    PostQueryRepository,
    CommentRepository,
    CommentsQueryRepository,
    ...cmdBlogHandler,
    ...cmdPostHandler,
    ...cmdCommentHandler,
    // CommentsOdmQueryRepository,
    // CommentOdmRepository,
    // LikeRepository,
    // LikeQueryRepository,
    // LikeUpsertService,
    // LikeMapQueryService,
    // ...cmdBlogHandler,
    // ...cmdPostHandler,
    // ...cmdCommentHandler,
  ],
})
export class BloggersPlatformModule {}
