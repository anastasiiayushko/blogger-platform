import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { Blog, BlogModelType } from '../../domain/blog.entity';
import { BlogRepository } from '../../infrastructure/blog.repository';

export class DeleteBlogCommand {
  constructor(public id: string) {}
}

@CommandHandler(DeleteBlogCommand)
export class DeleteBlogHandler
  implements ICommandHandler<DeleteBlogCommand, boolean>
{
  constructor(
    @InjectModel(Blog.name) private BlogModel: BlogModelType,
    private blogRepo: BlogRepository,
  ) {}

  async execute(command: DeleteBlogCommand): Promise<boolean> {
    await this.blogRepo.findOrNotFoundFail(command.id);
    return await this.blogRepo.delete(command.id);
  }
}
