import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { Blog, BlogModelType } from '../../domain/blog.entity';
import { BlogRepository } from '../../infrastructure/blog.repository';
import { ResourceWithIdCommand } from '../../../../../core/command/resource-with-id.command';

//::TODO нужно ли создавать instance в presentation layers?
// добавить валидацию
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
  constructor(
    @InjectModel(Blog.name) private BlogModel: BlogModelType,
    private blogRepo: BlogRepository,
  ) {}

  async execute(command: UpdateBlogCommand): Promise<void> {
    const blog = await this.blogRepo.findOrNotFoundFail(command.id);
    blog.updateBlog(command.inputModel);
    await this.blogRepo.save(blog);
  }
}
