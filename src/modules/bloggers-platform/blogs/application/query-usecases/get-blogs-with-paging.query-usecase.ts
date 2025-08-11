import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { BlogQueryRepository } from '../../infrastructure/query/blog.query-repository';
import { BlogViewDto } from '../../api/view-dto/blog.view-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { GetBlogsQueryParamsInputDto } from '../../api/input-dto/get-blogs-query-params.input-dto';

export class GetBlogsWithPagingQuery {
  constructor(public readonly queryParams: GetBlogsQueryParamsInputDto) {}
}

@QueryHandler(GetBlogsWithPagingQuery)
export class GetBlogsWithPagingQueryHandler
  implements
    IQueryHandler<GetBlogsWithPagingQuery, PaginatedViewDto<BlogViewDto[]>>
{
  constructor(protected blogQRepo: BlogQueryRepository) {}

  async execute(
    query: GetBlogsWithPagingQuery,
  ): Promise<PaginatedViewDto<BlogViewDto[]>> {
    return await this.blogQRepo.getAll(query.queryParams);
  }
}
