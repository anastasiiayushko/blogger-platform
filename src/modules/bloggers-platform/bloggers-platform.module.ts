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
import { PostQueryRepository } from './posts/infrastructure/query/post.query-repository';
import { PostsExternalQueryRepository } from './posts/infrastructure/external-query/posts.external-query-repository';
import { Comment, CommentSchema } from './comments/domain/comment.entity';
import { CommentsQueryRepository } from './comments/infrastructure/query/comments.query-repository';
import { CommentController } from './comments/api/comment.controller';
import { CreateBlogHandler } from './blogs/application/usecases/create-blog.usecases';
import { CqrsModule } from '@nestjs/cqrs';
import { DeleteBlogHandler } from './blogs/application/usecases/delete-blog.usecases';
import { UpdateBlogHandler } from './blogs/application/usecases/update-blog.usecases';
import { CreatePostHandler } from './posts/application/usecases/create-post.usecases';
import { UpdatePostHandler } from './posts/application/usecases/update-post.usecases';
import { DeletePostHandler } from './posts/application/usecases/delete-post.usecases';
import { UserAccountsModule } from '../user-accounts/user-accounts.module';
import { CommentRepository } from './comments/infrastructure/comment.repository';
import { CreateCommentHandler } from './comments/application/usecases/create-comment.usecases';
import {
  GetCommentsByPostWithPagingQueryHandler
} from './comments/application/queries/get-comments-by-post-with-paging.query';
import { GetCommentByIdQueryHandler } from './comments/application/queries/get-comment-by-id.query';

const cmdBlogHandler = [
  CreateBlogHandler,
  DeleteBlogHandler,
  UpdateBlogHandler,
];

const cmdPostHandler = [
  CreatePostHandler,
  UpdatePostHandler,
  DeletePostHandler,
];
const cmdCommentHandler = [CreateCommentHandler, GetCommentsByPostWithPagingQueryHandler, GetCommentByIdQueryHandler];

@Module({
  imports: [
    CqrsModule,
    // Регистрация сущностей (схем) в модуле
    MongooseModule.forFeature([
      { name: Blog.name, schema: BlogSchema },
      { name: Post.name, schema: PostSchema },
      { name: Comment.name, schema: CommentSchema },
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
    PostsExternalQueryRepository,
    CommentsQueryRepository,
    CommentRepository,
    ...cmdBlogHandler,
    ...cmdPostHandler,
    ...cmdCommentHandler,
  ],
})
export class BloggersPlatformModule {}
