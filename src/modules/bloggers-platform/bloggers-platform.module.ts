import { Module } from '@nestjs/common';
import { BlogRepository } from './blogs/infrastructure/blog.repository';
import { CreateBlogHandler } from './blogs/application/usecases/create-blog.usecases';
import { DeleteBlogHandler } from './blogs/application/usecases/delete-blog.usecases';
import { UpdateBlogHandler } from './blogs/application/usecases/update-blog.usecases';
import { UserAccountsModule } from '../user-accounts/user-accounts.module';
import { SaBlogController } from './blogs/api/sa-blog.controller';
import { Blog } from './blogs/domain/blog.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlogQueryRepository } from './blogs/infrastructure/query/blog.query-repository';
import { BlogController } from './blogs/api/blog.controller';
import { GetBlogsWithPagingQueryHandler } from './blogs/application/query-usecases/get-blogs-with-paging.query-usecase';
import { GetBlogByIdQueryHandler } from './blogs/application/query-usecases/get-blog-by-id.query-usecase';
import { CreatePostHandler } from './posts/application/usecases/create-post.usecases';
import { UpdatePostHandler } from './posts/application/usecases/update-post.usecases';
import { DeletePostHandler } from './posts/application/usecases/delete-post.usecases';
import { GetPostByIdQueryHandler } from './posts/application/query-usecases/get-post-by-id.query-handler';
import { GetPostWithPagingQueryHandler } from './posts/application/query-usecases/get-posts-with-paging.query-handler';
import { Post } from './posts/domain/post.entity';
import { PostController } from './posts/api/post.controller';
import { PostRepository } from './posts/infrastructure/post.repository';
import { PostQueryRepository } from './posts/infrastructure/query-repository/post.query-repository';
import { Comment } from './comments/domain/comment.entity';
import { CommentRepository } from './comments/infrastructure/comment.repository';
import { CreateCommentHandler } from './comments/application/usecases/create-comment.usecases';
import { CommentController } from './comments/api/comment.controller';
import { CommentsQueryRepository } from './comments/infrastructure/query/comments.query-repository';
import { UpdateCommentHandler } from './comments/application/usecases/update-comment.usecases';
import { DeleteCommentHandler } from './comments/application/usecases/delete-comment.usecases';
import { CommentReaction } from './comments/domain/comment-reactions.entity';

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
  // LikeStatusPostHandler,
  GetPostByIdQueryHandler,
  GetPostWithPagingQueryHandler,
];
const cmdCommentHandler = [
  CreateCommentHandler,
  // GetCommentByIdQueryHandler,
  // GetCommentsByPostWithPagingQueryHandler,
  UpdateCommentHandler,
  DeleteCommentHandler,
  // LikeStatusCommentHandler,
];

@Module({
  imports: [
    // Регистрация сущностей (схем) в модуле
    TypeOrmModule.forFeature([Blog, Post, Comment, CommentReaction]),
    // MongooseModule.forFeature([
    //   { name: Blog.name, schema: BlogSchema },
    //   { name: Post.name, schema: PostSchema },
    //   { name: Comment.name, schema: CommentSchema },
    //   { name: Like.name, schema: LikeSchema },
    // ]),
    UserAccountsModule,
  ],
  controllers: [
    BlogController,
    SaBlogController,
    PostController,
    CommentController,
  ],
  providers: [
    BlogRepository,
    BlogQueryRepository,
    PostRepository,
    PostQueryRepository,
    // PostReactionRepository,
    CommentRepository,
    CommentsQueryRepository,
    // CommentReactionRepository,
    ...cmdBlogHandler,
    ...cmdPostHandler,
    ...cmdCommentHandler,
  ],
})
export class BloggersPlatformModule {}
