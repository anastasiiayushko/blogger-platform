import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { BlogQueryRepository } from '../../infrastructure/query/blog.query-repository';
import { BlogViewDto } from '../../api/view-dto/blog.view-dto';

export class GetBlogByIdQuery {
  constructor(public readonly id: string) {}
}

@QueryHandler(GetBlogByIdQuery)
export class GetBlogByIdQueryHandler
  implements IQueryHandler<GetBlogByIdQuery, BlogViewDto>
{
  constructor(protected blogQRepo: BlogQueryRepository) {}

  async execute({ id }: GetBlogByIdQuery): Promise<BlogViewDto> {
    return await this.blogQRepo.findOrNotFoundFail(id);
  }
}
