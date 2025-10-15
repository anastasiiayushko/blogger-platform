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

const cmdBlogHandler = [
  CreateBlogHandler,
  DeleteBlogHandler,
  UpdateBlogHandler,
  // GetBlogsWithPagingQueryHandler,
  // GetBlogByIdQueryHandler,
];

// const cmdPostHandler = [
//   CreatePostHandler,
//   UpdatePostHandler,
//   DeletePostHandler,
//   LikeStatusPostHandler,
//   GetPostByIdQueryHandler,
//   GetPostWithPagingQueryHandler,
// ];
// const cmdCommentHandler = [
//   CreateCommentHandler,
//   GetCommentByIdQueryHandler,
//   GetCommentsByPostWithPagingQueryHandler,
//   UpdateCommentHandler,
//   DeleteCommentHandler,
//   LikeStatusCommentHandler,
// ];

@Module({
  imports: [
    // Регистрация сущностей (схем) в модуле
    TypeOrmModule.forFeature([Blog]),
    // MongooseModule.forFeature([
    //   { name: Blog.name, schema: BlogSchema },
    //   { name: Post.name, schema: PostSchema },
    //   { name: Comment.name, schema: CommentSchema },
    //   { name: Like.name, schema: LikeSchema },
    // ]),
    UserAccountsModule,
  ],
  controllers: [
    // BlogController,
    SaBlogController,
    // PostController,
    // CommentController,
  ],
  providers: [
    BlogRepository,
    BlogQueryRepository,
    // PostRepository,
    // PostQueryRepository,
    // PostReactionRepository,
    // CommentRepository,
    // CommentsQueryRepository,
    // CommentReactionRepository,
    ...cmdBlogHandler,
    // ...cmdPostHandler,
    // ...cmdCommentHandler,
  ],
})
export class BloggersPlatformModule {}
