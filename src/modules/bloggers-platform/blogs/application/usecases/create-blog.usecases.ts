import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BlogRepository } from '../../infrastructure/blog.repository';
import { Blog } from '../../domain/blog.entity';

export class CreateBlogCommand {
  constructor(
    public name: string,
    public description: string,
    public websiteUrl: string,
  ) {}
}

@CommandHandler(CreateBlogCommand)
export class CreateBlogHandler
  implements ICommandHandler<CreateBlogCommand, string>
{
  constructor(private blogRepo: BlogRepository) {}

  async execute(command: CreateBlogCommand): Promise<string> {
    const newBlog = Blog.createInstance(command);
    const blogSaved = await this.blogRepo.save(newBlog);
    return blogSaved.id;
  }
}
