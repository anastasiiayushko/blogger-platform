import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostRepository } from '../../infrastructure/post.repository';
import { IsUUID } from 'class-validator';
import { Trim } from '../../../../../core/decorators/transform/trim';

export class DeletePostCommand {
  @Trim()
  @IsUUID()
  public postId: string;

  constructor(postId: string) {
    this.postId = postId;
  }
}

@CommandHandler(DeletePostCommand)
export class DeletePostHandler implements ICommandHandler<DeletePostCommand> {
  constructor(protected postRepo: PostRepository) {}

  async execute(cmd: DeletePostCommand): Promise<void> {
    await this.postRepo.getByIdOrNotFoundFail(cmd.postId);
    await this.postRepo.softDeleteById(cmd.postId);
  }
}
