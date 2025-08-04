import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { Blog, BlogModelType } from '../../domain/blog.entity';
import { BlogRepository } from '../../infrastructure/blog.repository';

export class CreateBlogCommand {
  constructor(
    public name: string,
    public description: string,
    public websiteUrl: string,
  ) {}
}

@CommandHandler(CreateBlogCommand)
export class CreateBlogHandler implements ICommandHandler<CreateBlogCommand, string> {
  constructor(
    @InjectModel(Blog.name) private BlogModel: BlogModelType,
    private blogRepo: BlogRepository,
  ) {}

  async execute(command: CreateBlogCommand): Promise<string> {
    const blog = this.BlogModel.createInstance(command);
    await this.blogRepo.save(blog);
    return blog._id.toString();
  }
}
