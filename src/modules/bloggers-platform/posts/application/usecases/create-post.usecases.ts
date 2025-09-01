import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostRepository } from '../../infrastructure/post.repository';
import { BlogQueryRepository } from '../../../blogs/infrastructure/query/blog.query-repository';
import { Post } from '../../domain/post.entity';

export class CreatePostCommand {
  constructor(
    public blogId: string,
    public content: string,
    public shortDescription: string,
    public title: string,
  ) {}
}

@CommandHandler(CreatePostCommand)
export class CreatePostHandler
  implements ICommandHandler<CreatePostCommand, string>
{
  constructor(
    protected postRepository: PostRepository,
    protected blogQwRepository: BlogQueryRepository,
  ) {}

  async execute(command: CreatePostCommand): Promise<string> {
    const blog = await this.blogQwRepository.findOrNotFoundFail(command.blogId);
    const post = Post.createInstance({
      title: command.title,
      content: command.content,
      shortDescription: command.shortDescription,
      blogName: blog.name,
      blogId: blog.id,
    });

    const savedPost = await this.postRepository.save(post);
    return savedPost.id;
  }
}
