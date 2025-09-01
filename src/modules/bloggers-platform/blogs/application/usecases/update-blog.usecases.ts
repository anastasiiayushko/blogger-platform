import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BlogRepository } from '../../infrastructure/blog.repository';
import { ResourceWithIdCommand } from '../../../../../core/command/resource-with-id.command';

class UpdateBlogDTO {
  constructor(
    public name: string,
    public description: string,
    public websiteUrl: string,
  ) {}
}

//::TODO нормальный ли подход?
export class UpdateBlogCommand extends ResourceWithIdCommand<UpdateBlogDTO> {}

@CommandHandler(UpdateBlogCommand)
export class UpdateBlogHandler
  implements ICommandHandler<UpdateBlogCommand, void>
{
  constructor(private blogRepo: BlogRepository) {}

  async execute(command: UpdateBlogCommand): Promise<void> {
    const blog = await this.blogRepo.findOrNotFoundFail(command.id);
    blog.updateBlog(command.inputModel);
    await this.blogRepo.save(blog);
  }
}
