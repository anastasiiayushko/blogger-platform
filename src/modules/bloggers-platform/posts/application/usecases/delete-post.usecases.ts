import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostRepository } from '../../infrastructure/post.repository';
import { InjectModel } from '@nestjs/mongoose';
import { Post, PostModelType } from '../../domain/post.odm-entity';

export class DeletePostCommand {
  constructor(public id: string) {}
}

@CommandHandler(DeletePostCommand)
export class DeletePostHandler implements ICommandHandler<DeletePostCommand> {
  constructor(
    @InjectModel(Post.name) protected PostModel: PostModelType,
    protected postRepo: PostRepository,
  ) {}

  async execute({ id }: DeletePostCommand): Promise<void> {
    await this.postRepo.getByIdOrNotFoundFail(id);
    await this.postRepo.deleteById(id);
  }
}
