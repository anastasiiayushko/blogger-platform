import { Injectable } from '@nestjs/common';
import { BlogRepository } from '../infrastructure/blog.repository';
import { CreateBlogDomainDto } from '../domain/dto/create-blog.domain.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Blog, BlogModelType } from '../domain/blog.entity';
import { DomainException } from '../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

@Injectable()
export class BlogService {
  constructor(
    private blogRepository: BlogRepository,
    @InjectModel(Blog.name) private BlogModel: BlogModelType,
  ) {}

  async create(dto: CreateBlogDomainDto): Promise<string> {
    const blog = this.BlogModel.createInstance(dto);
    await this.blogRepository.save(blog);
    return blog._id.toString();
  }

  async delete(id: string) {
    await this.blogRepository.findOrNotFoundFail(id);
    return await this.blogRepository.delete(id);
  }

  async update(id: string, dto: CreateBlogDomainDto) {
    const blog = await this.blogRepository.findById(id);
    if (!blog) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
      });
    }
    blog.updateBlog(dto);
    await this.blogRepository.save(blog);
  }
}
