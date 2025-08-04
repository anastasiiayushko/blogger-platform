import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostRepository } from '../../infrastructure/post.repository';
import { InjectModel } from '@nestjs/mongoose';
import { Post, PostModelType } from '../../domain/post.entity';
import { BlogQueryRepository } from '../../../blogs/infrastructure/query/blog.query-repository';

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
    @InjectModel(Post.name) protected PostModel: PostModelType,
    protected postRepo: PostRepository,
    protected blogQRepo: BlogQueryRepository,
  ) {}

  async execute(command: CreatePostCommand): Promise<string> {
    const blog = await this.blogQRepo.findOrNotFoundFail(command.blogId);
    const post = this.PostModel.createInstance({
      title: command.title,
      content: command.content,
      shortDescription: command.shortDescription,
      blogName: blog.name,
      blogId: blog.id,
    });

    await this.postRepo.save(post);
    return post._id.toString();
  }
}
