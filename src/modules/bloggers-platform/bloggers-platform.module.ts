import { Module } from '@nestjs/common';
import { BlogService } from './blogs/application/blog.service';
import { BlogRepository } from './blogs/infrastructure/blog.repository';
import { BlogController } from './blogs/api/blog.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Blog, BlogSchema } from './blogs/domain/blog.entity';
import { BlogQueryRepository } from './blogs/infrastructure/query/blog.query-repository';
import { Post, PostSchema } from './posts/domain/post.entity';
import { PostController } from './posts/api/post.controller';
import { PostService } from './posts/application/post.service';
import { PostRepository } from './posts/infrastructure/post.repository';
import { BlogsExternalQueryRepository } from './blogs/infrastructure/external-query/blogs.external-query-repository';
import { PostQueryRepository } from './posts/infrastructure/query/post.query-repository';
import { PostExternalService } from './posts/application/external-service/post.external-service';
import { PostsExternalQueryRepository } from './posts/infrastructure/external-query/posts.external-query-repository';
import { CommentSchema, Comment } from './comments/domain/comment.entity';
import { CommentsQueryRepository } from './comments/infrastructure/query/comments.query-repository';
import { CommentController } from './comments/api/comment.controller';
import { CommentsExternalQueryRepository } from './comments/infrastructure/external-query/comments.external-query-repository';

@Module({
  imports: [
    // Регистрация сущностей (схем) в модуле
    MongooseModule.forFeature([
      { name: Blog.name, schema: BlogSchema },
      { name: Post.name, schema: PostSchema },
      { name: Comment.name, schema: CommentSchema },
    ]),
  ],
  controllers: [BlogController, PostController, CommentController],
  providers: [
    BlogService,
    BlogRepository,
    BlogQueryRepository,
    BlogsExternalQueryRepository,
    PostService,
    PostRepository,
    PostQueryRepository,
    PostExternalService,
    PostsExternalQueryRepository,
    CommentsQueryRepository,
    CommentsExternalQueryRepository,
  ],
})
export class BloggersPlatformModule {}
