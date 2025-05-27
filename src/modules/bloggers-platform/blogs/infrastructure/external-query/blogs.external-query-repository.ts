import { Injectable } from '@nestjs/common';
import { Blog, BlogModelType } from '../../domain/blog.entity';
import { BlogExternalDto } from './external-dto/blog.external-dto';
import { InjectModel } from '@nestjs/mongoose';
import { DomainException } from '../../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';

@Injectable()
export class BlogsExternalQueryRepository {
  constructor(@InjectModel(Blog.name) private BlogModel: BlogModelType) {}

  async getByIdOrNotFoundFail(id: string): Promise<BlogExternalDto> {
    const blog = await this.BlogModel.findOne({
      _id: id,
    });

    if (!blog) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Blog not found',
      });
    }

    return BlogExternalDto.mapToView(blog);
  }
}
