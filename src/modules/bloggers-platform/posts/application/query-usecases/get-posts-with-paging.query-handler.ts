import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PostQueryRepository } from '../../infrastructure/query-repository/post.query-repository';
import { GetPostQueryParams } from '../../api/input-dto/get-post-query-params.input-dto';
import { GetPostFilterContextInputDTO } from '../../infrastructure/query-repository/dto/get-post-filter-context-input-dto';

export class GetPostsWithPagingQuery {
  constructor(
    public userId: string | null = null,
    public query: GetPostQueryParams,
    public filterContext: GetPostFilterContextInputDTO | null = null,
  ) {}
}

@QueryHandler(GetPostsWithPagingQuery)
export class GetPostWithPagingQueryHandler
  implements IQueryHandler<GetPostsWithPagingQuery>
{
  constructor(
    protected postQwRepository: PostQueryRepository,
    // protected likeMapQueryService: LikeMapQueryService,
  ) {}

  async execute({ query, filterContext, userId }: GetPostsWithPagingQuery) {
    return await this.postQwRepository.getAll(query, filterContext);
    // const parentIds = result.items.map((post) => post.id.toString());
    // const likeMap = await this.likeMapQueryService.getStatusLikesMapByParams(
    //   parentIds,
    //   userId,
    // );
  }
}
