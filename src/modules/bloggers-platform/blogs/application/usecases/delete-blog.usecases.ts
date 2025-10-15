import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BlogRepository } from '../../infrastructure/blog.repository';

export class DeleteBlogCommand {
  constructor(public id: string) {}
}

@CommandHandler(DeleteBlogCommand)
export class DeleteBlogHandler
  implements ICommandHandler<DeleteBlogCommand, void>
{
  constructor(private blogRepo: BlogRepository) {}

  async execute(command: DeleteBlogCommand): Promise<void> {
    await this.blogRepo.findOrNotFoundFail(command.id);
    await this.blogRepo.delete(command.id);
    //::TODO добаивть вызов софт делита для постов
  }
}
