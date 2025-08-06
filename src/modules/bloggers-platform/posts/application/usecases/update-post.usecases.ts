import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostRepository } from '../../infrastructure/post.repository';
import { InjectModel } from '@nestjs/mongoose';
import { Post, PostModelType } from '../../domain/post.entity';
import { BlogQueryRepository } from '../../../blogs/infrastructure/query/blog.query-repository';
import { ResourceWithIdCommand } from '../../../../../core/command/resource-with-id.command';

class UpdatePostDTO {
  constructor(
    public blogId: string,
    public content: string,
    public shortDescription: string,
    public title: string,
  ) {}
}

export class UpdatePostCommand extends ResourceWithIdCommand<UpdatePostDTO> {}

@CommandHandler(UpdatePostCommand)
export class UpdatePostHandler implements ICommandHandler<UpdatePostCommand> {
  constructor(
    @InjectModel(Post.name) protected PostModel: PostModelType,
    protected postRepo: PostRepository,
    protected blogQRepo: BlogQueryRepository,
  ) {}

  async execute({ id, inputModel }: UpdatePostCommand): Promise<void> {
    const blog = await this.blogQRepo.findOrNotFoundFail(inputModel.blogId);
    const post = await this.postRepo.getByIdOrNotFoundFail(id);

    post.updatePost({
      title: inputModel.title,
      content: inputModel.content,
      shortDescription: inputModel.shortDescription,
      blogId: blog.id,
      blogName: blog.name,
    });

    await this.postRepo.save(post);
  }
}
