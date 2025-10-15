import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BlogRepository } from '../../infrastructure/blog.repository';
import { PostRepository } from '../../../posts/infrastructure/post.repository';

export class DeleteBlogCommand {
  constructor(public id: string) {}
}

@CommandHandler(DeleteBlogCommand)
export class DeleteBlogHandler
  implements ICommandHandler<DeleteBlogCommand, void>
{
  constructor(
    private blogRepo: BlogRepository,
    private postRepository: PostRepository,
  ) {}

  async execute(command: DeleteBlogCommand): Promise<void> {
    await this.blogRepo.findOrNotFoundFail(command.id);
    await this.blogRepo.softDeleteById(command.id);
    await this.postRepository.softDeleteByBlogId(command.id);
    //::TODO добаивть вызов софт делита для постов
  }
}
