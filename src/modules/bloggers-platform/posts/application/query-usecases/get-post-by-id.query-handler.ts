import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PostQueryRepository } from '../../infrastructure/query-repository/post.query-repository';
import { LikeStatusEnum } from '../../../likes/domain/like-status.enum';
import { LikeMapQueryService } from '../../../likes/application/services/like-map.query-service';
import { PostViewDTO } from '../../api/view-dto/post.view-dto';

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
    protected postQRepo: PostQueryRepository,
    protected likeMapQueryService: LikeMapQueryService,
  ) {}

  async execute({ postId, userId }: GetPostByIdQuery) {
    const post = await this.postQRepo.getByIdOrNotFoundFail(postId);
    const likeMap = await this.likeMapQueryService.getStatusLikesMapByParams(
      [postId],
      userId,
    );
    const status: LikeStatusEnum = likeMap.get(postId) || LikeStatusEnum.None;
    return PostViewDTO.mapToView(post, status);
  }
}
