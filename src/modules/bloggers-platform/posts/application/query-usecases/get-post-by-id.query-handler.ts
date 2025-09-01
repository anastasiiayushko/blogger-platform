import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PostQueryRepository } from '../../infrastructure/query-repository/post.query-repository';

export class GetPostByIdQuery {
  constructor(
    public postId: string,
    public userId: string | null,
  ) {}
}

@QueryHandler(GetPostByIdQuery)
export class GetPostByIdQueryHandler
  implements IQueryHandler<GetPostByIdQuery>
{
  constructor(
    protected postQwRepository: PostQueryRepository,
    // protected likeMapQueryService: LikeMapQueryService,
  ) {}

  async execute({ postId, userId }: GetPostByIdQuery) {
    const post = await this.postQwRepository.getByIdOrNotFoundFail(postId);
    // const likeMap = await this.likeMapQueryService.getStatusLikesMapByParams(
    //   [postId],
    //   userId,
    // );
    // const status: LikeStatusEnum = likeMap.get(postId) || LikeStatusEnum.None;
    return post;
  }
}
